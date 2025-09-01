"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "../components/Card";

type MarketDraft = {
  title: string;
  description: string;
  endDate: string;
  creatorId: string;
  creatorName: string;
  creatorType: "KOL" | "EXPERT" | "COMMUNITY" | "PREDIKT";
};

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<MarketDraft>({
    title: "",
    description: "",
    endDate: "",
    creatorId: "",
    creatorName: "",
    creatorType: "PREDIKT",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if admin is enabled
    const adminEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true';
    if (!adminEnabled) {
      router.push('/404');
      return;
    }
    setIsLoading(false);
  }, [router]);

  // Simple admin key check (in production, use proper auth)
  const handleLogin = () => {
    if (adminKey === process.env.NEXT_PUBLIC_ADMIN_KEY || adminKey === "predikt2025") {
      setIsAuthorized(true);
    } else {
      alert("Invalid admin key");
    }
  };

  const handleCreateMarket = async () => {
    if (!draft.title || !draft.description || !draft.endDate) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (response.ok) {
        alert("Market created successfully!");
        setDraft({
          title: "",
          description: "",
          endDate: "",
          creatorId: "",
          creatorName: "",
          creatorType: "PREDIKT",
        });
        router.push("/markets");
      } else {
        throw new Error("Failed to create market");
      }
    } catch (error) {
      alert("Error creating market: " + String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const marketTemplates = [
    {
      title: "Will [CRYPTO] hit $[PRICE] by [DATE]?",
      description: "[CRYPTO] will reach $[PRICE] USD by [DATE]",
      category: "Crypto",
    },
    {
      title: "Will [COMPANY] stock reach $[PRICE] by [DATE]?",
      description: "[COMPANY] stock price will hit $[PRICE] by [DATE]",
      category: "Stocks",
    },
    {
      title: "Will [EVENT] happen by [DATE]?",
      description: "[EVENT] will occur before [DATE]",
      category: "Events",
    },
  ];

  if (isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="text-center text-[color:var(--muted)]">Loading...</div>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <Card>
          <h1 className="text-2xl font-bold text-[color:var(--text)] mb-6 text-center">
            Admin Access
          </h1>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2"
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              onClick={handleLogin}
              className="w-full btn-primary py-2"
            >
              Login
            </button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-[color:var(--text)] mb-8">
        Market Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Market Templates */}
        <Card>
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
            Quick Templates
          </h2>
          <div className="space-y-3">
            {marketTemplates.map((template, i) => (
              <div
                key={i}
                className="p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[color:var(--surface-2)] transition-colors"
                onClick={() => {
                  setDraft(prev => ({
                    ...prev,
                    title: template.title,
                    description: template.description,
                  }));
                }}
              >
                <div className="font-medium text-[color:var(--text)] text-sm mb-1">
                  {template.category}
                </div>
                <div className="text-[color:var(--muted)] text-sm">
                  {template.title}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Market Creation Form */}
        <Card>
          <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
            Create Market
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
                Title *
              </label>
              <input
                value={draft.title}
                onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2"
                placeholder="Market question..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
                Description *
              </label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2"
                rows={3}
                placeholder="Detailed description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={draft.endDate}
                onChange={(e) => setDraft(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
                Creator Name
              </label>
              <input
                value={draft.creatorName}
                onChange={(e) => setDraft(prev => ({ ...prev, creatorName: e.target.value }))}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2"
                placeholder="Creator display name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
                Creator ID
              </label>
              <input
                value={draft.creatorId}
                onChange={(e) => setDraft(prev => ({ ...prev, creatorId: e.target.value }))}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2"
                placeholder="creator_unique_id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--text)] mb-1">
                Creator Type
              </label>
              <select
                value={draft.creatorType}
                onChange={(e) => setDraft(prev => ({ ...prev, creatorType: e.target.value as any }))}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[color:var(--text)] outline-none focus-visible:ring-2"
              >
                <option value="PREDIKT">Predikt Editorial</option>
                <option value="KOL">Key Opinion Leader</option>
                <option value="EXPERT">Domain Expert</option>
                <option value="COMMUNITY">Community</option>
              </select>
            </div>

            <button
              onClick={handleCreateMarket}
              disabled={isSubmitting}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Market"}
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
