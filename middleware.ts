import { NextRequest, NextResponse } from 'next/server';
import { getPlanFromRequest } from './app/lib/plan';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add plan info header (info hint for debugging)
  const planInfo = getPlanFromRequest(request);
  response.headers.set('x-plan', planInfo.plan);
  
  // Geofence: Block Norway (NO) on mainnet for /market and /api routes
  const cluster = process.env.SOLANA_CLUSTER;
  const pathname = request.nextUrl.pathname;
  
  if (cluster === 'mainnet-beta' && (pathname.startsWith('/market') || pathname.startsWith('/api'))) {
    // Check country code from various headers (in order of preference)
    const countryCode = request.headers.get('x-vercel-ip-country') || 
                       request.headers.get('cf-ipcountry') || 
                       request.headers.get('x-country');
    
    if (countryCode === 'NO') {
      return NextResponse.redirect(new URL('/blocked', request.url));
    }
  }

  // Check if this is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if admin is enabled (using '1' instead of 'true')
    const adminEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN === '1';
    
    if (!adminEnabled) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }

    // Check for basic auth
    const authHeader = request.headers.get('authorization');
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (adminUser && adminPass) {
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return new NextResponse('Authentication required', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Creator Hub Admin"',
          },
        });
      }

      const encodedCredentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(encodedCredentials, 'base64').toString();
      const [username, password] = credentials.split(':');

      if (username !== adminUser || password !== adminPass) {
        return new NextResponse('Invalid credentials', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Creator Hub Admin"',
          },
        });
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/market/:path*', '/api/:path*']
};
