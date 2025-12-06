interface CheckoutCompletedProps {
  hasCode: boolean;
}

export default function CheckoutCompleted({ hasCode }: CheckoutCompletedProps) {
  if (!hasCode) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            Payment Successful
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p>Your payment has been processed successfully. Your Pro license is ready below.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
