"use client";

import Link from "next/link";
import { timeUntil, lamportsToSol } from "../lib/market-helpers";
import { formatSol, formatNumber } from "../lib/format";

interface Creator {
  handle: string;
  badge: string;
  avatarUrl: string;
}

interface MarketCardProps {
  id: string;
  title: string;
  subtitle?: string;
  endsAt: number;
  poolLamports: number;
  participants: number;
  creator: Creator;
  category: "KOL" | "Expert" | "Sports" | "Crypto" | "Culture" | "Predikt";
}

export default function MarketCard({
  id,
  title,
  subtitle,
  endsAt,
  poolLamports,
  participants,
  creator,
  category,
}: MarketCardProps) {
  const endDateString = new Date(endsAt).toISOString().split('T')[0];
  const timeLeft = timeUntil(endDateString);
  const volumeSolNumber = poolLamports / 1000000000; // Convert lamports to SOL as number
  const formattedVolume = formatSol(volumeSolNumber);
  const formattedParticipants = formatNumber(participants);

  return (
    <Link 
      href={`/market/${id}`}
      className="block bg-[color:var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4 cursor-pointer hover:bg-[color:var(--surface-2)] transition-colors"
    >
      {/* Creator info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={creator.avatarUrl}
          alt={`${creator.handle} avatar`}
          className="w-8 h-8 rounded-full ring-1 ring-[var(--border)]"
        />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm text-[color:var(--text)] font-medium truncate">
            {creator.handle}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
              creator.badge === "KOL"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                : creator.badge === "EXPERT"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : creator.badge === "PREDIKT"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
            }`}
          >
            {creator.badge}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[color:var(--text)] mb-2 line-clamp-2 leading-tight">
        {title}
      </h3>

      {/* Subtitle if provided */}
      {subtitle && (
        <p className="text-sm text-[color:var(--muted)] mb-3 line-clamp-2">
          {subtitle}
        </p>
      )}

      {/* Chips for ending time and volume */}
      <div className="flex items-center gap-2 text-xs">
        <div className="bg-[color:var(--surface-2)] border border-[var(--border)] rounded-full px-3 py-1 text-[color:var(--muted)]">
          {timeLeft}
        </div>
        <div className="bg-[color:var(--surface-2)] border border-[var(--border)] rounded-full px-3 py-1 text-[color:var(--muted)]">
          {formattedVolume} SOL
        </div>
        <div className="bg-[color:var(--surface-2)] border border-[var(--border)] rounded-full px-3 py-1 text-[color:var(--muted)]">
          {formattedParticipants} Traders
        </div>
      </div>
    </Link>
  );
}
