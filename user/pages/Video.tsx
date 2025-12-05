'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { api } from "@shared/services/axios"; 
import { VideoItem } from "@shared/types/video";
import styles from '@front/styles/video.module.css';
import { CircularProgress, Typography, Box } from '@mui/material'; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// 기존 썸네일 추출 로직
const getThumbnail = (url: string) => {
  let videoId = "";
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const match = url.match(regExp);
  if (match) videoId = match[1];
  else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0] ?? "";
  else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};

// 유튜브 Video ID 추출 로직
const getYoutubeVideoId = (url: string) => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const match = url.match(regExp);
  if (match) return match[1];
  else if (url.includes("v=")) return url.split("v=")[1]?.split("&")[0] ?? "";
  else if (url.includes("youtu.be/")) return url.split("youtu.be/")[1]?.split("?")[0] ?? "";
  return "";
};

// 유튜브 임베드 URL을 생성하는 헬퍼 함수
const getEmbedUrl = (url: string) => {
  const videoId = getYoutubeVideoId(url);
  // autplay=1: 자동 재생, rel=0: 재생 완료 후 관련 영상 표시 방지
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : "";
};

export default function Video() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideoItems = useCallback(async () => {
    if (!API_BASE_URL) {
      setLoading(false);
      setError("API 주소가 설정되지 않아 영상을 불러올 수 없습니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: VideoItem[] }>("/api/video"); 
      const videoList = res.data.data || [];
      setVideos(videoList);
      // 데이터가 있으면 첫 번째 영상 선택, 없으면 -1
      setSelectedIndex(videoList.length > 0 ? 0 : -1); 
    } catch (err: any) {
      console.error("영상 목록 로드 실패:", err);
      setError(`영상 목록 로드 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideoItems(); }, [fetchVideoItems]);

  const selectedVideo = videos[selectedIndex]; 

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

    {/* Main (페이지 콘텐츠 영역) */}
    <div className={`${styles.cont} ${styles.video_ct} wow fadeInUp`} data-wow-delay="0.2s">
      <div className={`title ${styles.v_tt}`}>VIDEO</div>

      {/* 💡 로딩 상태 */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 2 }}>
          <CircularProgress />
          <Typography variant="h6">영상 목록을 불러오는 중...</Typography>
        </Box>
      )}
        
      {/* 💡 오류 상태 */}
      {error && !loading && (
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" color="error">{error}</Typography>
        </Box>
      )}

      {/* 💡 데이터 없음 상태 */}
      {!loading && !error && videos.length === 0 && (
        <Box sx={{ p: 4 }}>
          <Typography variant="h6">등록된 영상이 없습니다. 관리자 페이지에서 영상을 등록해주세요.</Typography>
        </Box>
      )}
    
      {/* 💡 정상 데이터 (videos.length > 0) 렌더링: video_list가 컨테이너 안에 위치 */}
      {!loading && !error && videos.length > 0 && (
        <div className={styles.video_list}>
          {/* 큰 영상 (왼쪽) */}
          <div className={styles.select_video}>
            {selectedVideo && (
              <iframe
                src={getEmbedUrl(selectedVideo.src)}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%' }}
              ></iframe>
            )}
          </div>
    
          {/* 썸네일 목록 (오른쪽) */}
          <div className={styles.thumb_box}>
            <div className={styles['thumb-list']}>
              {videos.map((video, idx) => (
                <div
                  key={video.id}
                  className={`${styles['thumb-item']} ${
                    selectedIndex === idx ? styles.active : ''
                  }`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <img 
                    src={getThumbnail(video.src)} 
                    alt={video.title} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}