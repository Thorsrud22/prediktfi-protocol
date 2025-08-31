type Props = {
  value: "yes" | "no" | null;
  onChange: (v: "yes" | "no") => void;
  disabled?: boolean;
};

export default function Segmented({ value, onChange, disabled }: Props) {
  const base =
    "min-h-11 flex-1 rounded-full border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 transition-colors";
  return (
    <div className="flex gap-2" role="tablist" aria-label="Choose side">
      <button
        type="button"
        role="tab"
        aria-selected={value === "yes"}
        disabled={disabled}
        onClick={() => onChange("yes")}
        className={
          base +
          " border-[var(--border)] px-4 py-2 " +
          (value === "yes"
            ? "bg-[color:var(--accent)] text-black"
            : "bg-[color:var(--surface)]/70 text-[color:var(--text)]/85 hover:bg-[color:var(--surface)]")
        }
      >
        YES
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "no"}
        disabled={disabled}
        onClick={() => onChange("no")}
        className={
          base +
          " border-[var(--border)] px-4 py-2 " +
          (value === "no"
            ? "bg-[color:var(--danger)] text-white"
            : "bg-[color:var(--surface)]/70 text-[color:var(--text)]/85 hover:bg-[color:var(--surface)]")
        }
      >
        NO
      </button>
    </div>
  );
}
