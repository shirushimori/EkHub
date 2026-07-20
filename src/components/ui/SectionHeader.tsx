import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-end justify-between", className)}>
      <div>
        <h2 className="text-lg font-bold text-primary md:text-xl">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-secondary">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
