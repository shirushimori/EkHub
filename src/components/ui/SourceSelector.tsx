import { useState, useRef, useEffect } from "react";
import { ChevronDown, Database } from "lucide-react";
import { useSourceStore, type SourceMode } from "@/stores/sourceStore";
import { useContentStore } from "@/stores/contentStore";
import { cn } from "@/lib/cn";

const options: { value: SourceMode; label: string; desc: string }[] = [
  { value: "hdhub4u", label: "HDHub4u", desc: "Main source — screenshots, watch links & downloads" },
  { value: "4khdhub", label: "4KHub", desc: "Download links only, no screenshots" },
  { value: "mix", label: "Mix", desc: "Both sources combined" },
];

export function SourceSelector() {
  const { mode, setMode } = useSourceStore();
  const fetchAll = useContentStore((s) => s.fetchAll);
  const loaded = useContentStore((s) => s.loaded);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = options.find((o) => o.value === mode) || options[0];

  const handleSelect = (value: SourceMode) => {
    setMode(value);
    setOpen(false);
    if (loaded) fetchAll();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:border-accent/50"
      >
        <Database className="h-3.5 w-3.5 text-accent" />
        <span>{current.label}</span>
        <ChevronDown className={cn("h-3 w-3 text-secondary transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-lg border border-border bg-card shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                opt.value === mode
                  ? "bg-accent/10"
                  : "hover:bg-surface",
                opt.value === options[0].value && "rounded-t-lg",
                opt.value === options[options.length - 1].value && "rounded-b-lg"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                opt.value === mode ? "text-accent" : "text-primary"
              )}>
                {opt.label}
                {opt.value === mode && (
                  <span className="ml-2 text-[10px] text-accent/70">Active</span>
                )}
              </span>
              <span className="text-[11px] leading-tight text-secondary">{opt.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
