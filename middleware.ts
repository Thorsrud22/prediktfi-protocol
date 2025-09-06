import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/api/prediction',
    '/api/prediction/commit',
    '/api/prediction/receipt',
  ];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  // For API routes, check for authentication
  if (isProtectedPath && pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('predikt-session');

    // If no authentication provided, return unauthorized
    if (!authHeader && !sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Let the API route handle the actual validation
    return NextResponse.next();
  }

  // For page routes, redirect to login if not authenticated
  if (isProtectedPath && !pathname.startsWith('/api/')) {
    const sessionCookie = request.cookies.get('predikt-session');

    if (!sessionCookie) {
      // Redirect to home with a message that authentication is required
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('auth', 'required');
      return NextResponse.redirect(url);
    }
  }

  // For all other routes, continue normally
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
