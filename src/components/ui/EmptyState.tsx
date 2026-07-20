import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-4xl text-border">{icon}</div>
      )}
      <h3 className="mb-1 text-lg font-semibold text-primary">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-secondary">{description}</p>
      )}
      {action}
    </div>
  );
}
