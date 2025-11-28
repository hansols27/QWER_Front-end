'use client'; // 클라이언트 컴포넌트로 유지

import React, { useState, useEffect, useCallback } from 'react';
import { api } from "@shared/services/axios"; 
import { VideoItem } from "@shared/types/video";
import '@front/ui/video.module.css';
import { CircularProgress, Typography } from '@mui/material';

// --- 썸네일 추출 함수 ---
const getThumbnail = (url: string) => {
    let videoId = "";
    const regExp =
        /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);

    if (match) videoId = match[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0] ?? "";
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";

    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};
// ------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
            setVideos(res.data.data);
            setSelectedIndex(0); // 새 목록을 불러오면 첫 번째 영상 선택
        } catch (err: any) {
            console.error("영상 목록 로드 실패:", err);
            setError(`영상 목록 로드 실패: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchVideoItems(); 
    }, [fetchVideoItems]);

    const selectedVideo = videos[selectedIndex];

    // --- 로딩 및 오류 화면 (Side/Main 구조 렌더링 전에 처리) ---
    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                <CircularProgress />
                <Typography variant="h6" mt={2}>영상 목록 로딩 중...</Typography>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                <Typography color="error" variant="h6">🚫 오류 발생: {error}</Typography>
                <Typography variant="body1" mt={1}>관리자 페이지 및 API 설정을 확인해주세요.</Typography>
            </div>
        );
    }
    // ----------------------------------------------------------

    // 메인 렌더링
    return (
        <div className="container">
            <div id="side">
                <div className="side2">
                    04
                    <span className="s_line"></span>
                    VIDEO
                </div>
            </div>

            <div className="cont video_ct wow fadeInUp" data-wow-delay="0.2s">
                <div className="title v_tt">VIDEO</div>

                {/* 데이터 유무에 따른 조건부 내용 렌더링 */}
                {videos.length === 0 ? (
                    // 데이터가 없을 때의 내용
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Typography variant="h6" color="textSecondary">등록된 영상이 없습니다.</Typography>
                    </div>
                ) : (
                    // 데이터가 있을 때의 내용
                    <div className="video_list">
                        {/* 큰 영상 (왼쪽): 선택된 영상 표시 */}
                        <div className="select_video">
                            <iframe
                                // URL이 embed 형식이 아니면 getThumbnail로 videoId를 추출하여 embed 형식으로 변환
                                src={selectedVideo.src.includes("embed") 
                                    ? selectedVideo.src 
                                    : `https://www.youtube.com/embed/${getThumbnail(selectedVideo.src).split('/')[4]}`}
                                title={selectedVideo.title}
                                frameBorder="0"
                                allowFullScreen
                            ></iframe>
                            <div className="video-title-overlay">{selectedVideo.title}</div>
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
                                        <img 
                                            src={getThumbnail(video.src) || "https://via.placeholder.com/128x72?text=No+Thumb"} 
                                            alt={video.title} 
                                        />
                                        <div className="thumb-title" title={video.title}>{video.title}</div>
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