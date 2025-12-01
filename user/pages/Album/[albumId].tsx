'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { api } from "@shared/services/axios";
import '@front/styles/albumdetail.module.css';
import { CircularProgress, Alert, Box, Typography, Button } from '@mui/material';
import { AlbumItem } from '@shared/types/album';

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function AlbumDetail() {
    const router = useRouter();
    const albumId = router.query.albumId as string | undefined; 

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
                <Link href="/album">
                    <Button variant="contained">목록으로 돌아가기</Button>
                </Link>
            </Box>
        );
    }

    return (
        <div className="container">
            <div id="side">
                <div className="side2">
                    02
                    <span className="s_line"></span>
                    DISCOGRAPHY
                </div>
            </div>

            <div className="cont discography wow fadeInUp" data-wow-delay="0.2s">
                <div className="dis_left">
                    <div className="dis_bt_top">
                        <p className="back">
                            <Link href="/album">&lt; BACK</Link>
                        </p>
                    </div>

                    <div className="onlin_cover" style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Image 
                            alt={album.title} 
                            src={album.coverImageUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
                            fill 
                            style={{ objectFit: 'cover' }} 
                            unoptimized 
                        />
                    </div>

                    <div className="dis_bt_bottom">
                        <p className="dis_date">{album.date ? album.date.split('T')[0] : '날짜 미정'}</p>
                    </div>

                    {album.tracks && album.tracks.length > 0 && (
                        <div className="tracklist">
                            <div className="card-bare-text release-playlist text-tall">
                                {album.tracks.map((track, index) => (
                                    <p key={index}>{index + 1}. {track}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="dis_right">
                    <div className="discography_inner">
                        <div className="dis_txt_top">
                            <p className="album_name EN">{album.title}</p>
                        </div>

                        {album.description && (
                            <div className="dis_more_cont" style={{ whiteSpace: 'pre-line' }}>
                                {album.description}
                            </div>
                        )}

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
