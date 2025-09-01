export default function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface)]/60 p-4">
      <div className="text-xs uppercase tracking-wide text-[color:var(--muted)]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[color:var(--text)]">
        {value ?? "—"}
      </div>
    </div>
  );
}
