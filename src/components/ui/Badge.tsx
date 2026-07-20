import { cn } from "@/lib/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "error";
  className?: string;
}

const variantStyles = {
  default: "bg-surface text-secondary",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
} as const;

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
