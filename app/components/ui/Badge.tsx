"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "sm", ...props }, ref) => {
    const baseClasses = "inline-flex items-center rounded-full font-medium";
    
    const variants = {
      default: "bg-[color:var(--surface-2)] text-[color:var(--text)] border border-[var(--border)]",
      secondary: "bg-[color:var(--muted)]/10 text-[color:var(--muted)]",
      success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      outline: "border border-[var(--border)] text-[color:var(--text)]"
    };

    const sizes = {
      sm: "px-2.5 py-0.5 text-xs",
      md: "px-3 py-1 text-sm"
    };

    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
export { Badge };
