import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from 'src/pages/Home';
import Profile from 'src/pages/Profile';
import Album from 'src/pages/Album';
import AlbumDetail from 'src/pages/detail/AlbumDetail';
import Gallery from 'src/pages/Gallery';
import Video from 'src/pages/Video';
import Schedule from 'src/pages/Schedule';
import NoticeDetail from 'src/pages/detail/NoticeDetail';
import Notice from 'src/pages/Notice';
//import Community from 'src/pages/Community';
//import CommuDetail from 'src/pages/detail/CommuDetail';
import Footer from 'src/components/layout/Footer';
import Header from 'src/components/layout/Header';

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
