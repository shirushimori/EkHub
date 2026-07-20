import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 will-change-transform",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "primary" && "bg-accent text-white hover:bg-accent-hover active:scale-[0.97]",
          variant === "ghost" && "bg-transparent text-secondary hover:bg-surface hover:text-primary",
          variant === "outline" && "border border-border bg-transparent text-primary hover:bg-surface",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-5 text-sm",
          size === "lg" && "h-12 px-7 text-base",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
