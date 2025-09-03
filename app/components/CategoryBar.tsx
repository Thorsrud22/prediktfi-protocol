"use client";

interface CategoryBarProps {
  onSelect: (category: string) => void;
  selectedCategory: string;
}

const CATEGORIES = ["All", "KOL", "Expert", "Sports", "Crypto", "Culture", "Predikt"];

export default function CategoryBar({ onSelect, selectedCategory }: CategoryBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-[color:var(--bg)] border-b border-[var(--border)] pb-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              aria-pressed={isActive}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[color:var(--primary)] text-white"
                  : "bg-[color:var(--surface-2)] text-[color:var(--text)] hover:bg-[color:var(--surface)] border border-[var(--border)]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
