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
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors",
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
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
          <Link to="/" className="text-sm font-bold tracking-tight text-foreground">
            NU Eats
          </Link>
          <div className="flex items-center gap-1">
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

        <main className="flex w-full flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-2 sm:pt-3">
          <div className="mx-auto w-full max-w-2xl flex-1 px-3 sm:px-4">{children}</div>
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] backdrop-blur-md dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.35)]"
          aria-label="Primary"
        >
          <div className="mx-auto flex max-w-2xl items-stretch justify-around">
            <TabIcon to="/" end icon={Home} label="Home" />
            <TabIcon to="/preferences" icon={Heart} label="Favorites" />
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors",
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
      <AccountPopup isOpen={accountPopupOpen} onClose={() => setAccountPopupOpen(false)} />
    </>
  )
}
