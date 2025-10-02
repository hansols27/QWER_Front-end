"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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

// 환경 변수를 사용하여 API 기본 URL 설정 (백엔드 주소)
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AlbumCreate() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [tracks, setTracks] = useState<string[]>([""]);
    const [videoUrl, setVideoUrl] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    
    // ⭐️ 로딩 및 알림 상태
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
    };
    
    // ⭐️ 트랙 필드 추가/삭제 핸들러
    const addTrack = () => setTracks([...tracks, ""]);
    const removeTrack = (idx: number) => setTracks(tracks.filter((_, i) => i !== idx));

    const handleSubmit = async () => {
        setAlertMessage(null);
        if (!NEXT_PUBLIC_API_URL) {
            setAlertMessage({ message: "API 주소가 설정되지 않았습니다.", severity: "error" });
            return;
        }
        if (!coverFile) {
            setAlertMessage({ message: "커버 이미지를 선택해주세요.", severity: "error" });
            return;
        }
        
        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("date", date);
        formData.append("description", description);
        formData.append("videoUrl", videoUrl);
        formData.append("coverFile", coverFile);
        // 빈 트랙 제거 후 전송
        const filteredTracks = tracks.filter(t => t.trim() !== "");
        filteredTracks.forEach((track, idx) => formData.append(`tracks[${idx}]`, track));

        try {
            // ⭐️ 절대 경로 사용
            const res = await axios.post<{ success: boolean; data?: AlbumItem }>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/album`, 
                formData, 
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (res.data.success) {
                setAlertMessage({ message: "앨범이 성공적으로 등록되었습니다!", severity: "success" });
                // 성공 후 목록 페이지로 이동
                setTimeout(() => router.push("/album"), 1000); 
            } else {
                setAlertMessage({ message: "등록 실패: 백엔드에서 오류가 발생했습니다.", severity: "error" });
            }
        } catch (err) {
            console.error(err);
            setAlertMessage({ message: "등록 요청 실패: 서버 연결을 확인하세요.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2}>앨범 등록</Typography>
                
                {/* ⭐️ 추가: 알림 메시지 표시 */}
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}
                
                <Stack spacing={2}>
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
                        label="설명" 
                        multiline minRows={3} 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        disabled={loading}
                    />
                    <TextField 
                        label="유튜브 링크" 
                        value={videoUrl} 
                        onChange={e => setVideoUrl(e.target.value)} 
                        disabled={loading}
                    />
                    
                    <Typography variant="h6" mt={2}>트랙 목록</Typography>
                    {tracks.map((track, idx) => (
                        <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                            <TextField
                                label={`트랙 ${idx + 1}`}
                                value={track}
                                onChange={e => {
                                    const newTracks = [...tracks];
                                    newTracks[idx] = e.target.value;
                                    setTracks(newTracks);
                                }}
                                fullWidth
                                disabled={loading}
                            />
                            {/* ⭐️ 트랙 삭제 버튼 */}
                            {tracks.length > 1 && (
                                <Button onClick={() => removeTrack(idx)} color="error" disabled={loading}>삭제</Button>
                            )}
                        </Stack>
                    ))}
                    {/* ⭐️ 트랙 추가 버튼 */}
                    <Button onClick={addTrack} variant="outlined" disabled={loading}>트랙 추가</Button>
                    
                    <Typography variant="h6" mt={2}>커버 이미지</Typography>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        disabled={loading}
                    />
                    {coverFile && <Typography variant="body2">선택된 파일: {coverFile.name}</Typography>}
                    
                    {/* ⭐️ 로딩 상태 및 필수 필드 확인 */}
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit} 
                        disabled={loading || !title || !date || !coverFile || !NEXT_PUBLIC_API_URL}
                        startIcon={loading && <CircularProgress size={20} color="inherit" />}
                    >
                        {loading ? "등록 중..." : "앨범 등록"}
                    </Button>
                    
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