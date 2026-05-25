import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { arrayUnion, doc, getDoc, onSnapshot, runTransaction, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable, type UploadTask } from "firebase/storage";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { db, storage } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { DailyItem } from "@/types/ItemTypes";
import {
  canonicalFoodItemKey,
  canonicalFoodItemKeyFromParts,
  canonicalFoodItemKeyFromSearchParams,
  foodItemPhotoDocIdFromSlotKey,
} from "@/util/foodItemNav";
import { useAuth } from "@/context/AuthProvider";

const COLLECTION = "menuItemPhotos";
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_PHOTOS = 12;
const UPLOAD_TIMEOUT_MS = 60_000;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function mimeFromFilename(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return null;
}

function resolveImageContentType(file: File): string | null {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const guessed = mimeFromFilename(file.name);
  if (guessed) return guessed;
  return file.type || null;
}

function formatFirebaseOrError(err: unknown): string {
  if (err instanceof FirebaseError) return `${err.code}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Decode object path from a Firebase Storage download URL (v0 REST shape). */
function objectPathFromDownloadUrl(downloadUrl: string): string | null {
  try {
    const base = downloadUrl.split("?")[0];
    const m = base.match(/\/o\/(.+)$/);
    if (!m?.[1]) return null;
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out (${Math.round(ms / 1000)}s). Check network and Firebase Storage rules.`));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/** Resolves when the upload task completes, or rejects and cancels the task after `ms`. */
function uploadTaskWithTimeout(task: UploadTask, ms: number, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        task.cancel();
      } catch {
        /* ignore */
      }
      reject(
        new Error(
          `${label} timed out (${Math.round(ms / 1000)}s). Check Storage bucket env var, CORS, and Storage rules for path menuItemPhotos/.`,
        ),
      );
    }, ms);
    task.then(
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      },
      (err: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export type FoodPhotoEntry = {
  url: string;
  uid?: string;
  at?: number;
};

function normalizeFirestorePhotos(raw: unknown): FoodPhotoEntry[] {
  const list: FoodPhotoEntry[] = Array.isArray(raw) ? raw : [];
  return list
    .filter((p) => p && typeof p.url === "string")
    .map((p) => {
      let at: number | undefined;
      if (typeof p.at === "number") at = p.at;
      else if (p.at && typeof (p.at as { toMillis?: () => number }).toMillis === "function") {
        at = (p.at as { toMillis: () => number }).toMillis();
      }
      return {
        url: p.url,
        uid: typeof p.uid === "string" ? p.uid : undefined,
        at,
      };
    })
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

function mergeUniquePhotos(photos: FoodPhotoEntry[]): FoodPhotoEntry[] {
  const byUrl = new Map<string, FoodPhotoEntry>();
  for (const p of photos) {
    const prev = byUrl.get(p.url);
    if (!prev || (p.at ?? 0) > (prev.at ?? 0)) {
      byUrl.set(p.url, p);
    }
  }
  return [...byUrl.values()].sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

function buildSlotKeyCandidates(item: DailyItem, searchParams: URLSearchParams): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (k: string | null | undefined) => {
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(k);
  };

  // Primary: deterministic key from URL params (stable across refresh).
  add(canonicalFoodItemKeyFromSearchParams(searchParams));
  // Legacy: key derived from row object.
  add(canonicalFoodItemKey(item));

  // Legacy variant: raw URL fields without normalization (older experiments).
  const name = searchParams.get("name");
  const location = searchParams.get("location");
  const date = searchParams.get("date");
  const station = searchParams.get("station");
  const meal = searchParams.get("meal");
  if (name && location && date && station && meal) {
    add([date, location, meal, station, name].join("|"));
    // Backend-style order/casing compatibility candidate.
    add(
      canonicalFoodItemKeyFromParts(
        name.trim().toLowerCase(),
        location.trim().toLowerCase(),
        date.trim(),
        station.trim().toLowerCase(),
        meal.trim().toLowerCase(),
      ),
    );
  }

  return out;
}

type Props = {
  item: DailyItem;
  searchParams: URLSearchParams;
  onNeedAuth: () => void;
};

export function FoodItemPhotos({ item, searchParams, onNeedAuth }: Props) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  /** Candidate keys cover current + legacy hash strategies so refresh still finds old uploads. */
  const slotKeyCandidates = useMemo(
    () => buildSlotKeyCandidates(item, searchParams),
    [item, searchParams],
  );
  const dishSlotKey = slotKeyCandidates[0] ?? canonicalFoodItemKey(item);
  const dishSlotKeyRef = useRef(dishSlotKey);
  dishSlotKeyRef.current = dishSlotKey;
  const candidateDocIdsRef = useRef<string[]>([]);
  const photosByDocRef = useRef<Record<string, FoodPhotoEntry[]>>({});

  const photosCountRef = useRef(0);
  const [photos, setPhotos] = useState<FoodPhotoEntry[]>([]);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const firebaseReady = !!db && !!storage;

  const applyPhotosFromSnap = useCallback((raw: unknown): FoodPhotoEntry[] => {
    const normalized = normalizeFirestorePhotos(raw);
    return normalized;
  }, []);

  const applyPhotosFromDocs = useCallback((docs: Record<string, FoodPhotoEntry[]>) => {
    const merged = mergeUniquePhotos(Object.values(docs).flat());
    setPhotos(merged);
    photosCountRef.current = merged.length;
    setFirestoreError(null);
  }, []);

  useEffect(() => {
    if (!db || !firebaseReady) return;
    const firestore = db;

    let cancelled = false;
    let unsub: (() => void) | undefined;

    void (async () => {
      const ids = await Promise.all(slotKeyCandidates.map((k) => foodItemPhotoDocIdFromSlotKey(k)));
      if (cancelled) return;

      const uniqueIds = [...new Set(ids)];
      candidateDocIdsRef.current = uniqueIds;
      photosByDocRef.current = {};
      const unsubs = uniqueIds.map((id) => {
        const dref = doc(firestore, COLLECTION, id);
        return onSnapshot(
          dref,
          (snap) => {
            photosByDocRef.current[id] = applyPhotosFromSnap(snap.data()?.photos);
            applyPhotosFromDocs(photosByDocRef.current);
          },
          (err) => {
            setFirestoreError(err.message);
          },
        );
      });
      unsub = () => {
        for (const u of unsubs) u();
      };
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [dishSlotKey, slotKeyCandidates, firebaseReady, db, applyPhotosFromSnap, applyPhotosFromDocs]);

  /** Re-read the photo doc from the local Firestore cache (includes just-committed writes). Avoid `getDocFromServer` here — it can return pre-write server state and wipe the UI. */
  const refreshPhotosFromCache = useCallback(
    async () => {
      if (!db) return;
      const ids = candidateDocIdsRef.current;
      const byDoc: Record<string, FoodPhotoEntry[]> = {};
      for (const id of ids) {
        const snap = await getDoc(doc(db, COLLECTION, id));
        byDoc[id] = applyPhotosFromSnap(snap.data()?.photos);
      }
      photosByDocRef.current = byDoc;
      applyPhotosFromDocs(byDoc);
    },
    [db, applyPhotosFromSnap, applyPhotosFromDocs],
  );

  const handlePick = useCallback(() => {
    if (!token || !user) {
      onNeedAuth();
      return;
    }
    fileRef.current?.click();
  }, [token, user, onNeedAuth]);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !db || !storage || !user) return;

      if (photosCountRef.current >= MAX_PHOTOS) {
        toast({ title: "Photo limit", description: `You can add up to ${MAX_PHOTOS} photos per dish.`, variant: "destructive" });
        return;
      }
      const contentType = resolveImageContentType(file);
      if (!contentType || !ALLOWED_MIME.has(contentType)) {
        toast({
          title: "Unsupported file",
          description: "Please use JPEG, PNG, WebP, or GIF (some exports omit type — try renaming to .jpg if needed).",
          variant: "destructive",
        });
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast({
          title: "File too large",
          description: "Maximum size is 4 MB.",
          variant: "destructive",
        });
        return;
      }

      // Resolve doc id here so upload never waits on useEffect state (avoids stuck UI if state lags).
      let docId: string;
      try {
        docId = await foodItemPhotoDocIdFromSlotKey(dishSlotKeyRef.current);
      } catch {
        toast({ title: "Could not prepare upload", description: "Try again in a moment.", variant: "destructive" });
        return;
      }

      setUploading(true);
      try {
        const extGuess = file.name.split(".").pop()?.toLowerCase();
        const ext =
          extGuess && ["jpg", "jpeg", "png", "webp", "gif"].includes(extGuess)
            ? extGuess === "jpg"
              ? "jpeg"
              : extGuess
            : "jpeg";
        const objectPath = `${COLLECTION}/${docId}/${crypto.randomUUID()}.${ext}`;
        const storageRef = ref(storage, objectPath);
        const uploadTask = uploadBytesResumable(storageRef, file, { contentType });
        await uploadTaskWithTimeout(uploadTask, UPLOAD_TIMEOUT_MS, "Upload");
        const url = await withTimeout(getDownloadURL(storageRef), 30_000, "Photo link");

        await withTimeout(
          setDoc(
            doc(db, COLLECTION, docId),
            {
              slotKey: dishSlotKeyRef.current,
              photos: arrayUnion({
                url,
                uid: user.uid,
                at: Date.now(),
              }),
            },
            { merge: true },
          ),
          30_000,
          "Save photo",
        );

        await refreshPhotosFromCache();
        toast({ title: "Photo added", description: "Thanks — it will show here for everyone." });
      } catch (err) {
        const msg = formatFirebaseOrError(err);
        toast({ title: "Upload failed", description: msg, variant: "destructive" });
      } finally {
        void Promise.resolve().then(() => {
          setUploading(false);
        });
      }
    },
    [db, storage, user, toast, refreshPhotosFromCache],
  );

  const handleDeletePhoto = useCallback(
    async (entry: FoodPhotoEntry) => {
      if (!db || !storage || !user || entry.uid !== user.uid) return;

      setDeletingUrl(entry.url);
      try {
        let docId: string;
        try {
          docId = await foodItemPhotoDocIdFromSlotKey(dishSlotKeyRef.current);
        } catch {
          toast({ title: "Could not remove photo", description: "Try again in a moment.", variant: "destructive" });
          return;
        }

        let removedAny = false;
        const candidateIds = candidateDocIdsRef.current.length > 0 ? candidateDocIdsRef.current : [docId];
        for (const id of candidateIds) {
          const dref = doc(db, COLLECTION, id);
          const removedHere = await withTimeout(
            runTransaction(db, async (tx) => {
              const snap = await tx.get(dref);
              const raw = snap.data()?.photos;
              const list: unknown[] = Array.isArray(raw) ? raw : [];
              const next = list.filter((row) => {
                if (!row || typeof row !== "object") return true;
                const o = row as { url?: unknown };
                return o.url !== entry.url;
              });
              if (next.length === list.length) return false;
              tx.set(dref, { photos: next }, { merge: true });
              return true;
            }),
            30_000,
            "Remove photo",
          );
          removedAny = removedAny || removedHere;
        }
        if (!removedAny) {
          throw new Error("Photo metadata was not found in Firestore for this dish.");
        }

        try {
          const objectPath = objectPathFromDownloadUrl(entry.url);
          if (objectPath) {
            await withTimeout(deleteObject(ref(storage, objectPath)), 30_000, "Delete file");
          }
        } catch {
          /* Firestore already updated; orphan file is acceptable */
        }

        await refreshPhotosFromCache();
        toast({ title: "Photo removed", description: "It no longer appears for this dish." });
      } catch (err) {
        const msg = formatFirebaseOrError(err);
        toast({ title: "Could not remove photo", description: msg, variant: "destructive" });
      } finally {
        setDeletingUrl(null);
      }
    },
    [db, storage, user, toast, refreshPhotosFromCache],
  );

  if (!firebaseReady) {
    return (
      <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Photos</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Photo uploads need Firebase (Firestore + Storage) configured in this app. Add your web SDK env vars and
          enable Storage in the Firebase console.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Photos</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={uploading}
          onClick={handlePick}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Add photo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFile}
        />
      </div>

      {firestoreError && (
        <p className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Could not load photos ({firestoreError}). Check Firestore rules for collection{" "}
          <code className="rounded bg-muted px-1">{COLLECTION}</code>.
        </p>
      )}

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/30 py-10">
          <ImageIcon className="h-10 w-10 text-muted-foreground/60" aria-hidden />
          <p className="text-sm text-muted-foreground">No photos yet — be the first to add one.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p, i) => {
            const canDelete = !!user && p.uid === user.uid;
            const busy = deletingUrl === p.url;
            return (
              <li key={`${p.url}-${i}`} className="relative aspect-square overflow-hidden rounded-lg border border-border/80 bg-muted">
                <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                {canDelete && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8 rounded-full border border-border/80 bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background"
                    disabled={busy}
                    aria-label="Remove your photo"
                    onClick={() => void handleDeletePhoto(p)}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Community photos — please only upload pictures you took of this dish. Signed-in users only.
      </p>
    </section>
  );
}
