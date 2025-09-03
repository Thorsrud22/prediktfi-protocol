// Helper functions for MarketCard
export function timeUntil(endDateString: string): string {
  const endDate = new Date(endDateString);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "Ended";
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 30) {
    const diffMonths = Math.floor(diffDays / 30);
    return `Ends in ${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  } else if (diffDays > 0) {
    return `Ends in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `Ends in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Ends in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  }
}

export function lamportsToSol(lamports: number): string {
  const sol = lamports / 1000000000; // 1 SOL = 10^9 lamports
  return sol.toFixed(2);
}
