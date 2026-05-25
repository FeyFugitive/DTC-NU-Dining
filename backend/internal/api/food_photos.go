package api

import (
	"backend/internal/db"
	"backend/internal/foodphoto"
	"backend/internal/middleware"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

const maxFoodPhotoBytes = 5 << 20

func readSlotQuery(r *http.Request) (name, loc, date, station, meal string, ok bool) {
	q := r.URL.Query()
	name = strings.TrimSpace(q.Get("name"))
	loc = strings.TrimSpace(q.Get("location"))
	date = strings.TrimSpace(q.Get("date"))
	station = strings.TrimSpace(q.Get("station"))
	meal = strings.TrimSpace(q.Get("meal"))
	ok = name != "" && loc != "" && date != "" && station != "" && meal != ""
	return
}

func detectImageContentType(data []byte) string {
	if len(data) >= 3 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF {
		return "image/jpeg"
	}
	if len(data) >= 12 && string(data[0:4]) == "RIFF" && string(data[8:12]) == "WEBP" {
		return "image/webp"
	}
	if len(data) >= 8 && string(data[0:8]) == "\x89PNG\r\n\x1a\n" {
		return "image/png"
	}
	return ""
}

// ListFoodPhotosHandler GET /api/foodPhotos?name=&location=&date=&station=&meal=
func ListFoodPhotosHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	name, loc, date, station, meal, ok := readSlotQuery(r)
	if !ok {
		http.Error(w, "missing required query: name, location, date, station, meal", http.StatusBadRequest)
		return
	}
	key := foodphoto.KeyFromSlot(name, loc, date, station, meal)
	list, err := db.ListFoodPhotoMetaByKey(key)
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"photos": list})
}

// FoodPhotoImageHandler GET /api/foodPhotos/{id}/image
func FoodPhotoImageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	idStr := mux.Vars(r)["id"]
	id64, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id64 == 0 {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	ct, data, err := db.GetFoodPhotoImage(uint(id64))
	if errors.Is(err, gorm.ErrRecordNotFound) {
		http.NotFound(w, r)
		return
	}
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", ct)
	w.Header().Set("Cache-Control", "public, max-age=3600")
	_, _ = w.Write(data)
}

// UploadFoodPhotoHandler POST /api/foodPhotos (multipart: name,location,date,station,meal,photo file). Requires auth.
func UploadFoodPhotoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID := r.Context().Value(middleware.UserIDKey).(string)

	r.Body = http.MaxBytesReader(w, r.Body, maxFoodPhotoBytes+4096)
	if err := r.ParseMultipartForm(maxFoodPhotoBytes + 1024); err != nil {
		http.Error(w, "payload too large or invalid multipart form", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(r.FormValue("name"))
	loc := strings.TrimSpace(r.FormValue("location"))
	date := strings.TrimSpace(r.FormValue("date"))
	station := strings.TrimSpace(r.FormValue("station"))
	meal := strings.TrimSpace(r.FormValue("meal"))
	if name == "" || loc == "" || date == "" || station == "" || meal == "" {
		http.Error(w, "missing form fields: name, location, date, station, meal", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		http.Error(w, "missing file field \"photo\"", http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxFoodPhotoBytes+1))
	if err != nil || len(data) > maxFoodPhotoBytes {
		http.Error(w, "file too large or unreadable", http.StatusBadRequest)
		return
	}

	ct := detectImageContentType(data)
	if ct == "" {
		ct = header.Header.Get("Content-Type")
		if ct == "" || !strings.HasPrefix(ct, "image/") {
			http.Error(w, "only JPEG, PNG, or WebP images are allowed", http.StatusBadRequest)
			return
		}
	}

	key := foodphoto.KeyFromSlot(name, loc, date, station, meal)
	id, err := db.InsertFoodPhoto(key, userID, ct, data)
	if err != nil {
		http.Error(w, "failed to save photo", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{"id": id})
}
