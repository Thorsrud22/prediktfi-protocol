"use client";

import Link from "next/link";
import { timeUntil, lamportsToSol } from "../../lib/market-helpers";
import { formatSol, formatNumber } from "../../lib/format";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

interface Creator {
  id: string;
  name: string;
  avatar: string;
  type: "KOL" | "EXPERT" | "COMMUNITY" | "PREDIKT";
}

interface EnhancedMarketCardProps {
  id: string;
  title: string;
  summary: string;
  endsAt: string; // ISO string
  volume: number; // in SOL
  creator?: Creator;
  featured?: boolean;
  className?: string;
}

const getBadgeVariant = (type: string) => {
  switch (type) {
    case "KOL":
      return "success";
    case "EXPERT":
      return "warning";
    case "PREDIKT":
      return "default";
    default:
      return "secondary";
  }
};

export default function EnhancedMarketCard({
  id,
  title,
  summary,
  endsAt,
  volume,
  creator,
  featured,
  className,
}: EnhancedMarketCardProps) {
  const endDate = new Date(endsAt);
  const timeLeft = timeUntil(endsAt.split('T')[0]);
  const formattedVolume = formatSol(volume);

  return (
    <Link href={`/market/${id}`} className={className}>
      <Card 
        variant="interactive" 
        className={`h-full transition-all duration-200 ${featured ? 'ring-1 ring-[color:var(--accent)]/20' : ''}`}
      >
        {/* Header with creator info */}
        {creator && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar 
              src={creator.avatar}
              alt={`${creator.name} avatar`}
              size="md"
            />
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium text-[color:var(--text)] truncate">
                {creator.name}
              </span>
              <Badge 
                variant={getBadgeVariant(creator.type) as any}
                size="sm"
              >
                {creator.type}
              </Badge>
            </div>
            {featured && (
              <Badge variant="warning" size="sm">
                Featured
              </Badge>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-base font-semibold text-[color:var(--text)] mb-2 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-[color:var(--muted)] mb-3 line-clamp-2">
          {summary}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Badge variant="outline" size="sm">
            {timeLeft}
          </Badge>
          <Badge variant="outline" size="sm">
            {formattedVolume} SOL
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
