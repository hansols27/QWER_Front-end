import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Album from '../pages/album/Album';
import AlbumDetail from '../pages/album/[albumId]'; 
import Gallery from '../pages/Gallery';
import Video from '../pages/Video';
import Schedule from '../pages/Schedule';
import NoticeDetail from '../pages/notice/[noticeId]'; 
import Notice from '../pages/notice/Notice';
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';

export const Router = () => (
    <div id="wrap">
        <BrowserRouter>
            <Header />

            <main id="main-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/Profile" element={<Profile />} />
                    
                    <Route path="/Album" element={<Album />} />
                    <Route path="/Album/:albumId/:title" element={<AlbumDetail />} />                    
                    <Route path="/Gallery" element={<Gallery />} />
                    <Route path="/Video" element={<Video />} />
                    <Route path="/Schedule" element={<Schedule />} />                    
                    <Route path="/Notice" element={<Notice />} />
                    <Route path="/Notice/:noticeId" element={<NoticeDetail />} />
                </Routes>
            </main>

            <Footer />
        </BrowserRouter>
    </div>
);