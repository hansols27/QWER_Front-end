'use client';

import type { AppProps } from 'next/app';
import React, { useEffect, useState } from 'react';
import '@front/styles/global.css';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import { api } from '@services/axios';

interface GetSettingsResponse {
  success: boolean;
  data: {
    mainImage: string;
  };
}

const MyApp = ({ Component, pageProps, router }: AppProps) => {
  const isHome = router.pathname === '/';

  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isHome) return;

    const fetchMainImage = async () => {
      try {
        const res = await api.get<GetSettingsResponse>('/api/settings');
        if (res.data.success && res.data.data.mainImage) {
          setMainImageUrl(res.data.data.mainImage);
        }
      } catch (e) {
        console.error('Failed to fetch home main image', e);
      }
    };

    fetchMainImage();
  }, [isHome]);

  return (
    <div id="wrap" style={{ position: 'relative', minHeight: '100vh' }}>
      
      {/* 배경 처리 영역 */}
      <div
        className={isHome ? 'main_bgimg' : ''}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          backgroundImage: isHome && mainImageUrl ? `url(${mainImageUrl})` : 'none',
          backgroundColor: isHome ? 'transparent' : '#0e1726',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <Header />

      <main id="main-content">
        <Component {...pageProps} />
      </main>

      <Footer />
    </div>
  );
};

export default MyApp;
