"use client";

interface CreatorPillProps {
  avatarUrl?: string;
  handle: string;
  badge?: string;
  xLink?: string;
}

export default function CreatorPill({ 
  avatarUrl, 
  handle, 
  badge, 
  xLink 
}: CreatorPillProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Avatar */}
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={`${handle} avatar`}
          className="w-10 h-10 rounded-full ring-2 ring-[var(--border)]"
        />
      )}
      
      {/* Handle and Badge */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-sm text-[color:var(--text)] font-medium">
            {handle}
          </div>
          <div className="text-xs text-[color:var(--muted)]">Market Creator</div>
        </div>
        
        {/* Badge as chip */}
        {badge && (
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              badge === "KOL"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                : badge === "EXPERT"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : badge === "PREDIKT"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      
      {/* Link to X */}
      {xLink && (
        <a
          href={xLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open X profile for ${handle}`}
          className="ml-auto text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      )}
    </div>
  );
}
