import type { AppProps } from 'next/app';
import React from 'react';
import '@front/styles/global.css'; 
import Header from '@components/layout/Header'; 
import Footer from '@components/layout/Footer'; 

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <div id="wrap">
      <Header />
      <main id="main-content">
        <Component {...pageProps} />
      </main>
      <Footer />
    </div>
  );
};

export default MyApp;