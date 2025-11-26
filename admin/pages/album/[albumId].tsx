'use client';

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation"; 
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import type { AlbumItem } from "@shared/types/album";
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
    Dialog, // ⭐️ Dialog 추가
    DialogTitle, // ⭐️ DialogTitle 추가
    DialogContent, // ⭐️ DialogContent 추가
    DialogActions, // ⭐️ DialogActions 추가
} from "@mui/material";

// 상수
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const NO_IMAGE_URL = "https://placehold.co/150x150?text=Cover+Image"; 

type AlertSeverity = "success" | "error" | "info" | "warning"; // warning 추가

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// ----------------------------------------------------
// 앨범 수정 컴포넌트: AlbumEdit
// ----------------------------------------------------

export default function AlbumEdit() {
    const params = useParams();
    const router = useRouter();

    const id = params?.albumId as string | undefined;
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [initialLoading, setInitialLoading] = useState(true); 
    const [albumData, setAlbumData] = useState<AlbumItem | null>(null);

    // 앨범 필드 상태
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [tracks, setTracks] = useState<string[]>([""]);
    const [videoUrl, setVideoUrl] = useState("");
    
    // 이미지 상태
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null); 
    const [previewUrl, setPreviewUrl] = useState<string>(NO_IMAGE_URL); 

    const [isSaving, setIsSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);
    
    // ⭐️ 삭제 확인 모달 상태 추가
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 

    // ---------------------------
    // 0. 초기 데이터 로딩
    // ---------------------------
    useEffect(() => {
        if (!id) {
            if (!initialLoading) {
                 setAlertMessage({ message: "유효하지 않은 앨범 ID입니다.", severity: "error" });
                 setTimeout(() => router.push("/album"), 1000); 
            }
            setInitialLoading(false);
            return;
        }
        
        const fetchAlbumData = async () => {
            setInitialLoading(true);
            setAlertMessage(null);
            try {
                const res = await api.get<{ data: AlbumItem }>(`/api/album/${id}`);
                const data = res.data.data;
                setAlbumData(data); 

                // 상태 업데이트
                setTitle(data.title || "");
                setDate(data.date || "");
                setDescription(data.description || "");
                setTracks(data.tracks && data.tracks.length > 0 ? data.tracks : [""]);
                setVideoUrl(data.videoUrl || "");
                
                const existingImageUrl = data.image || null; 

                if (existingImageUrl) {
                    setCoverImageUrl(existingImageUrl);
                    setPreviewUrl(existingImageUrl);
                } else {
                    setCoverImageUrl(null);
                    setPreviewUrl(NO_IMAGE_URL);
                }
                
            } catch (err) {
                const errorMsg = extractErrorMessage(err, "앨범 데이터를 불러오는 데 실패했습니다.");
                setAlertMessage({ message: errorMsg + " 목록으로 돌아갑니다.", severity: "error" });
                setTimeout(() => router.push("/album"), 2000);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchAlbumData();
    }, [id, router]);

    // ---------------------------
    // 1. 파일 미리보기 URL 생성 및 해제
    // ---------------------------
    useEffect(() => {
        // 1. 새 파일이 있으면 -> 로컬 URL 사용
        if (coverFile) {
            const url = URL.createObjectURL(coverFile);
            setPreviewUrl(url);
            // 클린업 함수: 컴포넌트 언마운트 또는 coverFile이 변경/제거될 때 로컬 URL 해제
            return () => URL.revokeObjectURL(url);
        }
        
        // 2. 새 파일이 없고, 기존 URL이 있으면 -> 기존 URL 사용
        if (coverImageUrl) {
            setPreviewUrl(coverImageUrl);
        } else {
        // 3. 둘 다 없으면 -> 대체 이미지 사용
            setPreviewUrl(NO_IMAGE_URL);
        }
        
    }, [coverFile, coverImageUrl]);


    // ---------------------------
    // 2. 파일 변경 핸들러 및 유효성 검사
    // ---------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        const file = e.target.files?.[0];
        
        if (!file) {
            setCoverFile(null);
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
        setAlertMessage({ message: `✅ 새 커버 이미지 (${file.name})가 선택되었습니다. 저장 버튼을 눌러 적용하세요.`, severity: "info" });
    };

    // 3. 트랙 관리 핸들러
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
        
        if (!id) {
             setAlertMessage({ message: "유효하지 않은 앨범 ID입니다. 페이지를 새로고침해주세요.", severity: "error" });
             return;
        }
        
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
            
            if (coverFile) {
                formData.append("coverFile", coverFile);
            }
            
            // 이미지 제거를 요청하는 경우, 백엔드 로직에 따라 별도 필드를 추가할 수도 있지만, 
            // 여기서는 coverFile이 없고 기존 coverImageUrl도 없을 때 별도 처리 없이 진행합니다.
            // (백엔드가 이 경우 이미지 삭제를 유추한다고 가정)

            tracks.filter(t => t.trim() !== "").forEach((track, idx) => formData.append(`tracks[${idx}]`, track));

            const res = await api.put<{ success: boolean; data?: AlbumItem }>(`/api/album/${id}`, formData, { 
                headers: { "Content-Type": "multipart/form-data" } 
            });

            if (res.data.success) {
                setAlertMessage({ message: "앨범이 성공적으로 수정되었습니다! 목록으로 이동합니다.", severity: "success" });
                setTimeout(() => router.push("/album"), 1500);
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
    // 5. 앨범 삭제 (DELETE) 로직 분리
    // ---------------------------

    // ⭐️ 삭제 버튼 클릭 시: 모달 표시
    const handleDelete = () => {
        if (isSaving) return;
        setShowDeleteConfirm(true); 
    };
    
    // ⭐️ 모달에서 '삭제 확인' 클릭 시: 실제 삭제 실행
    const executeDelete = async () => {
        setShowDeleteConfirm(false); // 모달 닫기
        if (!id) return;
        
        setIsSaving(true);
        setAlertMessage({ message: "앨범을 삭제 중...", severity: "info" }); 

        try {
            await api.delete(`/api/album/${id}`);
            
            setAlertMessage({ message: "앨범이 성공적으로 삭제되었습니다! 목록으로 이동합니다.", severity: "success" });
            
            setTimeout(() => router.push("/album"), 1500); 
        } catch (err: any) {
            console.error("앨범 삭제 요청 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "앨범 삭제 요청에 실패했습니다."), severity: "error" });
            setIsSaving(false);
        }
    };
    
    // ---------------------------
    // 6. 렌더링
    // ---------------------------
    
    if (!id && !initialLoading)
        return (
            <Layout>
                <Box p={4}>
                    <Typography color="error">잘못된 접근입니다. 앨범 ID가 필요합니다.</Typography>
                </Box>
            </Layout>
        );

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
    
    if (!albumData) {
        return (
             <Layout>
                <Box p={4} display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="50vh">
                    <Alert severity="warning">앨범 데이터를 찾을 수 없습니다.</Alert>
                    <Button onClick={() => router.push("/album")} sx={{ mt: 2 }}>목록으로 돌아가기</Button>
                </Box>
             </Layout>
        )
    }

    // 최종 렌더링
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">앨범 상세</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Stack spacing={3}>
                    {/* 기본 정보 Card */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>기본 정보</Typography>
                        <Stack spacing={3}>
                            <TextField label="타이틀" value={title} onChange={e => setTitle(e.target.value)} required disabled={isSaving} />
                            <TextField label="발매일" type="date" value={date.split('T')[0]} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} required disabled={isSaving} />
                            <TextField label="설명" multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={isSaving} />
                            <TextField label="유튜브 링크" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} disabled={isSaving} />
                        </Stack>
                    </Card>

                    {/* 트랙 목록 Card */}
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

                    {/* 커버 이미지 Card */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>커버 이미지</Typography>
                        
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
                            <Box>
                                <Button variant="contained" component="label" color="primary" disabled={isSaving}>
                                    이미지 선택
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="image/jpeg,image/jpg,image/png" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        disabled={isSaving}
                                    />
                                </Button>
                                {/* 이미지 제거 버튼 */}
                                {(coverFile || coverImageUrl) && (
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        onClick={() => { 
                                            setCoverFile(null); 
                                            setCoverImageUrl(null); 
                                            setPreviewUrl(NO_IMAGE_URL); 
                                            if (fileInputRef.current) fileInputRef.current.value = ""; 
                                            setAlertMessage({message: "커버 이미지가 제거되었습니다. 저장 시 이미지가 삭제됩니다.", severity: "info"}); 
                                        }}
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
                                ) : (coverImageUrl ? 
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        **현재 파일:** 기존 이미지가 사용됩니다.
                                    </Typography>
                                    :
                                    <Typography variant="body2" color="error" mt={1}>
                                        **필수:** 커버 이미지를 선택해주세요.
                                    </Typography>
                                )}
                                <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                                    * 최대 크기: {MAX_FILE_SIZE / 1024 / 1024}MB, JPG/PNG 허용.
                                </Typography>
                            </Box>
                            
                            {/* 이미지 미리보기 UI (S3 URL 또는 로컬 파일) */}
                            <Box>
                                <Typography variant="caption" display="block" mb={1}>미리보기</Typography>
                                <img 
                                    src={previewUrl} // ⭐️ previewUrl 상태 사용
                                    alt="Album Cover Preview" 
                                    style={{ 
                                        width: '150px', 
                                        height: '150px', 
                                        objectFit: 'cover', 
                                        borderRadius: '8px',
                                        border: `1px solid ${previewUrl && previewUrl !== NO_IMAGE_URL ? '#3f51b5' : '#ddd'}`
                                    }} 
                                />
                            </Box>
                        </Stack>
                    </Card>
                    
                    {/* 액션 버튼 */}
                    <Divider sx={{ mt: 4, mb: 4 }}/>
                    <Box>
                        <Stack direction="row" spacing={2} justifyContent="flex-end">

                            {/* 삭제 버튼 */}
                            <Button 
                            variant="outlined" 
                            color="error" 
                            size="large"
                            onClick={handleDelete} // ⭐️ 모달을 여는 핸들러 호출
                            disabled={isSaving}
                            sx={{ py: 1.5, px: 4, borderRadius: 2, marginRight: 'auto' }} 
                            >
                                삭제
                            </Button>

                            {/* 목록 버튼 */}
                            <Button 
                                variant="contained" 
                                color="primary" 
                                size="large"
                                onClick={() => router.push("/album")} 
                                disabled={isSaving}
                                sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                            >
                                목록
                            </Button>

                            {/* 저장 (수정) 버튼 */}    
                            <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            onClick={handleUpdate} 
                            disabled={isSaving || !title || !date || (!coverFile && !coverImageUrl)} 
                            startIcon={isSaving && alertMessage?.severity !== "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                            >
                                {isSaving && alertMessage?.severity !== "info" ? "저장 중..." : "저장"}
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
                
                {/* ⭐️⭐️ 삭제 확인 커스텀 모달 (Dialog) 추가 ⭐️⭐️ */}
                <Dialog
                    open={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    aria-labelledby="album-delete-dialog-title"
                    aria-describedby="album-delete-dialog-description"
                >
                    <DialogTitle id="album-delete-dialog-title">{"삭제 확인"}</DialogTitle>
                    <DialogContent>
                        <Typography>
                            삭제하시겠습니까?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowDeleteConfirm(false)} color="primary" disabled={isSaving}>
                            취소
                        </Button>
                        <Button 
                            onClick={executeDelete} 
                            color="error" 
                            variant="contained" 
                            autoFocus
                            disabled={isSaving}
                            startIcon={isSaving && alertMessage?.message.includes("삭제 중") ? <CircularProgress size={20} color="inherit" /> : undefined}
                        >
                            확인
                        </Button>
                    </DialogActions>
                </Dialog>
                {/* ⭐️⭐️ 모달 끝 ⭐️⭐️ */}
            </Box>                 
        </Layout>
    );
}