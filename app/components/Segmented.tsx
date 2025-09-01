"use client";

import { useId } from "react";
import clsx from "clsx";

type Props = {
  value: "YES" | "NO" | null;
  onChange: (v: "YES" | "NO") => void;
  disabled?: boolean;
  "data-testid"?: string;
};

export default function Segmented({ value, onChange, disabled, "data-testid": testId }: Props) {
  const name = useId();

  const base =
    "w-full flex items-center justify-center rounded-xl border transition-colors h-11 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";
  const yesChecked = value === "YES";
  const noChecked = value === "NO";

  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-4" data-testid={testId}>
      <div>
        <input
          type="radio"
          id={`${name}-yes`}
          name={name}
          className="sr-only peer"
          checked={yesChecked}
          onChange={() => onChange("YES")}
          disabled={disabled}
          aria-checked={yesChecked}
        />
        <label
          htmlFor={`${name}-yes`}
          data-testid="outcome-yes"
          className={clsx(
            base,
            yesChecked
              ? "bg-emerald-600 border-emerald-500 text-white"
              : "bg-white/5 border-white/10 text-white/80 hover:bg-white/[0.08] focus-visible:ring-emerald-500"
          )}
        >
          YES
        </label>
      </div>

      <div>
        <input
          type="radio"
          id={`${name}-no`}
          name={name}
          className="sr-only peer"
          checked={noChecked}
          onChange={() => onChange("NO")}
          disabled={disabled}
          aria-checked={noChecked}
        />
        <label
          htmlFor={`${name}-no`}
          data-testid="outcome-no"
          className={clsx(
            base,
            noChecked
              ? "bg-rose-600 border-rose-500 text-white"
              : "bg-white/5 border-white/10 text-white/80 hover:bg-white/[0.08] focus-visible:ring-rose-500"
          )}
        >
          NO
        </label>
      </div>
    </div>
  );
}
