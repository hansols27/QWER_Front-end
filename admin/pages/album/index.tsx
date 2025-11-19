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

// ⭐️ 이미지 크기 상수를 정의합니다. (원본 640x480의 60% 비율)
const IMAGE_WIDTH = 384;
const IMAGE_HEIGHT = 288;
const NO_IMAGE_URL = `https://via.placeholder.com/${IMAGE_WIDTH}x${IMAGE_HEIGHT}?text=No+Image`;


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
     * 앨범 상세/수정 페이지로 이동 (router.push 사용)
     */
    const handleAlbumClick = (albumId: string) => {
        router.push(`/album/${albumId}`);
    };

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

                {/* ⭐️ 수정된 부분: 앨범 목록 레이아웃 (Grid, 40px 간격, 좌측 정렬) */}
                <Box
                    sx={{
                        display: 'grid',
                        gap: '40px', // 앨범과 앨범 사이 간격 40px
                        // 좌측 정렬 및 최소 너비 384px(이미지 너비)로 자동 맞춤
                        gridTemplateColumns: `repeat(auto-fill, ${IMAGE_WIDTH}px)`, 
                        justifyContent: 'flex-start', // 좌측 정렬 보장
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
                                        // Card의 너비를 이미지 너비와 일치
                                        width: `${IMAGE_WIDTH}px`, 
                                    }}
                                >
                                    {/* ⭐️ 이미지 컨테이너 크기를 384x288로 고정 */}
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: `${IMAGE_WIDTH}px`, 
                                            height: `${IMAGE_HEIGHT}px`, 
                                        }}
                                    >
                                        <Image
                                            src={imageUrl}
                                            alt={album.title}
                                            fill
                                            sizes={`${IMAGE_WIDTH}px`}
                                            style={{
                                                // 384x288 컨테이너를 꽉 채우도록 설정 (백엔드에서 이미 리사이징됨)
                                                objectFit: 'contain', // contain으로 설정하여 이미지가 찌그러지지 않도록 합니다.
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