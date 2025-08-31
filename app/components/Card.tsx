import { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface)]/70 p-5 shadow-sm transition will-change-transform hover:-translate-y-1 hover:shadow-[var(--shadow)] motion-reduce:hover:translate-y-0 motion-reduce:transition-shadow " +
        className
      }
    >
      {children}
    </div>
  );
}
