import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-skeleton rounded-lg bg-surface", className)}
      aria-hidden="true"
    />
  );
}
