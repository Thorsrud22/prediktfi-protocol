"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdvancedPage() {
  const [activeTab, setActiveTab] = useState("features");

  const tabs = [
    { id: "features", label: "Features" },
    { id: "analytics", label: "Analytics" },
    { id: "settings", label: "Settings" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1426] via-[#1E3A8A] to-[#5B21B6] text-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Advanced Dashboard</h1>
          <p className="text-xl text-slate-300">
            Advanced features and analytics for PrediktFi
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800/50 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-slate-800/30 rounded-lg p-8">
            {activeTab === "features" && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Advanced Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">AI Predictions</h3>
                    <p className="text-slate-300">Advanced AI-powered prediction algorithms</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Real-time Analytics</h3>
                    <p className="text-slate-300">Live data processing and insights</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Analytics Dashboard</h2>
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
                    <p className="text-slate-300">Track prediction accuracy and user engagement</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Usage Statistics</h3>
                    <p className="text-slate-300">Monitor system usage and optimization opportunities</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Advanced Settings</h2>
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Configuration</h3>
                    <p className="text-slate-300">Advanced system configuration options</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Integrations</h3>
                    <p className="text-slate-300">Connect with external services and APIs</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="text-center mt-8 space-x-4">
            <Link 
              href="/" 
              className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
            <Link 
              href="/studio" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Go to Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
