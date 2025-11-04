"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/axios";
import Layout from "../../components/common/layout";
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

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// 유튜브 썸네일 URL 생성 함수
const getThumbnail = (url: string) => {
    let videoId = "";
    const regExp =
        /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);

    if (match) {
        videoId = match[1];
    } else if (url.includes("v=")) {
        videoId = url.split("v=")[1]?.split("&")[0] ?? "";
    } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
    }

    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};

export default function VideoList() {
    const [items, setItems] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<{
        message: string;
        severity: "success" | "error";
    } | null>(null);
    const router = useRouter();

    // 1. 영상 목록 불러오기 (GET)
    const fetchVideoItems = useCallback(async () => {
        if (!API_BASE_URL) {
            setLoading(false);
            setAlertMessage({
                message: "API 주소가 설정되지 않아 영상을 불러올 수 없습니다.",
                severity: "error",
            });
            return;
        }

        setLoading(true);
        setAlertMessage(null);

        try {
            // ✅ axios 대신 api 인스턴스 사용 + 타입 캐스팅으로 안정성 확보
            const res = await api.get<{ success: boolean; data: VideoItem[] }>(
                `${API_BASE_URL}/api/video`,
                {} as any
            );

            setItems(res.data.data);
        } catch (err: any) {
            console.error("영상 목록 로드 실패:", err);
            const errorMsg = extractErrorMessage(
                err,
                "영상 목록 로드에 실패했습니다. 백엔드 연결을 확인하세요."
            );
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVideoItems();
    }, [fetchVideoItems]);

    const handleCreateClick = () => {
        router.push("/video/create");
    };

    const handleItemClick = (itemId: string | number) => {
        router.push(`/video/${String(itemId)}`);
    };

    // 환경 설정 오류 조기 종료
    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="error">
                        <Typography fontWeight="bold">환경 설정 오류:</Typography>{" "}
                        .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                    </Alert>
                </Box>
            </Layout>
        );
    }

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
                        영상 관리
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={handleCreateClick}
                        disabled={loading}
                    >
                        등록
                    </Button>
                </Box>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                {loading && (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        py={4}
                    >
                        <CircularProgress />
                        <Typography ml={2}>영상 로딩 중...</Typography>
                    </Box>
                )}

                {!loading && items.length === 0 && !alertMessage && (
                    <Typography
                        variant="body1"
                        color="textSecondary"
                        align="center"
                        py={4}
                    >
                        등록된 영상이 없습니다.
                    </Typography>
                )}

                <Grid container spacing={4} {...({} as any)}>
                    {items.map((item) => (
                        <Grid
                            item
                            xs={6}
                            sm={4}
                            md={3}
                            key={String(item.id)}
                            {...({} as any)}
                        >
                            <Card
                                onClick={() => handleItemClick(item.id)}
                                sx={{
                                    cursor: "pointer",
                                    transition: "transform 0.2s",
                                    "&:hover": {
                                        transform: "scale(1.02)",
                                        boxShadow: 6,
                                    },
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={
                                        getThumbnail(item.src) ||
                                        "https://via.placeholder.com/200x200?text=No+Thumbnail"
                                    }
                                    alt={item.title}
                                    sx={{ objectFit: "cover" }}
                                />
                                <Box p={1}>
                                    <Typography variant="subtitle1" noWrap>
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
