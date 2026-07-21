import { Link, useLocation } from "react-router";
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Library,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navSections = [
  {
    label: "Content",
    items: [
      { to: "/", icon: Home, label: "Home" },
      { to: "/movies", icon: Film, label: "Movies" },
      { to: "/series", icon: Tv, label: "Series" },
      { to: "/anime", icon: Sparkles, label: "Anime" },
    ],
  },
  {
    label: "Personal",
    items: [
      { to: "/library", icon: Library, label: "Library" },
      { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-border/50 bg-bg pt-14 lg:block">
      <div className="flex h-full flex-col overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-secondary/60">
              {section.label}
            </h3>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ to, icon: Icon, label }) => {
                const isActive =
                  to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(to);

                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-surface text-primary"
                        : "text-secondary hover:bg-card hover:text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
