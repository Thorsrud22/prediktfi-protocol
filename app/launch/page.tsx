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
    // Predikt has evolved into an AI-first prediction studio platform.
    
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
    { id: "core", name: "Core Platform", color: "bg-blue-500" },
    { id: "content", name: "Content", color: "bg-green-500" },
    { id: "legal", name: "Legal", color: "bg-yellow-500" },
    { id: "testing", name: "Testing", color: "bg-purple-500" },
    { id: "deployment", name: "Deployment", color: "bg-red-500" },
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
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Complete</span>;
      case "in-progress":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">In Progress</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">Pending</span>;
    }
  };

  const completedCount = items.filter(item => item.status === "completed").length;
  const totalCount = items.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[color:var(--text)] mb-4">
          Predikt Devnet Alpha Launch
        </h1>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-[color:var(--muted)]">
            {completedCount}/{totalCount} items complete
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-2xl font-bold text-green-500">
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
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${category.color}`} />
                <h2 className="text-xl font-semibold text-[color:var(--text)]">
                  {category.name}
                </h2>
                <div className="text-sm text-[color:var(--muted)]">
                  {categoryCompleted}/{categoryItems.length}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {categoryItems.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[color:var(--surface-2)] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium text-[color:var(--text)]">
                        {item.title}
                      </div>
                      <div className="text-sm text-[color:var(--muted)]">
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
          <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/feed"
              className="block w-full text-center px-4 py-2 bg-[color:var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              View Feed
            </Link>
            <Link
              href="/studio"
              className="block w-full text-center px-4 py-2 border border-[var(--border)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--surface-2)] transition-colors"
            >
              Open Studio
            </Link>
            <Link
              href="/legal"
              className="block w-full text-center px-4 py-2 border border-[var(--border)] text-[color:var(--text)] rounded-lg hover:bg-[color:var(--surface-2)] transition-colors"
            >
              Legal Terms
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
