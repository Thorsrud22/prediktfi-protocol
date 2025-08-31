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
        "rounded-[var(--radius)] border border-[color:var(--brand-1)]/20 bg-gradient-to-br from-[#0c1e40]/50 to-[#12114c]/50 backdrop-blur-sm p-5 shadow-sm transition will-change-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow)] " +
        className
      }
    >
      {children}
    </div>
  );
}
