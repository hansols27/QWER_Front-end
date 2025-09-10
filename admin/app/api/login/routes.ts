import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// 환경변수에서 시크릿 키 관리 (예: .env.local에 넣기)
const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // ✅ 실제 구현: DB에서 유저 확인
  if (email === 'admin@test.com' && password === '1234') {
    // JWT 생성
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    // 쿠키에 토큰 저장 (HttpOnly, Secure)
    const res = NextResponse.json({ success: true, message: '로그인 성공' });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // 1시간
    });
    return res;
  }

  return NextResponse.json(
    { success: false, message: '로그인 실패' },
    { status: 401 }
  );
}
