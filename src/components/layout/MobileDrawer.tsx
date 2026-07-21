import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onSearchOpen?: () => void;
}

const links = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/series", label: "Series" },
  { to: "/anime", label: "Anime" },
  { to: "__search", label: "Search" },
  { to: "/library", label: "Library" },
  { to: "/bookmarks", label: "Bookmarks" },
];

export function MobileDrawer({ open, onClose, onSearchOpen }: MobileDrawerProps) {
  const location = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-bg lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <img
                    src="https://raw.githubusercontent.com/shirushimori/shirushimori/refs/heads/main/assets/pfp1.jpg"
                    alt="Dotrent"
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                  <span className="text-lg font-bold text-primary">Dotrent</span>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-surface hover:text-primary"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="flex flex-col gap-0.5">
                  {links.map(({ to, label }) => {
                    if (to === "__search") {
                      return (
                        <button
                          key={to}
                          onClick={() => {
                            onClose();
                            onSearchOpen?.();
                          }}
                          className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-secondary transition-colors hover:bg-card hover:text-primary"
                        >
                          {label}
                        </button>
                      );
                    }

                    const isActive =
                      to === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={cn(
                          "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-surface text-primary"
                            : "text-secondary hover:bg-card hover:text-primary"
                        )}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
