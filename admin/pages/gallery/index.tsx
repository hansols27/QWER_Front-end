"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/axios";
import Layout from "../../components/common/layout";
import type { GalleryItem } from "@shared/types/gallery"; 
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

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; 

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return defaultMsg;
};

export default function GalleryList() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
    const router = useRouter();

    const fetchGalleryItems = useCallback(async () => {
        if (!API_BASE_URL) {
            setAlertMessage({ message: "API 주소가 설정되지 않아 갤러리 아이템을 불러올 수 없습니다.", severity: "error" });
            return;
        }
        
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.get<{ success: boolean; data: GalleryItem[] }>(`${API_BASE_URL}/api/gallery`);
            setItems(res.data.data);
        } catch (err: any) { 
            console.error("갤러리 로드 실패:", err);
            const errorMsg = extractErrorMessage(err, "갤러리 목록 로드에 실패했습니다. 백엔드 연결을 확인하세요.");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGalleryItems();
    }, [fetchGalleryItems]);

    const handleItemClick = (itemId: string) => {
        router.push(`/gallery/${itemId}`); 
    };
    
    const handleCreateClick = () => {
        router.push("/gallery/create");
    };

    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="error">
                        <Typography fontWeight="bold">환경 설정 오류:</Typography> 
                        .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                    </Alert>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold">갤러리 관리</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateClick}
                        disabled={loading} 
                    >
                        등록
                    </Button>
                </Box>

                {/* 알림 메시지 표시 */}
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                {/* 로딩 중 표시 */}
                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                        <Typography ml={2} sx={{ alignSelf: 'center' }}>갤러리 로딩 중...</Typography>
                    </Box>
                )}
                
                {/* 데이터 없음 표시 */}
                {!loading && items.length === 0 && !alertMessage && (
                    <Typography variant="body1" color="textSecondary" align="center" py={4}>
                        등록된 이미지가 없습니다.
                    </Typography>
                )}

                {/* ✅ MUI v5 호환 Grid 버전 */}
                <Grid container spacing={4}{...({} as any)}>
                    {items.map((item) => (
                        <Grid 
                            item 
                            xs={6} 
                            sm={4} 
                            md={3} 
                            key={item.id}{...({} as any)}
                        >
                            <Card
                                onClick={() => handleItemClick(item.id)}
                                sx={{ 
                                    cursor: "pointer", 
                                    transition: "transform 0.2s", 
                                    "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
                                    height: '100%',
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={item.url || 'https://via.placeholder.com/300x300?text=No+Image'} 
                                    alt={`Gallery item ${item.id}`}
                                    sx={{ objectFit: 'cover' }}
                                />
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Layout>
    );
}
