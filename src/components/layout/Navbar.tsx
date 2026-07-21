import { Link, useLocation } from "react-router";
import { Search, Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { SourceSelector } from "@/components/ui/SourceSelector";

interface NavbarProps {
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
}

export function Navbar({ onMenuToggle, onSearchOpen }: NavbarProps) {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border/50 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center px-4 lg:px-8">
        <div className="flex w-[200px] items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-surface hover:text-primary lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://raw.githubusercontent.com/shirushimori/shirushimori/refs/heads/main/assets/pfp1.jpg"
              alt="hub"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="hidden text-lg font-bold text-primary sm:block">
              hub
            </span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {[
            { to: "/", label: "Home" },
            { to: "/movies", label: "Movies" },
            { to: "/series", label: "Series" },
            { to: "/anime", label: "Anime" },
          ].map((link) => {
            const isActive =
              link.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-surface text-primary"
                    : "text-secondary hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex w-[200px] items-center justify-end gap-1.5">
          <SourceSelector />
          <button
            onClick={onSearchOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary hover:bg-surface hover:text-primary"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <NotificationBell />
        </div>
      </div>
    </nav>
  );
}
