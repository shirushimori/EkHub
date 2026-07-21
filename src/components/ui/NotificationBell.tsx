import { useState } from "react";
import { Bell, MessageCircle, Mail, X } from "lucide-react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-secondary hover:bg-surface hover:text-primary"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-primary">Notifications</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-secondary hover:bg-surface hover:text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4">
              <p className="mb-4 text-sm leading-relaxed text-secondary">
                If anyone knows integration of video player with anime/movies and shows please contact me on discord.
              </p>

              <div className="flex flex-col gap-2">
                <a
                  href="https://discord.com/users/shirushi_mori"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5865F2]/20 px-3 py-2 text-xs font-medium text-[#5865F2] transition-colors hover:bg-[#5865F2]/30"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  shirushi_mori
                </a>
                <a
                  href="mailto:morishirushi@gmail.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#EA4335]/20 px-3 py-2 text-xs font-medium text-[#EA4335] transition-colors hover:bg-[#EA4335]/30"
                >
                  <Mail className="h-3.5 w-3.5" />
                  morishirushi@gmail.com
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
