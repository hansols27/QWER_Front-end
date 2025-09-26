import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@front/pages/Home';
import Profile from '@front/pages/Profile';
import Album from '@front/pages/Album';
import AlbumDetail from '@front/pages/detail/AlbumDetail';
import Gallery from '@front/pages/Gallery';
import Video from '@front/pages/Video';
import Schedule from '@front/pages/Schedule';
import NoticeDetail from '@front/pages/detail/NoticeDetail';
import Notice from '@front/pages/Notice';
//import Community from '@front/pages/Community';
//import CommuDetail from '@front/pages/detail/CommuDetail';
import Footer from '@front/components/layout/Footer';
import Header from '@front/components/layout/Header';

export const Router = () => (
  <div id="wrap">
    <BrowserRouter>
      {/* 헤더, 사이드 네비게이션 */}
      <Header />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/Album" element={<Album />} />
          <Route path="/Album/AlbumDetail/:title" element={<AlbumDetail />} />
          <Route path="/Gallery" element={<Gallery />} />
          <Route path="/Video" element={<Video />} />
          <Route path="/Schedule" element={<Schedule />} />
          <Route path="/Notice" element={<Notice />} />
          <Route path="/Notice/NoticeDetail/:id" element={<NoticeDetail />} />
          {/*
          <Route path="/Community" element={<Community />} />
          <Route path="/Community/CommuDetail/:id" element={<CommuDetail />} />
          */}
        </Routes>
      </main>

      {/* 푸터 */}
      <Footer />
    </BrowserRouter>
  </div>
);
