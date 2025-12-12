

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@shared/services/axios"; 
import Layout from "@components/common/layout"; 
import type { GalleryItem } from "@shared/types/gallery"; 
import { 
    Box, 
    Button, 
    Card, 
    Typography, 
    Grid, 
    Alert, 
    CircularProgress 
} from "@mui/material";

type AlertSeverity = "success" | "error";

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
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null); 
    const router = useRouter();

    const fetchGalleryItems = useCallback(async () => {
        setLoading(true);
        setAlertMessage(null);

        try {
            // API Base URL을 axios 인스턴스에 맡기고 경로만 사용
            const res = await api.get<{ success: boolean; data: GalleryItem[] }>("/api/gallery"); 
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

    const handleItemClick = (galleryId: string) => {
        router.push(`/gallery/${galleryId}`); 
    };
    
    const handleCreateClick = () => {
        router.push("/gallery/create");
    };

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

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                        <Typography ml={2} sx={{ alignSelf: 'center' }}>갤러리 로딩 중...</Typography>
                    </Box>
                )}
                
                {!loading && items.length === 0 && !alertMessage && (
                    <Typography variant="body1" color="textSecondary" align="center" py={4}>
                        등록된 이미지가 없습니다.
                    </Typography>
                )}

                {/* Grid 컨테이너: {...({} as any)} 구문 유지 */}
                <Grid container spacing={4} {...({} as any)}> 
                    {items.map((item) => (
                        <Grid 
                            item 
                            xs={6} 
                            sm={4} 
                            md={3} 
                            key={item.id}
                            {...({} as any)} 
                        >
                            <Card
                                onClick={() => handleItemClick(item.id)}
                                sx={{ 
                                    cursor: "pointer", 
                                    transition: "transform 0.2s", 
                                    "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
                                    height: '100%',
                                    position: 'relative',
                                }}
                            >
                                {/* next/image 사용으로 이미지 최적화 */}
                                <Box sx={{ width: '100%', aspectRatio: '1 / 1', position: 'relative' }}>
                                    <Image
                                        src={item.url || 'https://via.placeholder.com/300x300?text=No+Image'}
                                        alt={`Gallery item ${item.id}`}
                                        fill
                                        sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
                                        style={{ objectFit: 'cover' }}
                                        priority={false} 
                                    />
                                </Box>
                                
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Layout>
    );
}