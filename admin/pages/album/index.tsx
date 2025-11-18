'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import Link from "next/link"; // ⭐️ Link 컴포넌트 추가
import { api } from "@shared/services/axios"; 
import Layout from "@components/common/layout";
import {
    Box,
    Button,
    Card,
    Typography,
    Grid,
    Alert,
    CircularProgress,
} from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

type AlertSeverity = "success" | "error";

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
                "/api/album"
            );
            setAlbums(res.data.data);
        } catch (err: any) {
            console.error("앨범 로드 실패:", err);
            const errorMsg = extractErrorMessage(
                err,
                "앨범 목록 로드에 실패했습니다. 백엔드 연결 상태를 확인하세요."
            );
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    // 앨범 상세/수정 페이지로 이동 함수는 Link 사용으로 인해 제거하거나 주석 처리합니다.
    // const handleAlbumClick = (albumId: string) => {
    //     router.push(`/album/${albumId}`);
    // };

    // 앨범 생성 페이지로 이동
    const handleCreateClick = () => {
        router.push("/album/create");
    };

    const NO_IMAGE_URL = "https://via.placeholder.com/300x300?text=No+Image";

    return (
        <Layout>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                        <Typography ml={2} sx={{ alignSelf: "center" }}>
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

                <Grid container spacing={4} {...({} as any)}>
                    {albums.map((album) => {
                        const imageUrl = album.image || NO_IMAGE_URL;
                        return (
                            <Grid item xs={6} sm={4} md={3} key={album.id} {...({} as any)}>
                                {/* ⭐️ 상세 페이지 이동 문제 해결: Link로 Card를 감쌉니다. */}
                                <Link
                                    href={`/album/${album.id}`}
                                    passHref 
                                    legacyBehavior
                                    style={{ textDecoration: 'none', color: 'inherit' }} // Link 스타일 제거
                                >
                                    <Card
                                        // 💡 onClick 이벤트는 제거합니다. Link가 라우팅을 처리합니다.
                                        sx={{
                                            cursor: "pointer",
                                            transition: "transform 0.2s",
                                            "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
                                            height: "100%",
                                        }}
                                    >
                                        {/* ⭐️ 이미지 비율 문제 해결: 컨테이너를 1:1 정사각형으로 통일 */}
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                width: '100%',
                                                // 모든 앨범을 1:1 비율로 강제 통일
                                                paddingTop: '100%', 
                                            }}
                                        >
                                            <Image
                                                src={imageUrl}
                                                alt={album.title}
                                                fill
                                                sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
                                                style={{ 
                                                    // 1:1 컨테이너를 꽉 채우도록 설정 (비율이 다르면 잘림 발생)
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
                                                {album.date ? album.date.split('T')[0] : "날짜 미정"}
                                            </Typography>
                                        </Box>
                                    </Card>
                                </Link>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        </Layout>
    );
}