import { Link } from "react-router";
import { Bookmark, History, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const quickLinks = [
  { to: "/bookmarks", icon: Bookmark, label: "Bookmarks", color: "text-accent" },
  { to: "/history", icon: History, label: "History", color: "text-success" },
  { to: "/settings", icon: Settings, label: "Settings", color: "text-secondary" },
];

export default function LibraryPage() {
  return (
    <div className="px-4 py-6 md:px-8">
      <h1 className="mb-1 text-2xl font-bold text-primary">Library</h1>
      <p className="mb-6 text-sm text-secondary">Your personal collection</p>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {quickLinks.map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-surface"
          >
            <Icon className={cn("h-6 w-6", color)} />
            <span className="text-sm font-medium text-primary">{label}</span>
          </Link>
        ))}
      </div>

      <div className="py-12 text-center">
        <Bookmark className="mx-auto mb-4 h-12 w-12 text-border" />
        <h3 className="mb-1 text-lg font-semibold text-primary">Your Library</h3>
        <p className="text-sm text-secondary">
          Bookmarks and watch history will appear here
        </p>
      </div>
    </div>
  );
}
