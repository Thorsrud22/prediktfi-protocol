import clsx from "clsx";
import React from "react";

type Props = {
  value: "yes" | "no" | null;
  onChange: (v: "yes" | "no") => void;
  disabled?: boolean;
};

type ChipProps = {
  selected: boolean;
  variant: "yes" | "no";
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const base =
  "h-10 flex-1 rounded-full border border-white/10 px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const idle = "bg-transparent hover:bg-white/5"; // only when not selected

const yesSel =
  "bg-emerald-600 text-white hover:bg-emerald-600 focus-visible:outline-emerald-500";
const noSel =
  "bg-rose-600 text-white hover:bg-rose-600 focus-visible:outline-rose-500";

export function Chip({ selected, variant, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={clsx(base, selected ? (variant === "yes" ? yesSel : noSel) : idle)}
      {...props}
    >
      {children}
    </button>
  );
}

export default function Segmented({ value, onChange, disabled }: Props) {
  return (
    <div role="radiogroup" aria-label="Choose side" className="grid grid-cols-2 gap-3">
      <Chip
        variant="yes"
        selected={value === "yes"}
        onClick={() => onChange("yes")}
        disabled={disabled}
      >
        YES
      </Chip>
      <Chip
        variant="no"
        selected={value === "no"}
        onClick={() => onChange("no")}
        disabled={disabled}
      >
        NO
      </Chip>
    </div>
  );
}
