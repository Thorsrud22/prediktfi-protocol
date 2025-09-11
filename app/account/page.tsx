import { Metadata } from 'next';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'Your Account • Predikt',
  description: 'Manage your wallet, plan, and payment history.',
};

export default function AccountPage() {
  return <AccountClient />;
}
