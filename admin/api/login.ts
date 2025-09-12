import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  // 예시: admin 계정
  if (email === 'admin@test.com' && password === '1234') {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    // 쿠키 설정
    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=3600; Secure=${process.env.NODE_ENV === 'production'}`
    );

    return res.status(200).json({ success: true, message: '로그인 성공' });
  }

  return res.status(401).json({ success: false, message: '로그인 실패' });
}
