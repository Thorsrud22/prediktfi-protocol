import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { trackServer } from '../lib/analytics';

export const metadata: Metadata = {
  title: 'Manage Pro • Predikt',
  description: 'Manage your Predikt Pro subscription and account settings.',
};

export default async function AccountPage() {
  const c = await cookies();
  const plan = c.get('predikt_plan')?.value === 'pro' ? 'Pro' : 'Free';
  
  // Track page view
  trackServer('pricing_viewed', { where: 'account' });

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
                plan === 'Pro' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {plan}
              </span>
              {plan === 'Pro' && (
                <p className="text-sm text-[--muted] mt-2">
                  ✓ Unlimited insights • Priority processing • Advanced prompts
                </p>
              )}
              {plan === 'Free' && (
                <p className="text-sm text-[--muted] mt-2">
                  10 insights per day • Community features
                </p>
              )}
            </div>
            {plan === 'Free' && (
              <a 
                href="/pricing" 
                className="px-4 py-2 bg-[--accent] text-white rounded-md hover:bg-[--accent]/90"
              >
                Upgrade to Pro
              </a>
            )}
          </div>
        </div>

        {/* Redeem Code Section */}
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
