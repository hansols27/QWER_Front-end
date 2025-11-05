"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import { Box, Button, TextField, Typography, Alert, CircularProgress, Stack, Paper } from "@mui/material"; // Paper 추가
import { VideoItem } from "@shared/types/video";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

const getThumbnail = (url: string) => {
    let videoId = "";
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);
    if (match) videoId = match[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0] ?? "";
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
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
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error"; } | null>(null);

    const fetchVideo = useCallback(async () => {
        if (!id) { setLoading(false); return; }
        setLoading(true);
        setAlertMessage(null);

        try {
            // API_BASE_URL 제거 및 상대 경로 사용
            const res = await api.get<{ success: boolean; data: VideoItem }>(`/api/video/${id}`); 
            setVideo(res.data.data);
            setTitle(res.data.data.title);
            setSrc(res.data.data.src);
        } catch (err: any) {
            console.error(err);
            setAlertMessage({ message: extractErrorMessage(err, "영상 로드 실패"), severity: "error" });
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { 
        // 환경 변수 검사 로직을 제거하고, fetchVideo 호출 전에 API_BASE_URL 여부를 확인하여 API 호출을 제어합니다.
        if (process.env.NEXT_PUBLIC_API_URL) {
            fetchVideo(); 
        } else {
            setLoading(false);
            setAlertMessage({ message: "API 주소가 설정되지 않았습니다.", severity: "error" });
        }
    }, [fetchVideo]);

    const handleUpdate = async () => {
        if (!video) return;
        setIsProcessing(true);
        setAlertMessage(null);

        // 제목 및 링크 유효성 검증
        const trimmedTitle = title.trim();
        const trimmedSrc = src.trim();

        if (!trimmedTitle || !trimmedSrc) {
            setAlertMessage({ message: "제목과 유튜브 링크를 모두 입력해야 합니다.", severity: "error" });
            setIsProcessing(false);
            return;
        }

        try {
            // API_BASE_URL 제거 및 트리밍된 데이터 전송
            await api.put(`/api/video/${video.id}`, { title: trimmedTitle, src: trimmedSrc }); 
            
            // 성공 시 로컬 상태 업데이트
            setVideo(prev => prev ? {...prev, title: trimmedTitle, src: trimmedSrc} : null);
            setTitle(trimmedTitle);
            setSrc(trimmedSrc);
            
            setAlertMessage({ message: "영상이 성공적으로 수정되었습니다.", severity: "success" });
        } catch (err: any) {
            setAlertMessage({ message: extractErrorMessage(err, "영상 수정 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };

    const handleDelete = async () => {
        if (!video) return;
        if (!window.confirm(`"${video.title}"을 삭제하시겠습니까?`)) return;
        setIsProcessing(true);
        setAlertMessage(null);
        try {
            // API_BASE_URL 제거
            await api.delete(`/api/video/${video.id}`);
            
            setAlertMessage({ message: "삭제 완료. 목록으로 이동합니다.", severity: "success" });
            // UX: 성공 메시지를 사용자가 볼 수 있도록 잠시 지연
            setTimeout(() => router.push("/video"), 1000); 
        } catch (err: any) {
            setAlertMessage({ message: extractErrorMessage(err, "삭제 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };

    // 로딩 상태
    if (loading) return (
        <Layout>
            <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                <CircularProgress /><Typography mt={2}>로딩 중...</Typography>
            </Box>
        </Layout>
    );

    // 데이터를 찾지 못한 경우
    if (!video) return (
        <Layout>
            <Box p={4}>
                <Alert severity="warning">영상을 찾을 수 없거나 로드에 실패했습니다.</Alert>
                <Button onClick={() => router.push("/video")} sx={{ mt: 2 }}>목록</Button>
            </Box>
        </Layout>
    );

    const thumbnailUrl = getThumbnail(src);

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">영상 상세</Typography>
                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}
                <Stack spacing={3}>
                    <TextField 
                        label="제목" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        disabled={isProcessing} 
                        error={!title.trim() && !isProcessing} // UX: 제목이 비어 있을 경우 시각적 오류 표시
                        helperText={!title.trim() && !isProcessing ? "제목은 필수입니다." : ""}
                    />
                    <TextField 
                        label="유튜브 링크" 
                        value={src} 
                        onChange={e => setSrc(e.target.value)} 
                        disabled={isProcessing} 
                        error={!src.trim() && !isProcessing} // UX: 링크가 비어 있을 경우 시각적 오류 표시
                        helperText={!src.trim() && !isProcessing ? "유튜브 링크는 필수입니다." : ""}
                    />
                    {thumbnailUrl ? (
                        <Paper elevation={3} sx={{ p: 2, display: 'inline-block', maxWidth: 400 }}>
                            <Typography variant="subtitle2" mb={1}>현재 썸네일 미리보기</Typography>
                            <img 
                                src={thumbnailUrl} 
                                alt="썸네일" 
                                style={{ borderRadius: 4, width: '100%', height: 'auto', display: 'block' }} 
                            />
                        </Paper>
                    ) : (
                        <Alert severity="info">유효한 유튜브 링크가 아닙니다. 썸네일을 표시할 수 없습니다.</Alert>
                    )}
                    <Box display="flex" gap={2} mt={3}>
                        <Button 
                            variant="contained" 
                            onClick={handleUpdate} 
                            disabled={isProcessing || !title.trim() || !src.trim()} // 버튼 활성화 조건 강화
                        >
                            {isProcessing ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
                            {isProcessing ? "수정 중..." : "수정"}
                        </Button>
                        <Button variant="outlined" color="error" onClick={handleDelete} disabled={isProcessing}>
                            {isProcessing ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
                            {isProcessing ? "삭제 중..." : "삭제"}
                        </Button>
                    </Box>
                    <Button variant="text" onClick={() => router.push("/video")} disabled={isProcessing}>목록</Button>
                </Stack>
            </Box>
        </Layout>
    );
}