'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login'); // /login으로 바로 이동
  }, [router]);

  return null; // 화면에는 아무것도 렌더링하지 않음
}
