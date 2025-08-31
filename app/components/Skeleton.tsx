export default function Skeleton({
  className = "h-4 w-full",
}: {
  className?: string;
}) {
  return (
    <div
      className={
        "relative overflow-hidden rounded-[var(--radius)] bg-[color:var(--surface-2)] " +
        className
      }
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
