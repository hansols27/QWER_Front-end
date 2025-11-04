"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/axios"; // ✅ axios 대신 api 사용
import Layout from "../../components/common/layout";
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Stack, 
    Alert, 
    CircularProgress 
} from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

// 환경 변수 (백엔드 주소)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function AlbumCreate() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [tracks, setTracks] = useState<string[]>([""]);
    const [videoUrl, setVideoUrl] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

    // 파일 선택 핸들러
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
    };
    
    // 트랙 관리
    const handleTrackChange = (idx: number, value: string) => {
        const newTracks = [...tracks];
        newTracks[idx] = value;
        setTracks(newTracks);
    };
    const addTrack = () => setTracks([...tracks, ""]);
    const removeTrack = (idx: number) => setTracks(tracks.filter((_, i) => i !== idx));

    // 앨범 등록
    const handleSubmit = async () => {
        setAlertMessage(null);
        if (!API_BASE_URL) {
            setAlertMessage({ message: "환경 설정 오류: API 주소가 설정되지 않았습니다.", severity: "error" });
            return;
        }
        if (!coverFile) {
            setAlertMessage({ message: "필수 항목: 커버 이미지를 선택해주세요.", severity: "error" });
            return;
        }
        
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("date", date);
            formData.append("coverFile", coverFile);
            formData.append("description", description ?? "");
            formData.append("videoUrl", videoUrl ?? "");

            // 빈 트랙 제거 후 전송
            const filteredTracks = tracks.filter(t => t.trim() !== "");
            filteredTracks.forEach((track, idx) => {
                formData.append(`tracks[${idx}]`, track);
            });

            // ✅ axios → api 로 변경
            const res = await api.post<{ success: boolean; data?: AlbumItem }>(
                "/api/album", 
                formData, 
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (res.data.success) {
                setAlertMessage({ message: "앨범이 성공적으로 등록되었습니다! 목록으로 이동합니다.", severity: "success" });
                setTimeout(() => router.push("/album"), 1000);
            } else {
                setAlertMessage({ message: "등록 실패: 백엔드에서 오류가 발생했습니다.", severity: "error" });
            }
        } catch (err: any) {
            console.error("앨범 등록 요청 실패:", err);
            const errorMsg = extractErrorMessage(err, "앨범 등록 요청에 실패했습니다. 서버 연결을 확인하세요.");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    // 환경 변수 누락 시 표시
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
                <Typography variant="h4" mb={2} fontWeight="bold">새 앨범 등록</Typography>
                
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}
                
                <Stack spacing={3}>
                    <TextField 
                        label="타이틀" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        required
                        disabled={loading}
                    />
                    <TextField 
                        label="발매일" 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        InputLabelProps={{ shrink: true }} 
                        required
                        disabled={loading}
                    />
                    <TextField 
                        label="설명 (선택 사항)" 
                        multiline minRows={3} 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        disabled={loading}
                    />
                    <TextField 
                        label="유튜브 링크 (선택 사항)" 
                        value={videoUrl} 
                        onChange={e => setVideoUrl(e.target.value)} 
                        disabled={loading}
                    />
                    
                    <Typography variant="h6" mt={2} fontWeight="bold">트랙 목록</Typography>
                    {tracks.map((track, idx) => (
                        <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                            <TextField
                                label={`트랙 ${idx + 1}`}
                                value={track}
                                onChange={e => handleTrackChange(idx, e.target.value)}
                                fullWidth
                                disabled={loading}
                            />
                            {tracks.length > 1 && (
                                <Button onClick={() => removeTrack(idx)} color="error" disabled={loading}>삭제</Button>
                            )}
                        </Stack>
                    ))}
                    <Button onClick={addTrack} variant="outlined" disabled={loading}>트랙 추가</Button>
                    
                    <Typography variant="h6" mt={2} fontWeight="bold">커버 이미지 (필수)</Typography>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        disabled={loading}
                    />
                    {coverFile && <Typography variant="body2">선택된 파일: {coverFile.name}</Typography>}
                    
                    <Box mt={4}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleSubmit} 
                            disabled={loading || !title || !date || !coverFile}
                            startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        >
                            {loading ? "등록 중..." : "앨범 등록"}
                        </Button>
                    </Box>
                    
                    <Button 
                        variant="text" 
                        onClick={() => router.push("/album")} 
                        disabled={loading}
                    >
                        목록
                    </Button>
                </Stack>
            </Box>
        </Layout>
    );
}
