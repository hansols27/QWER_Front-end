'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@shared/services/axios';
import Layout from '@components/common/layout';
import type { AlbumItem } from '@shared/types/album';
import {
    Box,
    Button,
    Card,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';

type AlertSeverity = 'success' | 'error';

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function AlbumList() {
    const [albums, setAlbums] = useState<AlbumItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        message: string;
        severity: AlertSeverity;
    } | null>(null);
    const router = useRouter();

    /**
     * 앨범 목록 불러오기
     */
    const fetchAlbums = useCallback(async () => {
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.get<{ success: boolean; data: AlbumItem[] }>(
                '/api/album'
            );
            setAlbums(res.data.data);
        } catch (err: any) {
            console.error('앨범 로드 실패:', err);
            const errorMsg = extractErrorMessage(
                err,
                '앨범 목록 로드에 실패했습니다. 백엔드 연결 상태를 확인하세요.'
            );
            setAlertMessage({ message: errorMsg, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    // 앨범 등록 페이지로 이동
    const handleCreateClick = () => {
        router.push('/album/create');
    };

    /**
     * ⭐️ 수정: 앨범 상세/수정 페이지로 이동 (router.push 사용)
     */
    const handleAlbumClick = (albumId: string) => {
        router.push(`/album/${albumId}`);
    };

    // ⭐️ 수정: NO_IMAGE_URL 크기 400x320으로 변경
    const NO_IMAGE_URL = 'https://via.placeholder.com/400x320?text=No+Image';

    return (
        <Layout>
            <Box p={4}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                >
                    <Typography variant="h4" fontWeight="bold">
                        앨범 관리
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateClick}
                        disabled={loading}
                    >
                        앨범 등록
                    </Button>
                </Box>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                        <Typography ml={2} sx={{ alignSelf: 'center' }}>
                            로딩 중...
                        </Typography>
                    </Box>
                )}

                {!loading && albums.length === 0 && !alertMessage && (
                    <Typography
                        variant="body1"
                        color="textSecondary"
                        align="center"
                        py={4}
                    >
                        등록된 앨범이 없습니다. 앨범을 등록해 주세요.
                    </Typography>
                )}

                <Box
                    sx={{
                        display: 'grid',
                        gap: '24px',
                        // ⭐️ 수정: 최소 너비를 360px으로 변경
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
                        justifyContent: 'flex-start',
                    }}
                >
                    {albums.map((album) => {
                        const imageUrl = album.image || NO_IMAGE_URL;
                        return (
                            <Box key={album.id}>
                                <Card
                                    onClick={() => handleAlbumClick(album.id)} 
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
                                        // Card의 너비를 400px로 고정
                                        width: '400px', 
                                    }}
                                >
                                    {/* 이미지 컨테이너 크기를 400x320으로 고정 */}
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '400px', // 가로 400px 고정
                                            height: '320px', // 세로 320px 고정
                                        }}
                                    >
                                        <Image
                                            src={imageUrl}
                                            alt={album.title}
                                            fill
                                            sizes="360px"
                                            style={{
                                                // 360x280 컨테이너를 꽉 채우도록 설정
                                                objectFit: 'cover',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                            }}
                                            unoptimized={imageUrl === NO_IMAGE_URL}
                                            priority={false}
                                        />
                                    </Box>

                                    <Box p={1}>
                                        <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                            {album.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="textSecondary"
                                            align="right"
                                        >
                                            {album.date ? album.date.split('T')[0] : '날짜 미정'}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Layout>
    );
}