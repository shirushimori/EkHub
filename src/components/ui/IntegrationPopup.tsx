import { useEffect, useState } from "react";
import { MessageCircle, Mail, X } from "lucide-react";

const STORAGE_KEY = "ekhub_hide_integration_popup";

export function IntegrationPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem(STORAGE_KEY) === "true";
    if (!hidden) setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold text-primary">Video Player Integration</h2>
          <button
            onClick={dismiss}
            className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-surface hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-secondary">
          If anyone knows integration of video player with anime/movies and shows please contact me on discord.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://discord.com/users/shirushi_mori"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            shirushi_mori
          </a>

          <a
            href="mailto:morishirushi@gmail.com"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EA4335] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Mail className="h-4 w-4" />
            morishirushi@gmail.com
          </a>

          <button
            onClick={dismiss}
            className="mt-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:text-primary"
          >
            Don't show this again
          </button>
        </div>
      </div>
    </div>
  );
}
