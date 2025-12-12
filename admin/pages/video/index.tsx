"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import {
    Box,
    Button,
    Card,
    CardMedia,
    Typography,
    Grid,
    Alert,
    CircularProgress
} from "@mui/material";
import { VideoItem } from "@shared/types/video";

type AlertSeverity = "success" | "error" | "warning";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

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

export default function VideoList() {
    const [items, setItems] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity; } | null>(null);
    const router = useRouter();

    const fetchVideoItems = useCallback(async () => {
        if (!API_BASE_URL) {
            setLoading(false);
            setAlertMessage({ message: "API 주소가 설정되지 않아 영상을 불러올 수 없습니다.", severity: "error" });
            return;
        }

        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.get<{ success: boolean; data: VideoItem[] }>("/api/video");
            setItems(res.data.data);
        } catch (err: any) {
            console.error("영상 목록 로드 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "영상 목록 로드 실패"), severity: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchVideoItems(); }, [fetchVideoItems]);

    const handleVideoClick = (videoId: string | number) => {
        const id = String(videoId);

        if (!id || typeof id !== 'string') {
            console.error("유효하지 않은 영상 ID:", videoId);
            setAlertMessage({ message: "유효하지 않은 영상 항목입니다.", severity: "warning" });
            return;
        }

        router.push(`/video/${videoId}`);
    };

    return (
        <Layout>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold">영상 관리</Typography>
                    <Button variant="contained" onClick={() => router.push("/video/create")} disabled={loading}>등록</Button>
                </Box>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                {loading && (
                    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                        <CircularProgress />
                        <Typography ml={2}>로딩 중...</Typography>
                    </Box>
                )}

                {!loading && items.length === 0 && !alertMessage && (
                    <Typography variant="body1" color="textSecondary" align="center" py={4}>
                        등록된 영상이 없습니다.
                    </Typography>
                )}

                {/* 360px 카드에 맞춰 균등 정렬 */}
                <Grid container spacing={4} {...({} as any)}>
                    {items.map((item) => (
                        <Grid item key={String(item.id)} {...({} as any)}>

                            {/* 카드 전체 크기 고정 */}
                            <Card
                                onClick={() => handleVideoClick(item.id)}
                                sx={{
                                    cursor: "pointer",
                                    width: "360px",
                                    transition: "transform 0.2s",
                                    "&:hover": { transform: "scale(1.02)", boxShadow: 6 }
                                }}
                            >
                                {/* 썸네일 크기 고정 */}
                                <CardMedia
                                    component="img"
                                    image={getThumbnail(item.src) || "https://via.placeholder.com/360x240?text=No+Thumbnail"}
                                    alt={item.title}
                                    sx={{
                                        width: "360px",
                                        height: "240px",
                                        objectFit: "cover"
                                    }}
                                />

                                {/* 제목 영역 */}
                                <Box p={1}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            height: "44px"  // 두 줄 텍스트 높이 고정
                                        }}
                                    >
                                        {item.title}
                                    </Typography>
                                </Box>
                            </Card>

                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Layout>
    );
}
