import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  subtitle,
  children,
  className,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-4 flex w-full items-end justify-between gap-3 text-left"
      >
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary md:text-xl">
            {title}
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-secondary transition-transform",
                open && "rotate-180"
              )}
            />
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-secondary">{subtitle}</p>}
        </div>
      </button>
      {open && children}
    </section>
  );
}
