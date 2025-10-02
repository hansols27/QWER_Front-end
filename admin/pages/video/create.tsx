"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { 
    Box, 
    Button, 
    TextField, 
    Typography,
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
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return defaultMsg;
};

// ⭐️ Alert severity 타입 통일 (info를 포함시켜 다른 컴포넌트와 일관성 유지)
type AlertSeverity = "success" | "error" | "info";

// 유튜브 썸네일 URL 생성 함수 (VideoList.tsx와 동일한, 더 포괄적인 로직)
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


export default function VideoCreate() {
    const [title, setTitle] = useState("");
    const [src, setSrc] = useState(""); // 유튜브 링크
    const [loading, setLoading] = useState(false); 
    // ⭐️ AlertSeverity 타입 사용
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null); 
    const router = useRouter();

    const handleSubmit = async () => {
        setAlertMessage(null);
        if (!API_BASE_URL) {
            setAlertMessage({ message: "API 주소가 설정되지 않아 등록할 수 없습니다.", severity: "error" });
            return;
        }
        if (!title || !src) {
            setAlertMessage({ message: "제목과 유튜브 링크를 모두 입력해주세요.", severity: "error" });
            return;
        }
        if (!getThumbnail(src)) {
            setAlertMessage({ message: "유효하지 않은 유튜브 링크 형식입니다.", severity: "error" });
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post<VideoItem>(`${API_BASE_URL}/api/video`, { title, src });
            
            if (res.data.id) {
                setAlertMessage({ message: "영상이 성공적으로 등록되었습니다! 목록으로 이동합니다.", severity: "success" });
                // 등록 후 리스트 페이지로 이동 (1초 대기)
                setTimeout(() => router.push("/video"), 1000); 
            } else {
                setAlertMessage({ message: "등록 실패: 백엔드에서 ID가 반환되지 않았습니다.", severity: "error" });
                setLoading(false); // ⭐️ 실패 시 로딩 해제
            }
        } catch (err: any) { // ⭐️ err: any 명시 및 상세 오류 추출
            console.error("영상 등록 요청 실패:", err);
            const errorMsg = extractErrorMessage(err, "영상 등록에 실패했습니다. 서버 연결을 확인하세요.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setLoading(false); // ⭐️ 오류 발생 시 로딩 해제
        }
        // ⭐️ 성공 시에는 setTimeout이 언마운트를 처리하므로, finally 블록 제거
    };

    const thumbnailUrl = getThumbnail(src);

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
                {/* ⭐️ Typography 스타일 일관성 유지 */}
                <Typography variant="h4" mb={2} fontWeight="bold">영상 등록</Typography>
                
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Box display="flex" flexDirection="column" gap={3}>
                    <TextField 
                        label="제목" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        disabled={loading}
                    />
                    <TextField 
                        label="유튜브 링크 (URL)" 
                        value={src} 
                        onChange={(e) => setSrc(e.target.value)} 
                        disabled={loading}
                    />
                    
                    {/* 썸네일 미리보기 */}
                    {thumbnailUrl && (
                        <Box mt={1}>
                            <Typography variant="subtitle1" mb={1} fontWeight="bold">미리보기</Typography>
                            <img 
                                src={thumbnailUrl} 
                                alt="썸네일 미리보기" 
                                width="320" 
                                style={{ borderRadius: 4, display: 'block', maxWidth: '100%', height: 'auto' }}
                            />
                        </Box>
                    )}

                    <Box mt={2} display="flex" justifyContent="space-between">
                        <Button variant="text" onClick={() => router.push("/video")} disabled={loading}>
                            목록
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit}
                            // ⭐️ API_BASE_URL 체크 로직 제거 (이미 위에서 체크)
                            disabled={loading || !title || !src} 
                            startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        >
                            {loading ? "등록 중..." : "등록"}
                        </Button>
                    </Box>

                </Box>
            </Box>
        </Layout>
    );
}