"use client";

import { useEffect, useState, useCallback } from "react"; // useCallback 추가
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Alert, 
    CircularProgress, 
    Stack 
} from "@mui/material";
import { VideoItem } from "@shared/types/video";

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // ⭐️ 변수명 통일

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

// ⭐️ Alert severity 타입 통일
type AlertSeverity = "success" | "error" | "info";


// 썸네일 URL 생성 함수 (VideoList/Create와 동일한, 더 포괄적인 로직)
const getThumbnail = (url: string) => {
    let videoId = '';
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


export default function VideoDetail() {
    const params = useParams();
    const id = params?.id as string; 
    const router = useRouter();

    const [video, setVideo] = useState<VideoItem | null>(null);
    const [title, setTitle] = useState("");
    const [src, setSrc] = useState("");
    const [loading, setLoading] = useState(true); 
    const [isProcessing, setIsProcessing] = useState(false); 
    // ⭐️ AlertSeverity 타입 사용
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null); 

    // 1. 데이터 로드 (GET)
    const fetchVideo = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }
        if (!API_BASE_URL) {
            setAlertMessage({ message: "환경 설정 오류: API 주소가 설정되지 않았습니다.", severity: "error" });
            setLoading(false);
            return;
        }

        setLoading(true);
        setAlertMessage(null);
        try {
            // ⭐️ API_BASE_URL 사용
            const res = await axios.get<{ success: boolean; data: VideoItem }>(`${API_BASE_URL}/api/video/${id}`);
            const fetchedVideo = res.data.data;

            setVideo(fetchedVideo);
            setTitle(fetchedVideo.title);
            setSrc(fetchedVideo.src);
        } catch (err: any) { // ⭐️ 상세 오류 추출 적용
            console.error("영상 상세 로드 실패:", err);
            const errorMsg = extractErrorMessage(err, "영상 정보를 불러오는 데 실패했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [id]);
    
    useEffect(() => {
        fetchVideo();
    }, [fetchVideo]);


    // 2. 수정 (PUT) 핸들러
    const handleUpdate = async () => {
        setAlertMessage(null);
        if (!video || !API_BASE_URL) return; // ⭐️ API_BASE_URL 사용
        if (!title || !src) {
            setAlertMessage({ message: "제목과 유튜브 링크를 모두 입력해주세요.", severity: "error" });
            return;
        }
        
        setIsProcessing(true);
        
        try {
            // video.id를 string으로 변환
            await axios.put(`${API_BASE_URL}/api/video/${String(video.id)}`, { title, src });
            
            setAlertMessage({ message: "영상이 성공적으로 수정되었습니다! 목록으로 이동합니다.", severity: "success" });
            setTimeout(() => router.push("/video"), 1000); 
        } catch (err: any) { // ⭐️ 상세 오류 추출 적용
            console.error("영상 수정 실패:", err);
            const errorMsg = extractErrorMessage(err, "영상 수정에 실패했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false);
        }
    };

    // 3. 삭제 (DELETE) 핸들러
    const handleDelete = async () => {
        setAlertMessage(null);
        if (!video || !API_BASE_URL) return; // ⭐️ API_BASE_URL 사용
        if (!window.confirm(`"${video.title}" 영상을 정말로 삭제하시겠습니까?`)) return;

        setIsProcessing(true);

        try {
            // video.id를 string으로 변환
            await axios.delete(`${API_BASE_URL}/api/video/${String(video.id)}`);
            
            setAlertMessage({ message: "영상이 성공적으로 삭제되었습니다! 목록으로 이동합니다.", severity: "success" });
            setTimeout(() => router.push("/video"), 1000);
        } catch (err: any) { // ⭐️ 상세 오류 추출 적용
            console.error("영상 삭제 실패:", err);
            const errorMsg = extractErrorMessage(err, "영상 삭제에 실패했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false);
        }
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
    
    // 로딩 중 표시
    if (loading) return (
        <Layout>
            {/* ⭐️ 로딩 컴포넌트 위치 변경: 중앙 정렬 */}
            <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                <CircularProgress />
                <Typography ml={2} mt={2}>영상 정보를 로딩 중...</Typography>
            </Box>
        </Layout>
    );

    // 데이터가 없거나 로드 실패 시
    if (!video) return (
        <Layout>
            <Box p={4}>
                <Alert severity="warning">요청한 ID의 영상을 찾을 수 없습니다.</Alert>
                <Button onClick={() => router.push("/video")} sx={{ mt: 2 }}>목록으로</Button>
            </Box>
        </Layout>
    );

    const thumbnailUrl = getThumbnail(src);

    // 렌더링
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">영상 상세/수정</Typography>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Stack spacing={3}>
                    <TextField 
                        label="제목" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        disabled={isProcessing}
                    />
                    <TextField 
                        label="유튜브 링크 (URL)" 
                        value={src} 
                        onChange={(e) => setSrc(e.target.value)} 
                        disabled={isProcessing}
                    />
                    
                    {/* 썸네일 미리보기 */}
                    {thumbnailUrl ? (
                        <Box mt={1}>
                            <Typography variant="subtitle1" mb={1} fontWeight="bold">미리보기</Typography>
                            <img 
                                src={thumbnailUrl} 
                                alt="썸네일 미리보기" 
                                width="320" 
                                style={{ borderRadius: 4, display: 'block', maxWidth: '100%', height: 'auto' }}
                            />
                        </Box>
                    ) : src && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            유효한 유튜브 링크가 아닌 것 같습니다. 썸네일을 불러올 수 없습니다.
                        </Alert>
                    )}

                    <Box display="flex" gap={2} mt={3}>
                        <Button 
                            variant="contained" 
                            onClick={handleUpdate}
                            disabled={isProcessing || !title || !src}
                            startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                        >
                            {isProcessing ? "수정 처리 중..." : "수정"}
                        </Button>
                        <Button 
                            variant="outlined" 
                            color="error" 
                            onClick={handleDelete}
                            disabled={isProcessing}
                            startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                        >
                            {isProcessing ? "삭제 처리 중..." : "삭제"}
                        </Button>
                    </Box>
                    
                    <Button variant="text" onClick={() => router.push("/video")} disabled={isProcessing}>
                        목록
                    </Button>
                </Stack>
            </Box>
        </Layout>
    );
}