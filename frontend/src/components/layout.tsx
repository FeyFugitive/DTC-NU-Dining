import {
  CalendarDays,
  Heart,
  Home,
  ListTodo,
  Moon,
  MoreHorizontal,
  Sun,
  User,
} from "lucide-react"
import * as React from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthProvider"
import AccountPopup from "./account-popup"
// import FeedbackButton from "./feedback-button"
import { useTheme } from "./theme-provider"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ")

function TabIcon({
  to,
  end,
  icon: Icon,
  label,
}: {
  to: string
  end?: boolean
  icon: React.ElementType
  label: string
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors sm:py-2 sm:text-[11px]",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [accountPopupOpen, setAccountPopupOpen] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const { token } = useAuth()

  return (
    <>
      {/* Full-bleed backdrop on wide screens; phone column centered */}
      <div className="flex min-h-screen justify-center bg-background md:bg-muted/30 dark:md:bg-muted/15">
        <div className="flex h-screen w-full max-w-phone flex-col overflow-hidden bg-background md:shadow-[0_0_48px_-8px_rgba(0,0,0,0.12)] dark:md:shadow-[0_0_48px_-8px_rgba(0,0,0,0.45)]">
          <header className="z-40 flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-background/80 app-px">
            <Link to="/" className="text-sm font-bold tracking-tight text-foreground">
              NU Eats
            </Link>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setAccountPopupOpen(true)}
                aria-label="Account"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pt-2">
            <div className="app-px pb-4">{children}</div>
          </main>

          <nav
            className="z-50 shrink-0 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] backdrop-blur-md dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.35)]"
            aria-label="Primary"
          >
            <div className="flex items-stretch justify-around">
              <TabIcon to="/" end icon={Home} label="Home" />
              <TabIcon to="/preferences" icon={Heart} label="Favorites" />
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors sm:py-2 sm:text-[11px]",
                      ["/all", "/hours"].some((p) => location.pathname.startsWith(p))
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                    <span>More</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2">
                  <SheetHeader className="sr-only">
                    <SheetTitle>More options</SheetTitle>
                  </SheetHeader>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Navigation
                  </p>
                  <nav className="flex flex-col gap-1">
                    <Link
                      to="/all"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent"
                    >
                      <ListTodo className="h-4 w-4 text-primary" />
                      All menu items
                    </Link>
                    <Link
                      to="/hours"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent"
                    >
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Dining hours
                    </Link>
                    <Button
                      variant="ghost"
                      className="h-auto justify-start gap-3 rounded-xl px-3 py-3 font-medium"
                      onClick={() => {
                        setMoreOpen(false)
                        setAccountPopupOpen(true)
                      }}
                    >
                      <User className="h-4 w-4 text-primary" />
                      Account {token ? "" : "(sign in)"}
                    </Button>
                  </nav>
                  {/* <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <FeedbackButton />
                  </div> */}
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </div>
      <AccountPopup isOpen={accountPopupOpen} onClose={() => setAccountPopupOpen(false)} />
    </>
  )
}
