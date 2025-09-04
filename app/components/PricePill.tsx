export default function PricePill({
  label,
  price,
  trend = "neutral",
}: {
  label: string;
  price: number | string;
  trend?: "up" | "down" | "neutral";
}) {
  const color =
    trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#a9b4c2";
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface)]/70 px-3 py-1 text-sm">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-[color:var(--muted)]">{label}</span>
      <span className="font-semibold text-[color:var(--text)]">{price}</span>
    </div>
  );
}
