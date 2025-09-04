// Maps API verification errors to short English messages

export function mapVerifyError(error: any): string {
  if (!error) return "Unknown error";
  
  const errorStr = error.toString().toLowerCase();
  
  // Network errors
  if (errorStr.includes("fetch") || errorStr.includes("network")) {
    return "Network error";
  }
  
  // Timeout errors
  if (errorStr.includes("timeout") || errorStr.includes("timed out")) {
    return "Request timed out";
  }
  
  // Invalid signature format
  if (errorStr.includes("invalid signature") || errorStr.includes("malformed")) {
    return "Invalid signature format";
  }
  
  // Missing signature
  if (errorStr.includes("missing signature") || errorStr.includes("mangler signatur")) {
    return "Missing signature";
  }
  
  // Transaction not found
  if (errorStr.includes("not found") || errorStr.includes("404")) {
    return "Transaction not found";
  }
  
  // Insufficient funds
  if (errorStr.includes("insufficient") || errorStr.includes("funds")) {
    return "Insufficient funds";
  }
  
  // Transaction failed
  if (errorStr.includes("failed") || errorStr.includes("error")) {
    return "Transaction failed";
  }
  
  // Rate limiting
  if (errorStr.includes("rate limit") || errorStr.includes("429")) {
    return "Too many requests";
  }
  
  // Generic server error
  if (errorStr.includes("500") || errorStr.includes("server")) {
    return "Server error";
  }
  
  // Default fallback
  return "Verification failed";
}
