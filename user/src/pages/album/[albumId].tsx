import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router'; // 1. Next.js 라우터 훅 사용
import Link from 'next/link'; // 2. Next.js Link 컴포넌트 사용
import { api } from "@shared/services/axios";
import '@front/ui/albumdetail.module.css'; // CSS Module import 유지
import { CircularProgress, Alert, Box, Typography, Button } from '@mui/material';
import { AlbumItem } from '@shared/types/album';

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// ===========================
// 컴포넌트 시작 (Next.js Pages Router 기준)
// ===========================

export default function AlbumDetail() {
    const router = useRouter();
    // 💡 Next.js의 useRouter에서 albumId를 추출합니다. 
    // router.query는 초기에는 빈 객체일 수 있으므로 string으로 명시적 캐스팅합니다.
    const albumId = router.query.albumId as string | undefined; 

    const [album, setAlbum] = useState<AlbumItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 상세 데이터 로딩 함수
    const fetchAlbumDetail = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<{ success: boolean; data: AlbumItem }>(`/api/album/${id}`);
            setAlbum(res.data.data);
        } catch (err: any) {
            console.error(`앨범 ID ${id} 로드 실패:`, err);
            setError(extractErrorMessage(err, "앨범 상세 정보를 불러오는 데 실패했습니다."));
            setAlbum(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 💡 Next.js에서는 router.isReady가 true일 때만 albumId가 확정됩니다.
        if (router.isReady && albumId) {
            fetchAlbumDetail(albumId);
        } else if (router.isReady && !albumId) {
            setLoading(false);
            setError("잘못된 접근입니다. 앨범 ID가 누락되었습니다.");
        }
    }, [router.isReady, albumId, fetchAlbumDetail]);


    // ===========================
    // 로딩 및 에러 처리 UI
    // ===========================

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh" flexDirection="column">
                <CircularProgress size={40} />
                <Typography mt={2}>앨범 상세 정보 로딩 중...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box py={4} textAlign="center">
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                {/* 💡 Next.js Link로 변경 */}
                <Link href="/Album" passHref legacyBehavior> 
                    <Button variant="contained">목록으로 돌아가기</Button>
                </Link>
            </Box>
        );
    }

    // 데이터 로드 실패 시
    if (!album) {
        return (
            <Box py={4} textAlign="center">
                <Alert severity="warning" sx={{ mb: 2 }}>요청하신 앨범 정보를 찾을 수 없습니다.</Alert>
                {/* 💡 Next.js Link로 변경 */}
                <Link href="/Album" passHref legacyBehavior> 
                    <Button variant="contained">목록으로 돌아가기</Button>
                </Link>
            </Box>
        );
    }

    // ===========================
    // 최종 UI (기존 디자인 유지, 동적 데이터 바인딩)
    // ===========================

    return (
        <div className="container">
            {/* Side 영역 */}
            <div id="side">
                <div className="side2">
                    02
                    <span className="s_line"></span>
                    DISCOGRAPHY
                </div>
            </div>

            <div className="cont discography wow fadeInUp" data-wow-delay="0.2s">
                {/* Left */}
                <div className="dis_left">
                    <div className="dis_bt_top">
                        <p className="back">
                            {/* 💡 Next.js Link로 변경 */}
                            <Link href="/Album">&lt; BACK</Link> 
                        </p>
                    </div>

                    {/* 앨범 커버 */}
                    <div className="onlin_cover">
                        <img alt={album.title} src={album.coverImageUrl} />
                    </div>

                    {/* 발매일 */}
                    <div className="dis_bt_bottom">
                        <p className="dis_date">{album.date}</p>
                    </div>

                    {/* 트랙리스트 */}
                    {album.tracks && album.tracks.length > 0 && (
                        <div className="tracklist">
                            <div className="card-bare-text release-playlist text-tall">
                                {album.tracks.map((track, index) => (
                                    <p key={index}>
                                        {index + 1}. {track}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right */}
                <div className="dis_right">
                    <div className="discography_inner">
                        <div className="dis_txt_top">
                            <p className="album_name EN">{album.title}</p>
                        </div>

                        {/* 설명 */}
                        {album.description && (
                            <div className="dis_more_cont" style={{ whiteSpace: 'pre-line' }}>
                                {album.description}
                            </div>
                        )}

                        {/* 유튜브 영상 */}
                        {album.videoUrl && (
                            <div className="video">
                                <iframe
                                    src={album.videoUrl}
                                    title={album.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}