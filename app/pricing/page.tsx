import { Metadata } from 'next';
import PricingTable from '../components/PricingTable';
import { cookies } from 'next/headers';
import { trackServer } from '../lib/analytics';
import Seen from './Seen';

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

export default async function PricingPage() {
  const c = await cookies();
  const plan = c.get('predikt_plan')?.value;
  const isPro = plan === 'pro';
  
  // Track pricing page view
  trackServer('pricing_viewed', { where: 'pricing' });
  
  return (
    <div className="min-h-screen bg-[--background]">
      <Seen />
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[--text] mb-6">
            Predikt Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Unlimited insights, faster models, priority processing. Pay with crypto via Coinbase Commerce.
          </p>
        </div>

        {/* Pricing Table */}
        <PricingTable initialIsPro={isPro} />

        {/* Account Management Link */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-2">Already upgraded?</p>
          <a 
            href="/account" 
            className="text-[--accent] hover:text-[--accent]/80 font-medium"
          >
            Manage Pro →
          </a>
        </div>        {/* FAQ Section */}
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
                Pro gives you unlimited insights with faster processing, advanced prompts, and priority support.
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
        
        {/* Already upgraded link */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 mb-2">Already upgraded?</p>
          <a href="/account" className="text-[--accent] hover:underline font-medium">
            Manage Pro →
          </a>
        </div>
      </div>
    </div>
  );
}
