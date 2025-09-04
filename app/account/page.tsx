import { Metadata } from 'next';
import { trackServer } from '../lib/analytics';
import { getPlanFromRequest } from '../lib/plan';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'Manage Pro • Predikt',
  description: 'Manage your Predikt Pro subscription and account settings.',
};

export default async function AccountPage() {
  const headersList = await headers();
  const plan = headersList.get('x-plan') || 'free';
  const planDisplayName = plan === 'pro' ? 'Pro' : 'Free';
  
  // Track page view
  trackServer('account_viewed', { plan });

  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--text] mb-2">Manage Pro</h1>
          <p className="text-[--muted]">Your account and subscription details</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-[--surface] border border-[--border] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-[--text] mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                plan === 'pro' 
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {planDisplayName}
              </span>
              {plan === 'pro' && (
                <div className="mt-2">
                  <p className="text-sm text-[--muted]">
                    ✓ Unlimited insights • Priority processing • Advanced prompts
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    🚀 No rate limits applied
                  </p>
                </div>
              )}
              {plan === 'free' && (
                <p className="text-sm text-[--muted] mt-2">
                  10 insights per day • Community features
                </p>
              )}
            </div>
            {plan === 'free' && (
              <a 
                href="/pricing" 
                className="px-4 py-2 bg-[--accent] text-white rounded-md hover:bg-[--accent]/90"
              >
                Upgrade to Pro
              </a>
            )}
          </div>
        </div>

        {/* Pro Features Section */}
        {plan === 'pro' && (
          <div className="bg-[--surface] border border-[--border] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Pro Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[--background] rounded-lg border border-[--border]">
                <h3 className="font-medium text-[--text] mb-2">🚀 Rate Limit Bypass</h3>
                <p className="text-sm text-[--muted]">
                  No waiting - get unlimited insights with priority processing
                </p>
              </div>
              <div className="p-4 bg-[--background] rounded-lg border border-[--border]">
                <h3 className="font-medium text-[--text] mb-2">🎯 Advanced Prompts</h3>
                <p className="text-sm text-[--muted]">
                  Access to sophisticated AI models and detailed analysis
                </p>
              </div>
              <div className="p-4 bg-[--background] rounded-lg border border-[--border]">
                <h3 className="font-medium text-[--text] mb-2">📊 Enhanced Analytics</h3>
                <p className="text-sm text-[--muted]">
                  Detailed tracking and insights into your prediction patterns
                </p>
              </div>
              <div className="p-4 bg-[--background] rounded-lg border border-[--border]">
                <h3 className="font-medium text-[--text] mb-2">🎨 Studio Pro</h3>
                <p className="text-sm text-[--muted]">
                  Advanced prediction studio with premium features
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Redeem Code Section - only show for free users */}
        {plan === 'free' && (
          <div className="bg-[--surface] border border-[--border] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Have a License Code?</h2>
            <form action="/api/billing/redeem" method="POST" className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-[--text] mb-2">
                  License Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="license"
                  placeholder="Paste your license code here"
                  className="w-full px-3 py-2 border border-[--border] rounded-lg bg-[--background] text-[--text] focus:outline-none focus:ring-2 focus:ring-[--accent]"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[--accent] text-white rounded-lg hover:bg-[--accent]/90"
              >
                Redeem Code
              </button>
            </form>
          </div>
        )}

        {/* Quick Links */}
        <div className="text-center">
          <p className="text-sm text-[--muted] mb-4">Need help?</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="/legal/terms" className="text-[--accent] hover:underline">Terms</a>
            <a href="/legal/privacy" className="text-[--accent] hover:underline">Privacy</a>
            <a href="/legal/refund" className="text-[--accent] hover:underline">Refund Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
