import { auth } from '@/lib/auth';
import { getRoutePermission } from '@/lib/permissions-config';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  const routePerm = getRoutePermission(pathname);

  if (!routePerm) {
    return NextResponse.next();
  }

  if (routePerm.requireAuth && !req.auth?.user) {
    const loginUrl = new URL('/auth/login', req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (routePerm.permission && req.auth?.user) {
    const userId = req.auth.user.id as string;
    const has = await hasPermission(userId, routePerm.permission);
    if (!has) {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  }

  if (routePerm.roles && req.auth?.user) {
    const role = req.auth.user.role as string;
    if (!routePerm.roles.includes(role)) {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (ip !== 'unknown') {
    const activeBan = await prisma.banRecord.findFirst({
      where: {
        ipAddress: ip,
        isActive: true,
        banType: 'IP_BAN',
      },
    });
    if (activeBan) {
      return new NextResponse('Access denied', { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|manifest.json|icons|offline).*)',
  ],
};
