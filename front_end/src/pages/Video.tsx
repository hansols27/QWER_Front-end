import React, { useState } from 'react';
import '@/ui/video.css';
import { videos } from '@/data/videolist';

import btn_prev from '@/assets/icons/bg-btn-prev.png';
import btn_next from '@/assets/icons/bg-btn-next.png';

function getYoutubeThumbnail(src: string): string {
  const match = src.match(/embed\/([^?]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
}

export default function Video() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [thumbPage, setThumbPage] = useState(1);
  const thumbsPerPage = 3;

  const totalThumbPages = Math.ceil(videos.length / thumbsPerPage);

  const startIndex = (thumbPage - 1) * thumbsPerPage;
  const currentThumbs = videos.slice(startIndex, startIndex + thumbsPerPage);

  const goPrevThumb = () => {
    if (thumbPage > 1) setThumbPage((prev) => prev - 1);
  };

  const goNextThumb = () => {
    if (thumbPage < totalThumbPages) setThumbPage((prev) => prev + 1);
  };

  return (
    <div className="container">
      {/* Side */}
      <div id="side">
        <div className="side2">
          04
          <span className="s_line"></span>
          VIDEO
        </div>
      </div>

      {/* Main */}
      <div className="cont video_ct wow fadeInUp" data-wow-delay="0.2s">
        <div className="title v_tt">VIDEO</div>

        <div className="video_list">
          {/* 큰 영상 (왼쪽) */}
          <div className="select_video">
            <iframe
              src={videos[selectedIndex].src}
              title={videos[selectedIndex].title}
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>

          {/* 썸네일 목록 (오른쪽, 스크롤 가능) */}
          <div className="thumb_box">
            <div className="thumb-list">
              {videos.map((video, idx) => (
                <div
                  key={video.id}
                  className={`thumb-item ${
                    selectedIndex === idx ? 'active' : ''
                  }`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <img src={getYoutubeThumbnail(video.src)} alt={video.title} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
