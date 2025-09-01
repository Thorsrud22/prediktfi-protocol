import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if this is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if admin is enabled
    const adminEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true';
    
    if (!adminEnabled) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }

    // Check for basic auth
    const authHeader = request.headers.get('authorization');
    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (adminUser && adminPass) {
      if (!authHeader) {
        return new NextResponse('Auth required', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Area"',
          },
        });
      }

      const encodedCredentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(encodedCredentials, 'base64').toString();
      const [username, password] = credentials.split(':');

      if (username !== adminUser || password !== adminPass) {
        return new NextResponse('Invalid credentials', { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};
