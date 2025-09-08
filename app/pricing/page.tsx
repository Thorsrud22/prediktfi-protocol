import { Metadata } from 'next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Check, Zap, Star, Clock, ArrowRight, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Seen from './Seen';

export const metadata: Metadata = {
  title: 'Pricing • PrediktFi',
  description: 'Simple, transparent pricing for AI-powered predictions. Start free, upgrade when you need more.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1426] via-[#1E3A8A] to-[#0F766E]">
      <Seen />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-teal-900/20 to-slate-900/20 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))] -z-10"></div>
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 mb-6 text-white/90 text-sm font-medium">
              <Shield className="h-4 w-4" />
              <span>No credit card required • Cancel anytime</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Simple, transparent
              <span className="block bg-gradient-to-r from-blue-400 via-teal-400 to-blue-300 bg-clip-text text-transparent">
                pricing
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed">
              Start free and upgrade when you need more power. 
              Built for traders who demand precision and speed.
            </p>
            
            <p className="text-slate-400 mb-12">
              Join thousands of traders making smarter decisions with AI-powered insights
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Free Plan */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600/30 to-slate-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <Card className="relative p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-3">Free</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold text-white">$0</span>
                  </div>
                  <p className="text-slate-300">Perfect for getting started</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-slate-200">5 intents per week</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-slate-200">10 insights per day</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-slate-200">20 quotes per day</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-slate-200">Basic AI analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-slate-200">Community features</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-white/20 text-slate-300 hover:bg-white/30 border-0 backdrop-blur-sm" 
                  variant="outline"
                  disabled
                >
                  Current Plan
                </Button>
              </Card>
            </div>

            {/* Pro Plan */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-teal-500/30 to-blue-600/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm">
                  <Sparkles className="inline w-4 h-4 mr-1" />
                  Most Popular
                </div>
              </div>
              
              <Card className="relative p-8 bg-white/10 backdrop-blur-md border-2 border-blue-400/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-3">Pro</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">$9</span>
                    <span className="text-slate-300 ml-2">/month</span>
                  </div>
                  <p className="text-slate-300">For serious traders</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-yellow-400" />
                    </div>
                    <span className="text-slate-200 font-medium">30 intents per week</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-yellow-400" />
                    </div>
                    <span className="text-slate-200 font-medium">100 insights per day</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-yellow-400" />
                    </div>
                    <span className="text-slate-200 font-medium">200 quotes per day</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-teal-500/20 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-teal-400" />
                    </div>
                    <span className="text-slate-200">Advanced AI analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Clock className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-slate-200">Priority processing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-slate-200">No rate limits</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-slate-200">Priority support</span>
                  </li>
                </ul>

                <form action="/api/billing/checkout" method="POST">
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Trial Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>Free Trial Available</span>
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-4">
              Try Pro for free
            </h3>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Share 3 trading receipts and unlock 24 hours of Pro access. 
              Experience all premium features with no commitment required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/receipts">
                <Button variant="outline" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                  View my receipts
                </Button>
              </Link>
              <Link href="/studio">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600">
                  Start in Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Frequently asked questions
          </h3>
          
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
              <h4 className="text-lg font-semibold text-white mb-3">
                What happens when I reach my quota?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                You'll see a friendly upgrade prompt. You can either wait for your quota to reset 
                (daily for insights/quotes, weekly for intents) or upgrade to Pro for higher limits.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
              <h4 className="text-lg font-semibold text-white mb-3">
                How does the Pro trial work?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Share 3 trading receipts on social media within 7 days to unlock 24 hours of Pro access. 
                This gives you a full taste of Pro features before committing.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
              <h4 className="text-lg font-semibold text-white mb-3">
                Can I cancel anytime?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Yes! Cancel your Pro subscription anytime. You'll keep Pro access until the end of your 
                billing period, then automatically return to the Free plan.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
              <h4 className="text-lg font-semibold text-white mb-3">
                What payment methods do you accept?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                We accept all major cryptocurrencies through Coinbase Commerce, including Bitcoin, 
                Ethereum, and Solana. No traditional credit cards required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-3xl p-8 md:p-12 text-white relative overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-teal-500/10 to-slate-900/10 rounded-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">
                Ready to get started?
              </h3>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                Join thousands of traders making smarter decisions with AI-powered predictions. 
                Start free today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/studio">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-semibold"
                  >
                    Start free now
                  </Button>
                </Link>
                <Link href="/account">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-white/20 text-slate-300 hover:bg-white/10 hover:text-white backdrop-blur-sm"
                  >
                    Manage account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}