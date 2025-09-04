export default function BillingCancelPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Checkout canceled</h1>
      <p className="text-gray-600 mb-6">No payment was processed. You can return to pricing and try again anytime.</p>
      <a className="text-blue-600" href="/pricing">Back to Pricing</a>
    </div>
  );
}
