'use client';

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation"; // 🟢 useParams 추가
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
} from "@mui/material";

// 상수
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const NO_IMAGE_URL = "https://placehold.co/150x150?text=Cover+Image"; 

type AlertSeverity = "success" | "error" | "info"; // info 타입 추가

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
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); 

    const [isSaving, setIsSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // ---------------------------
    // 0. 초기 데이터 로딩
    // ---------------------------
    useEffect(() => {
        // 🟢 수정: id (albumId)가 유효하지 않으면 목록으로 이동
        if (!id) {
            if (!initialLoading) { // 이미 로딩 완료 후 ID가 사라지는 케이스 방지
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
                // 앨범 데이터 로드
                const res = await api.get<{ data: AlbumItem }>(`/api/album/${id}`); // 🟢 id 사용
                const data = res.data.data;
                setAlbumData(data); 

                // 상태 업데이트
                setTitle(data.title || "");
                setDate(data.date || "");
                setDescription(data.description || "");
                setTracks(data.tracks && data.tracks.length > 0 ? data.tracks : [""]);
                setVideoUrl(data.videoUrl || "");
                
                if (data.coverImageUrl) {
                    setCoverImageUrl(data.coverImageUrl);
                }
            } catch (err) {
                const errorMsg = extractErrorMessage(err, "앨범 데이터를 불러오는 데 실패했습니다.");
                setAlertMessage({ message: errorMsg + " 목록으로 돌아갑니다.", severity: "error" });
                // 로딩 실패 시 목록으로 이동
                setTimeout(() => router.push("/album"), 2000);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchAlbumData();
    }, [id, router]); // 🟢 id를 의존성 배열에 추가


    // ---------------------------
    // 1. 파일 미리보기 URL 생성 및 해제
    // ---------------------------
    useEffect(() => {
        if (coverFile) {
            const url = URL.createObjectURL(coverFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        // coverFile이 null이 되면 기존 coverImageUrl로 되돌아감
        setPreviewUrl(coverImageUrl); 
    }, [coverFile, coverImageUrl]);


    // ---------------------------
    // 2. 파일 변경 핸들러 및 유효성 검사
    // ---------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        const file = e.target.files?.[0];
        
        if (!file) {
            setCoverFile(null);
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
        setAlertMessage({ message: `✅ 새 커버 이미지 (${file.name})가 선택되었습니다. 저장 버튼을 눌러 적용하세요.`, severity: "info" });
    };

    // 3. 트랙 관리 핸들러 (생략: 변경 없음)
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
            
            // coverFile이 없고 coverImageUrl이 있으면 기존 이미지 유지 요청 (백엔드 로직에 따라 다름)
            if (!coverFile && coverImageUrl) {
                 formData.append("coverImageUrl", coverImageUrl);
            }
            // 이미지를 제거한 경우 (coverFile=null, coverImageUrl=null)에 대한 처리 로직이 백엔드에 없다면,
            // 이 컴포넌트에서는 이미지를 제거하고 저장하는 기능은 불가능합니다.
            // 현재 코드에서는 이미지가 없으면 유효성 검사에서 걸림.

            tracks.filter(t => t.trim() !== "").forEach((track, idx) => formData.append(`tracks[${idx}]`, track));

            const res = await api.put<{ success: boolean; data?: AlbumItem }>(`/api/album/${id}`, formData, { // 🟢 id 사용
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
    // 5. 앨범 삭제 (DELETE)
    // ---------------------------
    const handleDelete = async () => {
        if (!id) return; // 🟢 id가 없으면 실행 안 함
        
        if (!window.confirm("삭제하시겠습니까?")) return;
        
        setIsSaving(true);
        setAlertMessage({ message: "앨범을 삭제 중...", severity: "error" }); 

        try {
            await api.delete(`/api/album/${id}`); // 🟢 id 사용
            
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
    
    // 🟢 id가 없으면 로딩 없이 즉시 오류 메시지 출력 (갤러리 코드와 유사하게)
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
                            <TextField label="설명 (선택 사항)" multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={isSaving} />
                            <TextField label="유튜브 링크 (선택 사항)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} disabled={isSaving} />
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
                                {/* 이미지 제거 버튼 */}
                                {(coverFile || coverImageUrl) && (
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        onClick={() => { setCoverFile(null); setCoverImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; setAlertMessage({message: "커버 이미지가 제거되었습니다. 저장 시 이미지가 삭제됩니다.", severity: "info"}); }}
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
                                    src={previewUrl || NO_IMAGE_URL} 
                                    alt="Album Cover Preview" 
                                    style={{ 
                                        width: '150px', 
                                        height: '150px', 
                                        objectFit: 'cover', 
                                        borderRadius: '8px',
                                        border: `1px solid ${previewUrl ? '#3f51b5' : '#ddd'}`
                                    }} 
                                />
                            </Box>
                        </Stack>
                    </Card>
                    
                    {/* 액션 버튼 */}
                    <Divider sx={{ mt: 4, mb: 4 }}/>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
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
                        <Button
                            variant="outlined" 
                            color="error" 
                            size="large"
                            onClick={handleDelete} 
                            disabled={isSaving}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isSaving && alertMessage?.message.includes("삭제 중...") ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
                            {isSaving && alertMessage?.message.includes("삭제 중...") ? "삭제 중..." : "삭제"}
                        </Button>
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            onClick={handleUpdate} 
                            disabled={isSaving || !title || !date || (!coverFile && !coverImageUrl)} // 이미지 없으면 저장 비활성화
                            startIcon={isSaving && !alertMessage?.message.includes("삭제 중...") ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }} 
                        >
                            {isSaving && !alertMessage?.message.includes("삭제 중...") ? "수정 중..." : "저장"}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Layout>
    );
}