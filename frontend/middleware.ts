import { verifyToken } from '@lib/utils';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

const publicRoutes = ['/', '/Login', '/Signup', '/42auth', '/verify-email', '/reset-password'];

async function checkUserExists(userId: string | any, authToken: any) {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';

  try {
    const response = await fetch(`${backendUrl}/api/user/${userId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Host': process.env.NEXT_PUBLIC_API_BASE_URL?.replace('https://', '')
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error('User check failed with status:', response.status);
      return null
    }

    return await response.json();
  } catch (error) {
    console.error('User check fetch error:', error);
    return { exists: true };
  }
}

export async function middleware(request: NextRequest) {
  
  // Early return for static files
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  const authToken = request.cookies.get('Authorization')?.value;

  const isPublicRoute = publicRoutes.some(route => path === route) || 
                       path.match(/^\/(verify-email|reset-password|42auth)/);
  
  try {
    if (authToken) {
      const payload = await verifyToken(authToken);

      if (!payload || !payload.user_id) {
        throw new Error('Invalid token');
      }

        const checkUser = await checkUserExists(payload.user_id, authToken);
        if (!checkUser)
          throw new Error('User not Exist');

      if (path === '/Login' || path === '/Signup') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      return NextResponse.next();
    }

    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/Login', request.url));
    }

    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);
    const response = NextResponse.redirect(new URL('/Login', request.url));
    response.cookies.delete('Authorization');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};