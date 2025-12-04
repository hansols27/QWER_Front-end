'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { api } from "@shared/services/axios";
import styles from '@front/styles/albumdetail.module.css'; // 모듈 CSS
import { CircularProgress, Alert, Box, Typography, Button } from '@mui/material';
import { AlbumItem } from '@shared/types/album';

const extractErrorMessage = (error: any, defaultMsg: string): string => {
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
        if (router.isReady && albumId) {
            fetchAlbumDetail(albumId);
        } else if (router.isReady && !albumId) {
            setLoading(false);
            setError("잘못된 접근입니다. 앨범 ID가 누락되었습니다.");
        }
    }, [router.isReady, albumId, fetchAlbumDetail]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh" flexDirection="column">
                <CircularProgress size={40} />
                <Typography mt={2}>앨범 상세 정보 로딩 중...</Typography>
            </Box>
        );
    }

    if (error || !album) {
        return (
            <Box py={4} textAlign="center">
                <Alert severity={error ? 'error' : 'warning'} sx={{ mb: 2 }}>
                    {error || "요청하신 앨범 정보를 찾을 수 없습니다."}
                </Alert>
                <Link href="/album" passHref>
                    <Button variant="contained">목록으로 돌아가기</Button>
                </Link>
            </Box>
        );
    }

    return (
        // 1. 최상위 래퍼: global.css의 .container 클래스 적용 (전체 레이아웃)
        <div className="container"> 
            
            {/* 2. Side 영역: global.css의 #side 및 하위 클래스 적용 */}
            <div id="side">
                <div className="side2"> {/* global.css 클래스 */}
                    02
                    <span className="s_line"></span> {/* global.css 클래스 */}
                    DISCOGRAPHY
                </div>
            </div>

            {/* 3. 메인 상세 컨테이너: global.css의 .cont와 module.css의 .discography 스타일 결합 */}
            <div className={`cont ${styles.discography} wow fadeInUp`} data-wow-delay="0.2s"> 
                
                {/* 좌측 섹션: .dis_left */}
                <div className={styles.dis_left}>
                    {/* .dis_bt_top */}
                    <div className={styles.dis_bt_top}>
                        {/* Link를 <p>로 감싸고 .back 클래스 적용 */}
                        <p className={styles.back}>
                            <Link href="/album">&lt; BACK</Link>
                        </p>
                    </div>

                    {/* 앨범 커버 이미지: .onlin_cover */}
                    <div className={styles.onlin_cover}>
                        <Image 
                            alt={album.title} 
                            src={album.coverImageUrl || 'https://via.placeholder.com/455x455?text=No+Image'} 
                            fill 
                            style={{ objectFit: 'cover' }} 
                            unoptimized 
                        />
                    </div>

                    {/* 앨범 날짜: .dis_bt_bottom */}
                    <div className={styles.dis_bt_bottom}>
                        <p className={styles.dis_date}>{album.date ? album.date.split('T')[0] : '날짜 미정'}</p>
                    </div>

                    {/* 트랙리스트: .tracklist (좌측 섹션에 배치) */}
                    {album.tracks && album.tracks.length > 0 && (
                        <div className={styles.tracklist}>
                            {/* release-playlist 클래스 적용 */}
                            <div className={styles['release-playlist']}>
                                {album.tracks.map((track, index) => (
                                    <p key={index}>{index + 1}. {track}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 우측 섹션: .dis_right */}
                <div className={styles.dis_right}>
                    {/* 우측의 앨범 제목 및 설명 컨테이너 */}
                    <div className={styles.discography_inner}>
                        {/* 텍스트 상단: .dis_txt_top */}
                        <div className={styles.dis_txt_top}>
                            {/* album.title에 .album_name 적용 */}
                            <p className={`${styles.album_name} EN`}>{album.title}</p>
                        </div>

                        {/* 앨범 설명: .dis_more_cont */}
                        {album.description && (
                            <div className={styles.dis_more_cont} style={{ whiteSpace: 'pre-line' }}>
                                {album.description}
                            </div>
                        )}

                        {/* 뮤직비디오: .video (16:9 비율 유지) */}
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