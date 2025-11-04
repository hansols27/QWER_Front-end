"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/axios"; // ✅ axios 대신 api 인스턴스 사용
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

// 환경 변수
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error && error.response && error.response.data && typeof error.response.data === "object" && error.response.data.message) {
        return error.response.data.message;
    }
    if (error && typeof error === "object" && error.message) {
        return error.message;
    }
    return defaultMsg;
};

type AlertSeverity = "success" | "error" | "info";

// 유튜브 썸네일 추출 함수
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

export default function VideoCreate() {
    const [title, setTitle] = useState("");
    const [src, setSrc] = useState("");
    const [loading, setLoading] = useState(false);
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
            // ✅ api 인스턴스로 요청 (axios → api로 통일)
            const res = await api.post<{ success: boolean; data: VideoItem }>(`/api/video`, { title, src });
            const newVideo = res.data?.data;

            if (newVideo && newVideo.id) {
                setAlertMessage({ message: "영상이 성공적으로 등록되었습니다! 목록으로 이동합니다.", severity: "success" });
                setTimeout(() => router.push("/video"), 1000);
            } else {
                setAlertMessage({ message: "등록 실패: 백엔드에서 ID가 반환되지 않았습니다.", severity: "error" });
                setLoading(false);
            }
        } catch (err: any) {
            console.error("영상 등록 요청 실패:", err);
            const errorMsg = extractErrorMessage(err, "영상 등록에 실패했습니다. 서버 연결을 확인하세요.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setLoading(false);
        }
    };

    const thumbnailUrl = getThumbnail(src);

    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="error">
                        <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                    </Alert>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">
                    영상 등록
                </Typography>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Box display="flex" flexDirection="column" gap={3}>
                    <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
                    <TextField label="유튜브 링크 (URL)" value={src} onChange={(e) => setSrc(e.target.value)} disabled={loading} />

                    {thumbnailUrl && (
                        <Box mt={1}>
                            <Typography variant="subtitle1" mb={1} fontWeight="bold">
                                미리보기
                            </Typography>
                            <img
                                src={thumbnailUrl}
                                alt="썸네일 미리보기"
                                width="320"
                                style={{ borderRadius: 4, display: "block", maxWidth: "100%", height: "auto" }}
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
