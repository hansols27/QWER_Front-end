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

    if (loading) return (
        <div className={styles.container} style={{ textAlign: 'center', padding: '100px 0' }}>
            <CircularProgress />
            <Typography variant="h6" mt={2}>영상 목록 로딩 중...</Typography>
        </div>
    );

    if (error) return (
        <div className={styles.container} style={{ textAlign: 'center', padding: '100px 0' }}>
            <Typography color="error" variant="h6">🚫 오류 발생: {error}</Typography>
            <Typography variant="body1" mt={1}>관리자 페이지 및 API 설정을 확인해주세요.</Typography>
        </div>
    );

    return (
        <div className={styles.container}>
            <div id="side" className={styles.side}>
                <div className={styles.side2}>04<span className={styles.s_line}></span>VIDEO</div>
            </div>

            <div className={`${styles.cont} ${styles.video_ct}`}>
                <div className={styles.title + ' ' + styles.v_tt}>VIDEO</div>

                {videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Typography variant="h6" color="textSecondary">등록된 영상이 없습니다.</Typography>
                    </div>
                ) : (
                    <div className={styles.video_list}>
                        <div className={styles.select_video}>
                            <iframe
                                src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedVideo.src)}`}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allowFullScreen
                                className={styles.video_iframe}
                            ></iframe>
                            <div className={styles.video_title_overlay}>{selectedVideo.title}</div>
                        </div>

                        <div className={styles.thumb_box}>
                            <div className={styles['thumb-list']}>
                                {videos.map((video, idx) => (
                                    <div
                                        key={video.id}
                                        className={`${styles['thumb-item']} ${selectedIndex === idx ? styles.active : ''}`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <Image 
                                            src={getThumbnail(video.src) || "https://via.placeholder.com/128x72?text=No+Thumb"}
                                            alt={video.title}
                                            width={128}
                                            height={72}
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
