'use client';

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import { Box, Button, TextField, Typography, Stack, Alert, CircularProgress } from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

// 상수
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const NO_IMAGE_URL = "https://via.placeholder.com/150x150?text=Cover+Image";

type AlertSeverity = "success" | "error";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function AlbumCreate() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [tracks, setTracks] = useState<string[]>([""]); // 빈 트랙 하나로 시작
    const [videoUrl, setVideoUrl] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // ---------------------------
    // 1. 파일 미리보기 URL 생성 및 해제
    // ---------------------------
    useEffect(() => {
        if (!coverFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(coverFile);
        setPreviewUrl(url);
        // 메모리 누수 방지를 위해 URL 해제
        return () => URL.revokeObjectURL(url);
    }, [coverFile]);

    // ---------------------------
    // 2. 파일 변경 핸들러 및 유효성 검사
    // ---------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        const file = e.target.files?.[0];
        
        if (!file) {
            setCoverFile(null);
            setPreviewUrl(null);
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            setAlertMessage({ message: "지원되지 않는 이미지 형식입니다. jpg, jpeg, png만 가능합니다.", severity: "error" });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setAlertMessage({ message: "이미지 용량이 10MB를 초과합니다.", severity: "error" });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setCoverFile(file);
        setAlertMessage({ message: `선택된 파일: ${file.name}`, severity: "success" });
    };

    // ---------------------------
    // 3. 트랙 관리 핸들러
    // ---------------------------
    const handleTrackChange = (idx: number, value: string) => {
        const newTracks = [...tracks];
        newTracks[idx] = value;
        setTracks(newTracks);
    };

    const addTrack = () => setTracks([...tracks, ""]);
    
    const removeTrack = (idx: number) => {
        const newTracks = tracks.filter((_, i) => i !== idx);
        // 트랙이 모두 삭제되면 빈 필드 하나 유지
        setTracks(newTracks.length > 0 ? newTracks : [""]); 
    };

    // ---------------------------
    // 4. 앨범 등록 (POST)
    // ---------------------------
    const handleSubmit = async () => {
        setAlertMessage(null);
        
        if (!coverFile) {
            setAlertMessage({ message: "필수 항목: 커버 이미지를 선택해주세요.", severity: "error" });
            return;
        }
        if (!title || !date) {
            setAlertMessage({ message: "필수 항목: 타이틀과 발매일을 입력해주세요.", severity: "error" });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("date", date);
            formData.append("coverFile", coverFile);
            formData.append("description", description);
            formData.append("videoUrl", videoUrl);

            // 비어있지 않은 트랙만 전송
            tracks.filter(t => t.trim() !== "").forEach((track, idx) => formData.append(`tracks[${idx}]`, track));

            const res = await api.post<{ success: boolean; data?: AlbumItem }>("/api/album", formData, { headers: { "Content-Type": "multipart/form-data" } });

            if (res.data.success) {
                setAlertMessage({ message: "앨범이 성공적으로 등록되었습니다! 목록으로 이동합니다.", severity: "success" });
                // 성공 시 1초 후 목록 페이지로 이동
                setTimeout(() => router.push("/album"), 1000); 
            } else {
                setAlertMessage({ message: "등록 실패: 서버에서 오류가 발생했습니다.", severity: "error" });
            }
        } catch (err: any) {
            console.error("앨범 등록 요청 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "앨범 등록 요청에 실패했습니다. 서버 연결을 확인하세요."), severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------
    // 5. 렌더링
    // ---------------------------
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">앨범 등록</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Stack spacing={3}>
                    {/* 기본 정보 */}
                    <TextField label="타이틀" value={title} onChange={e => setTitle(e.target.value)} required disabled={loading} />
                    <TextField label="발매일" type="date" value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} required disabled={loading} />
                    <TextField label="설명 (선택 사항)" multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={loading} />
                    <TextField label="유튜브 링크 (선택 사항)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} disabled={loading} />

                    {/* 트랙 목록 */}
                    <Typography variant="h6" mt={2} fontWeight="bold">트랙 목록</Typography>
                    {tracks.map((track, idx) => (
                        <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                            <TextField label={`트랙 ${idx + 1}`} value={track} onChange={e => handleTrackChange(idx, e.target.value)} fullWidth disabled={loading} />
                            {/* 트랙이 하나 이상일 때만 삭제 버튼 표시 */}
                            {tracks.length > 1 && <Button onClick={() => removeTrack(idx)} color="error" disabled={loading}>삭제</Button>}
                        </Stack>
                    ))}
                    <Button onClick={addTrack} variant="outlined" disabled={loading}>트랙 추가</Button>

                    {/* 커버 이미지 */}
                    <Typography variant="h6" mt={2} fontWeight="bold">커버 이미지 (필수)</Typography>
                    
                    {/* 이미지 미리보기 */}
                    <Box mb={2} sx={{ width: 150, height: 150, position: 'relative', border: '1px solid #eee', borderRadius: 1, overflow: 'hidden' }}>
                        <Image
                            src={previewUrl || NO_IMAGE_URL}
                            alt="Album Cover Preview"
                            fill
                            sizes="150px"
                            style={{ objectFit: "cover" }}
                            unoptimized={true} // 로컬 파일이나 플레이스홀더는 최적화 제외
                        />
                    </Box>
                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/jpg,image/png" onChange={handleFileChange} disabled={loading} />
                    <Typography variant="caption" color="textSecondary">
                        * 최대 10MB, JPG/PNG 허용.
                    </Typography>

                    {/* 액션 버튼 */}
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

                    <Button variant="text" onClick={() => router.push("/album")} disabled={loading}>목록으로 돌아가기</Button>
                </Stack>
            </Box>
        </Layout>
    );
}