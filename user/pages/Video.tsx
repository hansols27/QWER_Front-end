'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { api } from "@shared/services/axios"; 
import { VideoItem } from "@shared/types/video";
import styles from '@front/styles/video.module.css';
import { CircularProgress, Typography } from '@mui/material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getThumbnail = (url: string) => {
  let videoId = "";
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const match = url.match(regExp);
  if (match) videoId = match[1];
  else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0] ?? "";
  else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};

const getYoutubeVideoId = (url: string) => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const match = url.match(regExp);
  if (match) return match[1];
  else if (url.includes("v=")) return url.split("v=")[1]?.split("&")[0] ?? "";
  else if (url.includes("youtu.be/")) return url.split("youtu.be/")[1]?.split("?")[0] ?? "";
  return "";
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
      setVideos(res.data.data || []);
      setSelectedIndex(0);
    } catch (err: any) {
      console.error("영상 목록 로드 실패:", err);
      setError(`영상 목록 로드 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideoItems(); }, [fetchVideoItems]);

  const selectedVideo = videos[selectedIndex];

  // 💡 global.css의 .cont 클래스 사용
  if (loading) return (
    <div className="cont loading-container">
      <CircularProgress />
      <Typography variant="h6" mt={2}>영상 목록 로딩 중...</Typography>
    </div>
  );

  if (error) return (
    <div className="cont error-container">
      <Typography color="error" variant="h6">🚫 오류 발생: {error}</Typography>
      <Typography variant="body1" mt={1}>관리자 페이지 및 API 설정을 확인해주세요.</Typography>
    </div>
  );

  return (
    // 💡 최상위 래퍼에 global.css의 .container 클래스 적용
    <div className="container">
      {/* Side 영역: global.css의 #side 및 하위 클래스 사용 */}
      <div id="side">
        <div className="side2">04<span className="s_line"></span>VIDEO</div>
        </div>

      {/* 메인 컨텐츠: global.css의 .cont와 video.module.css의 .video_ct 혼용 */}
      <div className={`cont ${styles.video_ct}`}>
        {/* 타이틀: global.css의 .title과 video.module.css의 .v_tt 혼용 */}
        <div className={`title ${styles.v_tt}`}>VIDEO</div>

        {videos.length === 0 ? (
          <div className="no-videos">
            <Typography variant="h6" color="textSecondary">등록된 영상이 없습니다.</Typography>
          </div>
        ) : (
          <div className={styles.video_list}>
            {/* 왼쪽 큰 영상: styles.select_video 클래스 사용 */}
            <div className={styles.select_video}>
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedVideo.src)}`}
                title={selectedVideo.title}
                frameBorder="0"
                allowFullScreen
                // iframe은 styles.select_video iframe {} CSS 규칙이 적용됩니다.
              ></iframe>
              <div className={styles.video_title_overlay}>{selectedVideo.title}</div>
            </div>

            {/* 오른쪽 썸네일 박스: styles.thumb_box 클래스 사용 */}
            <div className={styles.thumb_box}>
              <div className={styles['thumb-list']}>
                {videos.map((video, idx) => (
                  <div
                    key={video.id}
                    // styles.thumb-item 및 styles.active 클래스 사용
                    className={`${styles['thumb-item']} ${selectedIndex === idx ? styles.active : ''}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    {/* Image 컴포넌트는 fill 속성을 통해 styles.thumb-item img {} CSS를 따릅니다. */}
                    <Image 
                      src={getThumbnail(video.src) || "https://via.placeholder.com/128x72?text=No+Thumb"}
                      alt={video.title}
                      fill 
                      style={{ objectFit: 'cover' }} 
                    />
                    <div className={styles['thumb-title']} title={video.title}>{video.title}</div>
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