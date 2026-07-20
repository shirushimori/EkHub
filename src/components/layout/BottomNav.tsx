import { Home, Compass, Film, Tv, Search, Library } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/cn";

interface BottomNavProps {
  onSearchOpen?: () => void;
}

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/movies", icon: Film, label: "Movies" },
  { to: "/series", icon: Tv, label: "Series" },
  { to: "__search", icon: Search, label: "Search" },
  { to: "/library", icon: Library, label: "Library" },
] as const;

export function BottomNav({ onSearchOpen }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-bg/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          if (to === "__search") {
            return (
              <button
                key={to}
                onClick={onSearchOpen}
                className="flex min-w-[48px] flex-col items-center gap-0.5 rounded-lg py-1.5 text-secondary transition-colors"
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          }

          const isActive =
            to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex min-w-[48px] flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors",
                isActive ? "text-accent" : "text-secondary"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
