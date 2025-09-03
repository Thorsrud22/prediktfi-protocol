import { Metadata } from 'next';
import PricingTable from '../components/PricingTable';

export const metadata: Metadata = {
  title: 'Pricing - Predikt | AI-Powered Prediction Platform',
  description: 'Choose your plan for unlimited AI insights. Free tier with 10 daily predictions, Pro for unlimited access with priority processing.',
  alternates: {
    canonical: 'https://predikt.fi/pricing'
  },
  openGraph: {
    title: 'Pricing - Predikt',
    description: 'Choose your plan for unlimited AI insights. Free tier with 10 daily predictions, Pro for unlimited access.',
    url: 'https://predikt.fi/pricing',
    siteName: 'Predikt',
    type: 'website'
  }
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[--text] mb-6">
            Predikt Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Unlimited insights, faster models, priority processing
          </p>
        </div>

        {/* Pricing Table */}
        <PricingTable />

        {/* Beta Code Section */}
        <div className="mt-16 text-center">
          <div className="bg-[--surface] border border-[--border] rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-[--text] mb-4">
              Have a beta code?
            </h3>
            <form action="/api/billing/redeem" method="POST" className="space-y-4">
              <input
                type="text"
                name="code"
                placeholder="Enter your beta code"
                className="w-full px-3 py-2 border border-[--border] rounded-lg bg-[--surface] text-[--text] focus:outline-none focus:ring-2 focus:ring-[--accent]"
                required
              />
              <button
                type="submit"
                className="w-full bg-[--accent] text-white py-2 px-4 rounded-lg font-medium hover:bg-[--accent]/90 transition-colors"
              >
                Redeem Code
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[--text] text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-[--text] mb-2">
                What's included in the Free plan?
              </h3>
              <p className="text-gray-600">
                You get 10 AI-powered insights per day, access to the community feed, and pre-built templates to get started quickly.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[--text] mb-2">
                How does the Pro plan work?
              </h3>
              <p className="text-gray-600">
                Pro gives you unlimited insights with faster processing, advanced prompts, and priority support. Crypto payments coming soon.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[--text] mb-2">
                Can I upgrade anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade to Pro at any time. Your quota resets immediately and you get access to all Pro features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
