'use client';

import { useEffect, useState, ChangeEvent, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image"; 
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import {
    Box,
    Button,
    TextField,
    Stack,
    Typography,
    Alert,
    CircularProgress,
} from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

// 상수
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const NO_IMAGE_URL = "https://via.placeholder.com/150x150?text=No+Image";

type AlertSeverity = "success" | "error";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function AlbumDetail() {
    const params = useParams();
    // id를 항상 string으로 가져오도록 처리
    const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string | undefined;
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [album, setAlbum] = useState<AlbumItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // ---------------------------
    // 1. 데이터 로드
    // ---------------------------
    const fetchAlbum = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.get<{ success: boolean; data: AlbumItem }>(`/api/album/${id}`);
            const fetched = res.data.data;
            // 트랙이 없으면 빈 문자열 하나를 넣어 사용자에게 입력 필드를 제공
            setAlbum({ ...fetched, tracks: fetched.tracks?.length ? fetched.tracks : [""] });
        } catch (err) {
            console.error("앨범 로드 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "앨범 정보를 불러오는 데 실패했습니다."), severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchAlbum();
    }, [id, fetchAlbum]);

    // ---------------------------
    // 2. 파일 미리보기 URL 생성 및 해제
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
    // 3. 파일 변경 핸들러 및 유효성 검사
    // ---------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        if (!e.target.files?.[0]) {
            setCoverFile(null);
            return;
        }
        const file = e.target.files[0];

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
        setAlertMessage({ message: "새 이미지가 선택되었습니다. 저장 시 기존 이미지가 대체됩니다.", severity: "success" });
    };

    // ---------------------------
    // 4. 앨범 정보 수정 (PUT)
    // ---------------------------
    const handleUpdate = async () => {
        if (!album || !id) return;
        setIsSaving(true);
        setAlertMessage(null);

        try {
            const formData = new FormData();
            formData.append("title", album.title);
            formData.append("date", album.date);
            formData.append("description", album.description ?? "");
            formData.append("videoUrl", album.videoUrl ?? "");
            // 기존 이미지 URL을 보내어, 서버에서 커버 파일이 없으면 기존 것을 유지하도록 지시
            formData.append("existingImage", album.image ?? ""); 
            if (coverFile) formData.append("coverFile", coverFile);

            // 비어있지 않은 트랙만 전송
            (album.tracks ?? [])
                .filter((t) => t?.trim() !== "")
                .forEach((track, i) => formData.append(`tracks[${i}]`, track));

            // 라우트 이름이 "/api/album/:id"라고 가정하고 수정
            const res = await api.put<{ success: boolean; data?: AlbumItem }>(`/api/album/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setAlertMessage({ message: "앨범 정보가 성공적으로 수정되었습니다!", severity: "success" });
            
            // 성공 시 파일 상태 및 인풋 초기화
            setCoverFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            
            if (res.data.data) {
                // 수정된 데이터로 폼 상태 업데이트 및 트랙 정리
                const updatedAlbum = res.data.data;
                setAlbum({ ...updatedAlbum, tracks: updatedAlbum.tracks?.length ? updatedAlbum.tracks : [""] });
            } else {
                // 데이터가 반환되지 않으면 다시 불러옴
                fetchAlbum(); 
            }
        } catch (err) {
            console.error("앨범 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "앨범 수정 요청에 실패했습니다."), severity: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    // ---------------------------
    // 5. 앨범 삭제 (DELETE)
    // ---------------------------
    const handleDelete = async () => {
        if (!id) return;
        if (!window.confirm("정말로 이 앨범을 삭제하시겠습니까? (커버 이미지와 함께 영구 삭제됩니다)")) return;

        setIsSaving(true);
        setAlertMessage(null);

        try {
            await api.delete(`/api/album/${id}`);
            setAlertMessage({ message: "앨범이 성공적으로 삭제되었습니다!", severity: "success" });
            setTimeout(() => router.push("/album"), 1000);
        } catch (err) {
            console.error("앨범 삭제 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "앨범 삭제 요청에 실패했습니다."), severity: "error" });
            setIsSaving(false);
        }
    };

    // ---------------------------
    // 6. 트랙 관리 핸들러
    // ---------------------------
    const handleTrackChange = (index: number, value: string) => {
        if (!album) return;
        const newTracks = [...(album.tracks ?? [])];
        newTracks[index] = value;
        setAlbum({ ...album, tracks: newTracks });
    };

    const addTrack = () => album && setAlbum({ ...album, tracks: [...(album.tracks ?? []), ""] });
    
    const removeTrack = (index: number) => {
        if (!album) return;
        const newTracks = (album.tracks ?? []).filter((_, i) => i !== index);
        // 트랙이 모두 삭제되면 빈 필드 하나 유지 (UX)
        setAlbum({ ...album, tracks: newTracks.length > 0 ? newTracks : [""] }); 
    };

    // ---------------------------
    // 7. 렌더링
    // ---------------------------
    if (!id)
        return (
            <Layout>
                <Box p={4}>
                    <Typography color="error">잘못된 접근입니다. 앨범 ID가 필요합니다.</Typography>
                </Box>
            </Layout>
        );

    if (loading || !album)
        return (
            <Layout>
                <Box display="flex" justifyContent="center" py={8} flexDirection="column" alignItems="center">
                    <CircularProgress />
                    <Typography ml={2} mt={2}>로딩 중...</Typography>
                </Box>
            </Layout>
        );

    // 현재 표시할 이미지 URL 결정 (새 파일 > 기존 파일 > No Image)
    const displayImageUrl = previewUrl || album.image || NO_IMAGE_URL;

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">앨범 "{album.title}" 수정</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Stack spacing={3}>
                    {/* 기본 정보 */}
                    <TextField label="타이틀" value={album.title} onChange={(e) => setAlbum({ ...album, title: e.target.value })} disabled={isSaving} required />
                    <TextField label="발매일" type="date" value={album.date} onChange={(e) => setAlbum({ ...album, date: e.target.value })} InputLabelProps={{ shrink: true }} disabled={isSaving} required />
                    <TextField label="설명" multiline minRows={3} value={album.description ?? ""} onChange={(e) => setAlbum({ ...album, description: e.target.value })} disabled={isSaving} />
                    <TextField label="유튜브 링크" value={album.videoUrl ?? ""} onChange={(e) => setAlbum({ ...album, videoUrl: e.target.value })} disabled={isSaving} />

                    {/* 커버 이미지 */}
                    <Typography variant="h6" mt={2} fontWeight="bold">커버 이미지</Typography>
                    
                    <Box mb={2} sx={{ width: 150, height: 150, position: 'relative', border: '1px solid #eee', borderRadius: 1, overflow: 'hidden' }}>
                        <Image
                            src={displayImageUrl}
                            alt={`${album.title} Cover`}
                            fill
                            sizes="150px"
                            style={{ objectFit: "cover" }}
                            unoptimized={displayImageUrl === NO_IMAGE_URL || displayImageUrl === previewUrl}
                        />
                    </Box>

                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/jpg,image/png" onChange={handleFileChange} disabled={isSaving} />
                    <Typography variant="caption" color="textSecondary">
                        * 최대 10MB, JPG/PNG 허용. 새 이미지를 선택하고 '저장' 버튼을 누르면 기존 이미지를 대체합니다.
                    </Typography>

                    {/* 트랙 목록 */}
                    <Typography variant="h6" mt={2} fontWeight="bold">트랙 목록</Typography>
                    {(album.tracks ?? []).map((track, idx) => (
                        <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                            <TextField label={`트랙 ${idx + 1}`} value={track ?? ""} onChange={(e) => handleTrackChange(idx, e.target.value)} fullWidth disabled={isSaving} />
                            {(album.tracks?.length ?? 0) > 0 && 
                                <Button onClick={() => removeTrack(idx)} color="error" disabled={isSaving}>삭제</Button>
                            }
                        </Stack>
                    ))}
                    <Button onClick={addTrack} variant="outlined" disabled={isSaving}>트랙 추가</Button>

                    {/* 액션 버튼 */}
                    <Box display="flex" justifyContent="space-between" mt={4}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleUpdate} 
                            disabled={isSaving || !album.title || !album.date} 
                            startIcon={isSaving && <CircularProgress size={20} color="inherit" />}
                        >
                            {isSaving ? "저장 중..." : "저장"}
                        </Button>
                        <Button variant="contained" color="error" onClick={handleDelete} disabled={isSaving}>
                            삭제
                        </Button>
                    </Box>

                    <Button variant="text" onClick={() => router.push("/album")}>목록으로 돌아가기</Button>
                </Stack>
            </Box>
        </Layout>
    );
}