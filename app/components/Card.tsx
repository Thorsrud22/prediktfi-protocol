import { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  
  return (
    <div
      className={
        "rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface)]/80 p-6 shadow-token transition-all " + 
        (prefersReducedMotion ? "" : "hover:-translate-y-1 ") +
        "hover:border-[color:var(--border-strong)] hover:shadow-lg group-hover:border-[color:var(--border-strong)] " +
        className
      }
    >
      {children}
    </div>
  );
}
