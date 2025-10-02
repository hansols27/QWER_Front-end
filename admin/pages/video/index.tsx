"use client";

import { useEffect, useState, useCallback } from "react"; // useCallback 추가
import { useRouter } from "next/navigation";
import axios from "axios";
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // ⭐️ 변수명 통일

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    // Axios 응답 오류 (response.data.message) 확인
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    // 일반적인 Error 객체의 메시지 확인
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return defaultMsg;
};

// 유튜브 썸네일 URL 생성 함수 (컴포넌트 외부로 이동하여 최적화)
const getThumbnail = (url: string) => {
    let videoId = '';
    // 유튜브 URL 형식 매칭 (youtu.be, watch?v=, embed/ 등 커버)
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);

    if (match) {
        videoId = match[1];
    } 
    // 유효한 ID가 추출되지 않은 경우, URL 분해 시도 ( fallback )
    else if (url.includes("v=")) {
        videoId = url.split("v=")[1]?.split("&")[0] ?? '';
    } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? '';
    }

    // 고화질 썸네일 URL 반환
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};


export default function VideoList() {
    const [items, setItems] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
    const router = useRouter();

    // 1. 데이터 로드 (GET) - ⭐️ useCallback 적용
    const fetchVideoItems = useCallback(async () => {
        if (!API_BASE_URL) {
            setLoading(false);
            setAlertMessage({ message: "API 주소가 설정되지 않아 영상을 불러올 수 없습니다.", severity: "error" });
            return;
        }
        
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await axios.get<{ success: boolean; data: VideoItem[] }>(`${API_BASE_URL}/api/video`);
            setItems(res.data.data);
        } catch (err: any) { // ⭐️ err: any 명시 및 상세 오류 추출
            console.error("영상 목록 로드 실패:", err);
            const errorMsg = extractErrorMessage(err, "영상 목록 로드에 실패했습니다. 백엔드 연결을 확인하세요.");
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
        // item.id가 number일 수 있으므로 명시적으로 문자열로 변환
        router.push(`/video/${String(itemId)}`); 
    };

    // ⭐️ 환경 설정 오류 조기 종료
    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}><Alert severity="error">
                    <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                </Alert></Box>
            </Layout>
        );
    }
    
    return (
        <Layout>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    {/* ⭐️ Typography 스타일 일관성 유지 */}
                    <Typography variant="h4" fontWeight="bold">영상 관리</Typography> 
                    <Button 
                        variant="contained" 
                        onClick={handleCreateClick}
                        disabled={loading} // ⭐️ API_BASE_URL 체크 로직 제거 (이미 위에서 체크)
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
                    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                        <CircularProgress />
                        <Typography ml={2}>영상 로딩 중...</Typography>
                    </Box>
                )}
                
                {!loading && items.length === 0 && !alertMessage && (
                    <Typography variant="body1" color="textSecondary" align="center" py={4}>
                        등록된 영상이 없습니다.
                    </Typography>
                )}

                {/* Grid container: 갤러리/앨범과 통일된 spacing=4 사용 */}
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
                                    "&:hover": { transform: "scale(1.02)", boxShadow: 6 } // ⭐️ Box shadow 추가로 강조
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={getThumbnail(item.src) || 'https://via.placeholder.com/200x200?text=No+Thumbnail'} 
                                    alt={item.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <Box p={1}>
                                    <Typography variant="subtitle1" noWrap>{item.title}</Typography>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Layout>
    );
}