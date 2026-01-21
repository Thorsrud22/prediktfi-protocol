"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "../components/Card";

type LaunchItem = {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  category: "core" | "content" | "legal" | "testing" | "deployment";
};

export default function LaunchPage() {
  const [items, setItems] = useState<LaunchItem[]>([
    // NOTE: This is a legacy development dashboard for the old prediction market system.
    // Predikt has evolved into an AI-powered evaluation studio platform.

    // Core Platform
    {
      id: "wallet-integration",
      title: "Wallet Integration",
      description: "Phantom & Solflare wallet adapters with devnet connection",
      status: "completed",
      category: "core",
    },
    {
      id: "insight-system",
      title: "Insight System",
      description: "Real and mock insight logging with memo JSON and referral support",
      status: "completed",
      category: "core",
    },
    {
      id: "api-verification",
      title: "API Verification",
      description: "Transaction verification and insight storage endpoints",
      status: "completed",
      category: "core",
    },
    {
      id: "insights-dashboard",
      title: "Insights Dashboard",
      description: "User insights with verification status display",
      status: "completed",
      category: "core",
    },
    {
      id: "creator-attribution",
      title: "Creator Attribution",
      description: "KOL/Creator profiles with referral tracking",
      status: "completed",
      category: "core",
    },

    // Content & Insights
    {
      id: "insight-generator",
      title: "Insight Generator",
      description: "Studio interface for creating AI-backed insights",
      status: "completed",
      category: "content",
    },
    {
      id: "initial-insights",
      title: "Initial Insights",
      description: "3+ seed insights with creator attribution",
      status: "completed",
      category: "content",
    },
    {
      id: "insight-templates",
      title: "Insight Templates",
      description: "Quick templates for crypto, stocks, and events",
      status: "completed",
      category: "content",
    },

    // Legal & Compliance
    {
      id: "terms-of-service",
      title: "Terms of Service",
      description: "Comprehensive ToS for devnet testing platform",
      status: "completed",
      category: "legal",
    },
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      description: "Data collection and usage disclosure",
      status: "completed",
      category: "legal",
    },
    {
      id: "risk-disclaimer",
      title: "Risk Disclaimer",
      description: "Clear warnings about testing environment",
      status: "completed",
      category: "legal",
    },

    // Testing & Quality
    {
      id: "unit-tests",
      title: "Unit Tests",
      description: "Comprehensive test coverage (36/36 passing)",
      status: "completed",
      category: "testing",
    },
    {
      id: "integration-tests",
      title: "Integration Tests",
      description: "E2E testing with wallet and API interactions",
      status: "completed",
      category: "testing",
    },
    {
      id: "build-validation",
      title: "Build Validation",
      description: "Production build successful with zero errors",
      status: "completed",
      category: "testing",
    },

    // Deployment
    {
      id: "env-configuration",
      title: "Environment Configuration",
      description: "Devnet configuration with proper treasury setup",
      status: "completed",
      category: "deployment",
    },
    {
      id: "error-handling",
      title: "Error Handling",
      description: "Graceful error handling and user feedback",
      status: "completed",
      category: "deployment",
    },
    {
      id: "performance-optimization",
      title: "Performance Optimization",
      description: "Optimized builds and loading states",
      status: "completed",
      category: "deployment",
    },
  ]);

  const categories = [
    { id: "core", name: "Core Platform", color: "bg-blue-600" },
    { id: "content", name: "Content", color: "bg-cyan-400" },
    { id: "legal", name: "Legal", color: "bg-blue-400" },
    { id: "testing", name: "Testing", color: "bg-indigo-500" },
    { id: "deployment", name: "Deployment", color: "bg-slate-500" },
  ];

  const getStatusIcon = (status: LaunchItem["status"]) => {
    switch (status) {
      case "completed":
        return <span className="text-green-500">✅</span>;
      case "in-progress":
        return <span className="text-yellow-500">🔄</span>;
      case "pending":
        return <span className="text-gray-500">⏳</span>;
    }
  };

  const getStatusBadge = (status: LaunchItem["status"]) => {
    switch (status) {
      case "completed":
        return <span className="px-3 py-1 text-[8px] font-black uppercase tracking-widest italic rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">Operational</span>;
      case "in-progress":
        return <span className="px-3 py-1 text-[8px] font-black uppercase tracking-widest italic rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Processing</span>;
      case "pending":
        return <span className="px-3 py-1 text-[8px] font-black uppercase tracking-widest italic rounded-full bg-slate-800 text-slate-500 border border-white/5">Queued</span>;
    }
  };

  const completedCount = items.filter(item => item.status === "completed").length;
  const totalCount = items.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-12 bg-slate-900/40 backdrop-blur-md p-10 rounded-[32px] border border-white/5">
        <h2 className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase italic border-l-2 border-blue-500 pl-3 mb-6 inline-block">Protocol Roadmap</h2>
        <h1 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter mb-8 leading-[0.9]">
          Alpha Launch <span className="text-blue-500">.</span>
        </h1>
        <div className="flex items-center gap-6 mb-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
            {completedCount}/{totalCount} Signals Synchronized
          </div>
          <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-1000 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-3xl font-black italic text-cyan-400 tracking-tighter">
            {completionPercentage}%
          </div>
        </div>

        {completionPercentage === 100 && (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg dark:bg-green-900/20 dark:border-green-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🚀</span>
              </div>
              <div className="ml-3">
                <p className="text-green-800 dark:text-green-300 font-medium">
                  Ready for Devnet Alpha Launch! All checklist items are complete.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {categories.map(category => {
        const categoryItems = items.filter(item => item.category === category.id);
        const categoryCompleted = categoryItems.filter(item => item.status === "completed").length;

        return (
          <Card key={category.id}>
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${category.color} shadow-[0_0_10px_rgba(59,130,246,0.3)]`} />
                <h2 className="text-sm font-black text-white uppercase italic tracking-widest">
                  {category.name}
                </h2>
                <div className="text-[10px] font-black text-slate-500 uppercase italic ml-auto">
                  Status: {categoryCompleted}/{categoryItems.length}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {categoryItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">{getStatusIcon(item.status)}</span>
                    <div>
                      <div className="font-black text-xs text-white uppercase italic tracking-tight mb-0.5">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium leading-tight">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">
            Launch Environment
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Network:</span>
              <span className="text-[color:var(--text)]">Solana Devnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Mode:</span>
              <span className="text-[color:var(--text)]">Alpha Testing</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Real Funds:</span>
              <span className="text-red-500">No (Testnet Only)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[color:var(--muted)]">Target Users:</span>
              <span className="text-[color:var(--text)]">Developers & Testers</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xs font-black text-white uppercase italic underline underline-offset-8 mt-2 mb-8 inline-block decoration-blue-500">
            Quick Actions
          </h3>
          <div className="space-y-4">
            <Link
              href="/studio"
              className="block w-full text-center px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic shadow-lg shadow-blue-900/40 hover:brightness-110 active:scale-95 transition-all"
            >
              Open Studio
            </Link>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/feed"
                className="block text-center px-6 py-4 bg-white/5 border border-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-white/10 hover:text-white transition-all"
              >
                View Feed
              </Link>
              <Link
                href="/legal"
                className="block text-center px-6 py-4 bg-white/5 border border-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-white/10 hover:text-white transition-all"
              >
                Legal Terms
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
