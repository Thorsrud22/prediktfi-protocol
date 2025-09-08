import { Metadata } from 'next';
import { ChaosControlPanel } from '../components/chaos/ChaosControlPanel';

export const metadata: Metadata = {
  title: 'Chaos Testing • Predikt',
  description: 'Control chaos testing scenarios for system resilience validation.',
};

export default function ChaosPage() {
  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--text] mb-2">Chaos Testing</h1>
          <p className="text-[--muted]">Control chaos testing scenarios for system resilience validation</p>
        </div>

        <ChaosControlPanel />
      </div>
    </div>
  );
}
