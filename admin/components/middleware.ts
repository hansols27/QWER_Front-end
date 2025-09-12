import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/* 페이지만 보호
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/', req.url)); // 로그인 페이지로 리다이렉트
    }

    try {
      jwt.verify(token, JWT_SECRET); // 토큰 검증
    } catch (err) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}
