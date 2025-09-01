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
  const labelId = `${name}-label`;

  const handleKeyDown = (event: React.KeyboardEvent, side: "YES" | "NO") => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const newSide = side === "YES" ? "NO" : "YES";
      onChange(newSide);
      // Focus the new radio input
      setTimeout(() => {
        const newInput = document.getElementById(`${name}-${newSide.toLowerCase()}`) as HTMLInputElement;
        newInput?.focus();
      }, 0);
    } else if (event.key === " ") {
      event.preventDefault();
      onChange(side);
    }
  };

  const base =
    "w-full flex items-center justify-center rounded-xl border transition-colors h-11 text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2";
  const yesChecked = value === "YES";
  const noChecked = value === "NO";

  return (
    <>
      <h2 id={labelId} className="sr-only">Choose side</h2>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-4" data-testid={testId}>
      <div>
        <input
          type="radio"
          id={`${name}-yes`}
          name={name}
          className="sr-only peer"
          checked={yesChecked}
          onChange={() => onChange("YES")}
          onKeyDown={(e) => handleKeyDown(e, "YES")}
          disabled={disabled}
          aria-checked={yesChecked}
          tabIndex={yesChecked || !value ? 0 : -1}
        />
        <label
          htmlFor={`${name}-yes`}
          data-testid="outcome-yes"
          className={clsx(
            base,
            yesChecked
              ? "bg-emerald-600 border-emerald-500 text-white focus-visible:outline-emerald-400"
              : "bg-white/5 border-white/10 text-white/80 hover:bg-white/[0.08] focus-visible:outline-emerald-400"
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
          onKeyDown={(e) => handleKeyDown(e, "NO")}
          disabled={disabled}
          aria-checked={noChecked}
          tabIndex={noChecked ? 0 : -1}
        />
        <label
          htmlFor={`${name}-no`}
          data-testid="outcome-no"
          className={clsx(
            base,
            noChecked
              ? "bg-rose-600 border-rose-500 text-white focus-visible:outline-rose-400"
              : "bg-white/5 border-white/10 text-white/80 hover:bg-white/[0.08] focus-visible:outline-rose-400"
          )}
        >
          NO
        </label>
      </div>
    </div>
    </>
  );
}
