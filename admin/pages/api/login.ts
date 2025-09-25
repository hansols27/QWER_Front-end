import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  // 간단한 admin 계정 예시
  if (email === 'admin@test.com' && password === 'qwer1018') {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=3600;${isProd ? ' Secure;' : ''} SameSite=Strict`
    );

    return res.status(200).json({ success: true, message: '로그인 성공' });
  }

  return res.status(401).json({ success: false, message: '로그인 실패' });
}
