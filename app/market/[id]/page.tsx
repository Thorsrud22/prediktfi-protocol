"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyMarketPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect legacy market pages to studio
    router.replace("/studio");
  }, [router]);

  return (
    <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[color:var(--text)] mb-4">
          Page Moved
        </h1>
        <p className="text-[color:var(--muted)] mb-6">
          Prediction markets have been replaced with our AI-first prediction studio.
        </p>
        <p className="text-[color:var(--muted)] text-sm">
          Redirecting to Studio...
        </p>
      </div>
    </div>
  );
}
