import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  if (url.pathname.startsWith('/uploads/videos/')) {
    const destination = url.clone();
    destination.pathname = url.pathname.replace('/uploads/videos/', '/api/media/');
    return NextResponse.rewrite(destination);
  }
  
  if (url.pathname.startsWith('/admin')) {
    const session = request.cookies.get('seo_session')?.value;
    
    // Navigation hint only; each server entry point verifies the database session and role.
    if (!session || !/^[a-f0-9]{64}$/.test(session)) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/uploads/videos/:path*'],
};
