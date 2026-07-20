import { cn } from "@/lib/cn";

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, active, onClick, className }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 will-change-transform",
        "active:scale-95",
        active
          ? "bg-accent text-white"
          : "bg-surface text-secondary hover:bg-card hover:text-primary",
        className
      )}
    >
      {children}
    </button>
  );
}
