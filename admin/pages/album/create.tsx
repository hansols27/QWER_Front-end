'use client';

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Stack, 
    Alert, 
    CircularProgress, 
    Card,           
    Divider,     
} from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

// 상수
const MAX_FILE_SIZE = 20 * 1024 * 1024;
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
    const [tracks, setTracks] = useState<string[]>([""]);
    const [videoUrl, setVideoUrl] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // 1. 파일 미리보기 URL 생성 및 해제 (로직 변경 없음)
    useEffect(() => {
        if (!coverFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(coverFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [coverFile]);

    // 2. 파일 변경 핸들러 및 유효성 검사 (로직 변경 없음)
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        // ... (기존 로직 유지)
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
            setAlertMessage({ message: `이미지 용량이 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다.`, severity: "error" });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setCoverFile(file);
        // Alert 메시지는 제거하고, 파일 이름을 UI에 직접 표시하도록 변경
        setAlertMessage(null); 
    };

    // 3. 트랙 관리 핸들러 (로직 변경 없음)
    const handleTrackChange = (idx: number, value: string) => {
        const newTracks = [...tracks];
        newTracks[idx] = value;
        setTracks(newTracks);
    };

    const addTrack = () => setTracks([...tracks, ""]);
    
    const removeTrack = (idx: number) => {
        const newTracks = tracks.filter((_, i) => i !== idx);
        setTracks(newTracks.length > 0 ? newTracks : [""]); 
    };

    // 4. 앨범 등록 (POST) (로직 변경 없음)
    const handleSubmit = async () => {
        // ... (기존 로직 유지)
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

            tracks.filter(t => t.trim() !== "").forEach((track, idx) => formData.append(`tracks[${idx}]`, track));

            const res = await api.post<{ success: boolean; data?: AlbumItem }>("/api/album", formData, { headers: { "Content-Type": "multipart/form-data" } });

            if (res.data.success) {
                setAlertMessage({ message: "앨범이 성공적으로 등록되었습니다! 목록으로 이동합니다.", severity: "success" });
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

    // 5. 렌더링
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">앨범 등록</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Stack spacing={3}>
                    {/* 기본 정보 Card */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>기본 정보</Typography>
                        <Stack spacing={3}>
                            <TextField label="타이틀" value={title} onChange={e => setTitle(e.target.value)} required disabled={loading} />
                            <TextField label="발매일" type="date" value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} required disabled={loading} />
                            <TextField label="설명 (선택 사항)" multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={loading} />
                            <TextField label="유튜브 링크 (선택 사항)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} disabled={loading} />
                        </Stack>
                    </Card>

                    {/* 트랙 목록 Card */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>트랙 목록</Typography>
                        <Stack spacing={2}>
                            {tracks.map((track, idx) => (
                                <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                                    <TextField label={`트랙 ${idx + 1}`} value={track} onChange={e => handleTrackChange(idx, e.target.value)} fullWidth disabled={loading} size="small" />
                                    {tracks.length > 1 && <Button onClick={() => removeTrack(idx)} color="error" size="small" disabled={loading}>삭제</Button>}
                                </Stack>
                            ))}
                            {/* 셋팅 페이지 스타일의 아웃라인 버튼 */}
                            <Button onClick={addTrack} variant="outlined" disabled={loading} sx={{ mt: 1, alignSelf: 'flex-start' }}>트랙 추가</Button>
                        </Stack>
                    </Card>

                    {/* 커버 이미지 Card */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>커버 이미지 (필수)</Typography>
                        
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
                            <Box>
                                {/* 셋팅 페이지처럼 Button을 파일 선택에 사용 */}
                                <Button variant="contained" component="label" color="primary" disabled={loading}>
                                    이미지 업로드
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="image/jpeg,image/jpg,image/png" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        disabled={loading}
                                    />
                                </Button>
                                {coverFile && (
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        **{coverFile.name}** 파일이 선택되었습니다.
                                    </Typography>
                                )}
                                <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                                    * 최대 크기: {MAX_FILE_SIZE / 1024 / 1024}MB, JPG/PNG 허용.
                                </Typography>
                            </Box>
                            
                            {/* 이미지 미리보기 UI 수정 */}
                            {(coverFile || previewUrl) && (
                                <Box>
                                    <Typography variant="caption" display="block" mb={1}>미리보기</Typography>
                                    <img 
                                        src={previewUrl || NO_IMAGE_URL} 
                                        alt="Album Cover Preview" 
                                        style={{ 
                                            width: '150px', 
                                            height: '150px', 
                                            objectFit: 'cover', 
                                            borderRadius: '8px',
                                            border: '1px solid #ddd'
                                        }} 
                                    />
                                </Box>
                            )}
                        </Stack>
                    </Card>
                    
                    {/* 액션 버튼 */}
                    <Divider sx={{ mt: 4, mb: 4 }}/>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button 
                            variant="text" 
                            color="inherit" 
                            onClick={() => router.push("/album")} 
                            disabled={loading}
                        >
                            목록
                        </Button>
                        <Button 
                            variant="contained" 
                            color="success" // 셋팅 페이지처럼 Save 버튼은 Success 색상 사용
                            size="large"
                            onClick={handleSubmit} 
                            disabled={loading || !title || !date || !coverFile} 
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }} // 셋팅 페이지처럼 크고 둥근 스타일
                        >
                            {loading ? "등록 중..." : "앨범 등록"}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Layout>
    );
}