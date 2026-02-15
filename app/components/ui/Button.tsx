"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-[var(--radius-md)]";
    
    const variants = {
      primary: "bg-gradient-to-r from-[var(--interactive-primary)] to-[var(--interactive-hover)] text-white hover:opacity-90 hover:-translate-y-0.5 focus-visible:ring-[var(--interactive-focus)] shadow-lg hover:shadow-xl font-semibold",
      secondary: "bg-[var(--background-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--background-tertiary)] focus-visible:ring-[var(--interactive-focus)]",
      ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background-secondary)] focus-visible:ring-[var(--interactive-focus)]",
      danger: "bg-[var(--color-danger)] text-white hover:opacity-90 focus-visible:ring-[var(--interactive-focus)]",
      outline: "border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--background-secondary)] focus-visible:ring-[var(--interactive-focus)] bg-transparent"
    };

    const sizes = {
      sm: "h-8 px-3 text-[var(--text-xs)]",
      md: "h-10 px-4 text-[var(--text-sm)]",
      lg: "h-12 px-6 text-[var(--text-base)]"
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
export { Button };
