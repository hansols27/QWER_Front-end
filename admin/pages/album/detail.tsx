'use client';

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // useSearchParams 추가
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

// 상수 (등록 페이지와 동일)
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const NO_IMAGE_URL = "https://via.placeholder.com/150x150?text=Cover+Image";

type AlertSeverity = "success" | "error";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// ----------------------------------------------------
// 앨범 수정 컴포넌트: AlbumEdit
// ----------------------------------------------------
export default function AlbumEdit() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const albumId = searchParams.get('id'); // URL에서 앨범 ID를 가져옵니다.

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // 💡 초기 데이터 로딩 상태
    const [initialLoading, setInitialLoading] = useState(true); 
    const [albumData, setAlbumData] = useState<AlbumItem | null>(null);

    // 앨범 필드 상태
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [tracks, setTracks] = useState<string[]>([""]);
    const [videoUrl, setVideoUrl] = useState("");
    
    // 💡 이미지 상태: coverFile (새 파일) 또는 coverImageUrl (기존 S3 URL)
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null); // 기존 S3 URL
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 현재 미리보기 URL (로컬 또는 S3)

    const [isSaving, setIsSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // ---------------------------
    // 0. 초기 데이터 로딩
    // ---------------------------
    useEffect(() => {
        if (!albumId) {
            setAlertMessage({ message: "앨범 ID가 없습니다. 목록으로 돌아갑니다.", severity: "error" });
            setInitialLoading(false);
            setTimeout(() => router.push("/album"), 1500);
            return;
        }

        const fetchAlbumData = async () => {
            try {
                const res = await api.get<{ data: AlbumItem }>(`/api/album/${albumId}`);
                const data = res.data.data;
                setAlbumData(data); // 원본 데이터 저장

                // 💡 초기 상태 설정
                setTitle(data.title || "");
                setDate(data.date || "");
                setDescription(data.description || "");
                setTracks(data.tracks && data.tracks.length > 0 ? data.tracks : [""]);
                setVideoUrl(data.videoUrl || "");
                
                // 💡 기존 이미지 URL 설정
                if (data.coverImageUrl) {
                    setCoverImageUrl(data.coverImageUrl);
                }
            } catch (err) {
                setAlertMessage({ message: extractErrorMessage(err, "앨범 데이터를 불러오는 데 실패했습니다."), severity: "error" });
            } finally {
                setInitialLoading(false);
            }
        };

        fetchAlbumData();
    }, [albumId, router]);


    // ---------------------------
    // 1. 파일 미리보기 URL 생성 및 해제
    // ---------------------------
    useEffect(() => {
        // 1. 새 파일이 있으면 로컬 URL 사용
        if (coverFile) {
            const url = URL.createObjectURL(coverFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        
        // 2. 새 파일이 없으면 기존 S3 URL 사용
        setPreviewUrl(coverImageUrl); 
    }, [coverFile, coverImageUrl]);


    // ---------------------------
    // 2. 파일 변경 핸들러 및 유효성 검사 (로직 변경 없음)
    // ---------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        const file = e.target.files?.[0];
        
        if (!file) {
            setCoverFile(null);
            // 파일 선택 취소 시 기존 S3 URL로 복원
            setPreviewUrl(coverImageUrl); 
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

    // ---------------------------
    // 4. 앨범 수정 (PUT)
    // ---------------------------
    const handleUpdate = async () => {
        setAlertMessage(null);
        
        // 커버 파일이 없으면서, 기존 S3 URL도 없다면 필수 검사 실패
        if (!coverFile && !coverImageUrl) { 
            setAlertMessage({ message: "필수 항목: 커버 이미지를 선택해주세요.", severity: "error" });
            return;
        }
        if (!title || !date) {
            setAlertMessage({ message: "필수 항목: 타이틀과 발매일을 입력해주세요.", severity: "error" });
            return;
        }

        setIsSaving(true);

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("date", date);
            formData.append("description", description);
            formData.append("videoUrl", videoUrl);
            
            // 💡 coverFile이 변경된 경우에만 FormData에 추가
            if (coverFile) {
                formData.append("coverFile", coverFile);
            }
            
            // 기존 이미지를 유지할 경우 서버에서 coverFile이 없음을 인식해야 합니다.
            // 필요에 따라 'coverImageUrl'을 FormData에 함께 보내서 서버에 힌트를 줄 수 있습니다.
            if (!coverFile && coverImageUrl) {
                 formData.append("coverImageUrl", coverImageUrl);
            }

            tracks.filter(t => t.trim() !== "").forEach((track, idx) => formData.append(`tracks[${idx}]`, track));

            // 🚨 PUT 메소드와 앨범 ID가 포함된 엔드포인트 사용
            const res = await api.put<{ success: boolean; data?: AlbumItem }>(`/api/album/${albumId}`, formData, { 
                headers: { "Content-Type": "multipart/form-data" } 
            });

            if (res.data.success) {
                setAlertMessage({ message: "앨범이 성공적으로 수정되었습니다!", severity: "success" });
                // 수정 완료 후, 최신 데이터로 다시 로딩할 필요 없이 상태를 업데이트하거나 목록으로 이동
            } else {
                setAlertMessage({ message: "수정 실패: 서버에서 오류가 발생했습니다.", severity: "error" });
            }
        } catch (err: any) {
            console.error("앨범 수정 요청 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "앨범 수정 요청에 실패했습니다. 서버 연결을 확인하세요."), severity: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    // ---------------------------
    // 5. 앨범 삭제 (DELETE)
    // ---------------------------
    const handleDelete = async () => {
        if (!confirm("정말로 이 앨범을 삭제하시겠습니까?")) return;
        
        setIsSaving(true);
        setAlertMessage(null);

        try {
            // 🚨 DELETE 메소드와 앨범 ID가 포함된 엔드포인트 사용
            await api.delete(`/api/album/${albumId}`);
            
            setAlertMessage({ message: "앨범이 성공적으로 삭제되었습니다! 목록으로 이동합니다.", severity: "success" });
            setTimeout(() => router.push("/album"), 1500); 
        } catch (err: any) {
            console.error("앨범 삭제 요청 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "앨범 삭제 요청에 실패했습니다."), severity: "error" });
        } finally {
            setIsSaving(false);
        }
    };
    
    // ---------------------------
    // 6. 렌더링
    // ---------------------------
    if (initialLoading) {
        return (
            <Layout>
                <Box p={4} display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress />
                    <Typography ml={2}>데이터 로딩 중...</Typography>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">앨범 수정/상세</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Stack spacing={3}>
                    {/* 기본 정보 Card (등록 페이지 UI 유지) */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>기본 정보</Typography>
                        <Stack spacing={3}>
                            <TextField label="타이틀" value={title} onChange={e => setTitle(e.target.value)} required disabled={isSaving} />
                            <TextField label="발매일" type="date" value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} required disabled={isSaving} />
                            <TextField label="설명 (선택 사항)" multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={isSaving} />
                            <TextField label="유튜브 링크 (선택 사항)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} disabled={isSaving} />
                        </Stack>
                    </Card>

                    {/* 트랙 목록 Card (등록 페이지 UI 유지) */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>트랙 목록</Typography>
                        <Stack spacing={2}>
                            {tracks.map((track, idx) => (
                                <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                                    <TextField label={`트랙 ${idx + 1}`} value={track} onChange={e => handleTrackChange(idx, e.target.value)} fullWidth disabled={isSaving} size="small" />
                                    {tracks.length > 1 && <Button onClick={() => removeTrack(idx)} color="error" size="small" disabled={isSaving}>삭제</Button>}
                                </Stack>
                            ))}
                            <Button onClick={addTrack} variant="outlined" disabled={isSaving} sx={{ mt: 1, alignSelf: 'flex-start' }}>트랙 추가</Button>
                        </Stack>
                    </Card>

                    {/* 커버 이미지 Card (등록 페이지 UI 유지) */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>커버 이미지</Typography>
                        
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
                            <Box>
                                <Button variant="contained" component="label" color="primary" disabled={isSaving}>
                                    새 이미지 선택
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="image/jpeg,image/jpg,image/png" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        disabled={isSaving}
                                    />
                                </Button>
                                {(coverFile || coverImageUrl) && (
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        onClick={() => { setCoverFile(null); setCoverImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                        disabled={isSaving}
                                        sx={{ ml: 2 }}
                                    >
                                        이미지 제거
                                    </Button>
                                )}
                                
                                {coverFile ? (
                                    <Typography variant="body2" color="primary" mt={1}>
                                        **새 파일:** {coverFile.name} (업데이트 예정)
                                    </Typography>
                                ) : (coverImageUrl && 
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        **현재 파일:** 기존 이미지가 사용됩니다.
                                    </Typography>
                                )}
                                <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                                    * 최대 크기: {MAX_FILE_SIZE / 1024 / 1024}MB, JPG/PNG 허용.
                                </Typography>
                            </Box>
                            
                            {/* 이미지 미리보기 UI (S3 URL 또는 로컬 파일) */}
                            {(previewUrl) && (
                                <Box>
                                    <Typography variant="caption" display="block" mb={1}>미리보기</Typography>
                                    <img 
                                        src={previewUrl} 
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
                            {(!previewUrl) && (
                                <Box>
                                     <Typography variant="caption" display="block" mb={1}>미리보기</Typography>
                                     <img 
                                        src={NO_IMAGE_URL} 
                                        alt="No Image Placeholder" 
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
                    
                    {/* 액션 버튼 (수정 페이지용) */}
                    <Divider sx={{ mt: 4, mb: 4 }}/>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button 
                            variant="text" 
                            color="primary" 
                            size="large"
                            onClick={() => router.push("/album")} 
                            disabled={isSaving}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            목록
                        </Button>
                        <Button
                            variant="outlined" 
                            color="error" 
                            size="large"
                            onClick={handleDelete}
                            disabled={isSaving}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isSaving ? "삭제 중..." : "삭제"}
                        </Button>
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            onClick={handleUpdate} 
                            disabled={isSaving || !title || !date || (!coverFile && !coverImageUrl)} 
                            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }} 
                        >
                            {isSaving ? "수정 중..." : "저장"}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Layout>
    );
}