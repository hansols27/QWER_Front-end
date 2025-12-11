'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { api } from "@shared/services/axios";
import styles from '@front/styles/albumdetail.module.css'; // 모듈 CSS
import { CircularProgress, Alert, Box, Typography, Button } from '@mui/material';
import { AlbumItem } from '@shared/types/album';

// 앨범 커버 크기 상수 정의 (albumdetail.module.css의 .onlin_cover와 일치: 455px)
const IMAGE_WIDTH = 455; 
const IMAGE_HEIGHT = 455; 
const NO_IMAGE_URL = `https://via.placeholder.com/${IMAGE_WIDTH}x${IMAGE_HEIGHT}?text=No+Image`;


const extractErrorMessage = (error: any, defaultMsg: string): string => {
    // Axios 에러 처리 포함
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function AlbumDetail() {
    const router = useRouter();
    // router.query.albumId가 배열일 경우 첫 번째 요소를 사용
    const albumId = Array.isArray(router.query.albumId) ? router.query.albumId[0] : router.query.albumId; 

    const [album, setAlbum] = useState<AlbumItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * 앨범 상세 정보를 API에서 불러오는 함수
     */
    const fetchAlbumDetail = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            // API 호출
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
        if (router.isReady && albumId) {
            fetchAlbumDetail(albumId);
        } else if (router.isReady && !albumId) {
            setLoading(false);
            setError("잘못된 접근입니다. 앨범 ID가 누락되었습니다.");
        }
    }, [router.isReady, albumId, fetchAlbumDetail]);

    // 1. 로딩 상태
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh" flexDirection="column">
                <CircularProgress size={40} />
                <Typography mt={2}>앨범 상세 정보 로딩 중...</Typography>
            </Box>
        );
    }

    // 2. 에러 또는 앨범 데이터 부재 상태
    if (error || !album) {
        return (
            <Box py={4} textAlign="center">
                <Alert severity={error ? 'error' : 'warning'} sx={{ mb: 2 }}>
                    {error || "요청하신 앨범 정보를 찾을 수 없습니다."}
                </Alert>
                <Link href="/Album" passHref>
                    <Button variant="contained">목록으로 돌아가기</Button>
                </Link>
            </Box>
        );
    }
    
    // 3. 이미지 URL 결정 및 Placeholder 처리
    // ⭐️ 목록 페이지와 동일하게 'album.image' 필드 사용
    const finalImageUrl = album.image || NO_IMAGE_URL;
    const isPlaceholder = finalImageUrl === NO_IMAGE_URL;

    return (
        <div className="container"> 
            {/* 측면 메뉴 */}
            <div id="side">
                <div className="side2"> 
                    02
                    <span className="s_line"></span> 
                    DISCOGRAPHY
                </div>
            </div>

            {/* 앨범 상세 콘텐츠 */}
            <div className={`${styles.albumCont} ${styles.discography} wow fadeInUp`} data-wow-delay="0.2s">              
                {/* 좌측 섹션: .dis_left */}
                <div className={styles.dis_left}>
                    {/* BACK 버튼 */}
                    <div className={styles.dis_bt_top}>
                        <p className={styles.back}>
                            <Link href="/Album">&lt; BACK</Link>
                        </p>
                    </div>

                    {/* 앨범 커버 이미지: .onlin_cover */}
                    <div className={styles.onlin_cover}>
                        <Image 
                            alt={album.title} 
                            // ⭐️ 수정된 finalImageUrl 사용
                            src={finalImageUrl} 
                            fill 
                            // 상세 페이지는 고정된 크기(455px)를 가지므로 sizes 설정
                            sizes={`${IMAGE_WIDTH}px`} 
                            style={{ objectFit: 'cover' }} 
                            // ⭐️ Placeholder 이미지일 경우에만 최적화 건너뛰기
                            unoptimized={isPlaceholder} 
                            onError={(e) => {
                                console.error("상세 페이지 이미지 로드 실패:", finalImageUrl, e);
                                // (선택) 여기에 이미지 로드 실패 시 상태 업데이트 로직 추가 가능
                            }}
                        />
                    </div>

                    {/* 앨범 날짜 */}
                    <div className={styles.dis_bt_bottom}>
                        <p className={styles.dis_date}>{album.date ? album.date.split('T')[0] : '날짜 미정'}</p>
                    </div>

                    {/* 트랙리스트 */}
                    {album.tracks && album.tracks.length > 0 && (
                        <div className={styles.tracklist}>
                            <div className={`${styles['card-bare-text']} ${styles['release-playlist']} ${styles['text-tall']}`}>
                                {album.tracks.map((track, index) => (
                                    <p key={index}>{index + 1}. {track}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 우측 섹션: .dis_right */}
                <div className={styles.dis_right}>
                    <div className={styles.discography_inner}>
                        {/* 앨범 제목 */}
                        <div className={styles.dis_txt_top}>
                            <p className={`${styles.album_name} EN`}>{album.title}</p>
                        </div>

                        {/* 앨범 설명 */}
                        {album.description && (
                            <div className={styles.dis_more_cont} style={{ whiteSpace: 'pre-line' }}>
                                {album.description}
                            </div>
                        )}

                        {/* 뮤직비디오 */}
                        {album.videoUrl && (
                            <div className={styles.video}>
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