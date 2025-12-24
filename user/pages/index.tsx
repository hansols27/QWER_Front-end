import React from 'react';
import Head from 'next/head';

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        {/* 기본 SEO */}
        <title>QWER 팬사이트</title>
        <meta
          name="description"
          content="QWER 팬사이트에서 멤버 프로필, 앨범, 갤러리, 영상, 공지사항, 스케줄 등 최신 QWER 콘텐츠를 확인하세요."
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Canonical */}
        <link
          rel="canonical"
          href="https://qwerfansite.com"
        />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="QWER 팬사이트" />
        <meta property="og:title" content="QWER 팬사이트" />
        <meta
          property="og:description"
          content="QWER의 모든 팬 콘텐츠를 한 곳에서 확인하세요."
        />
        <meta
          property="og:image"
          content="https://qwerfansite.com/logo.svg"
        />
        <meta
          property="og:url"
          content="https://qwerfansite.com"
        />
      </Head>

      <main>
        <h1 className="sr-only">QWER 팬사이트</h1>

        <section className="sr-only">
          <p>
            QWER 팬사이트는 멤버 프로필, 앨범, 갤러리,
            영상, 공지사항, 스케줄 등 QWER 관련 최신 정보를 제공합니다.
          </p>
        </section>
      </main>

    </>
  );
};

export default HomePage;
