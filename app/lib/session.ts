import { NextRequest } from 'next/server';

// Helper function to get session from request
export function getSessionFromRequest(request: NextRequest): { wallet?: string; authenticated: boolean } {
  const sessionCookie = request.cookies.get('predikt_session');
  
  if (!sessionCookie) {
    console.log('No session cookie found');
    return { authenticated: false };
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);
    console.log('Session data:', { 
      wallet: sessionData.wallet ? sessionData.wallet.slice(0, 8) + '...' : 'none',
      authenticated: sessionData.authenticated,
      timestamp: sessionData.timestamp
    });
    
    // Check if session is expired (30 days)
    const isExpired = sessionData.timestamp && (Date.now() - sessionData.timestamp) > (30 * 24 * 60 * 60 * 1000);
    if (isExpired) {
      console.log('Session expired');
      return { authenticated: false };
    }
    
    return {
      wallet: sessionData.wallet,
      authenticated: sessionData.authenticated === true
    };
  } catch (error) {
    console.log('Error parsing session cookie:', error);
    return { authenticated: false };
  }
}
