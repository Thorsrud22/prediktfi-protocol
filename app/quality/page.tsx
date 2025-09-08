import { Metadata } from 'next';
import { Card } from '../components/ui/Card';
import { QualityDashboard } from '../components/quality/QualityDashboard';

export const metadata: Metadata = {
  title: 'Quality Dashboard • Predikt',
  description: 'Monitor simulation accuracy, quote-fill deviation, and conversion rates.',
};

export default function QualityPage() {
  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--text] mb-2">Quality Dashboard</h1>
          <p className="text-[--muted]">Monitor simulation accuracy and system performance</p>
        </div>

        <QualityDashboard />
      </div>
    </div>
  );
}
