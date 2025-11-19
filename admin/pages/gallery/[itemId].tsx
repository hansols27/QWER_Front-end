'use client';

import { useEffect, useState, ChangeEvent, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import type { GalleryItem } from "@shared/types/gallery"; 
import { 
    Box, 
    Button, 
    Stack, 
    Typography, 
    Alert, 
    CircularProgress,
    Card, 
    Divider,
    useTheme
} from "@mui/material";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

type AlertSeverity = "success" | "error" | "info";

// 💡 상수 정의
const MAX_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_SIZE_MB * 1024 * 1024; // 10MB
const FALLBACK_IMAGE_URL = 'https://placehold.co/400x267?text=No+Image'; 

export default function GalleryDetail() {
    const params = useParams();
    const id = params?.id as string | undefined;
    const router = useRouter();
    const theme = useTheme(); 

    const [item, setItem] = useState<GalleryItem | null>(null);
    const [loading, setLoading] = useState(true); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [newFile, setNewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ---------------------------
    // 1. 데이터 로드
    // ---------------------------
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const fetchGalleryItem = async () => {
            setLoading(true);
            setAlertMessage(null);
            try {
                const res = await api.get<{ success: boolean; data: GalleryItem }>(`/api/gallery/${id}`);
                if (!res.data?.data) throw new Error("아이템을 불러올 수 없습니다.");
                setItem(res.data.data);
            } catch (err: any) {
                console.error("갤러리 아이템 로드 실패:", err);
                const errorMsg = extractErrorMessage(err, "갤러리 정보를 불러오는 데 실패했습니다.");
                setAlertMessage({ message: errorMsg, severity: "error" });
            } finally {
                setLoading(false);
            }
        };
        fetchGalleryItem();
    }, [id]);

    // ---------------------------
    // 2. 파일 미리보기 URL 생성 및 해제
    // ---------------------------
    useEffect(() => {
        if (newFile) {
            const url = URL.createObjectURL(newFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(item?.url || null); 
    }, [newFile, item]);

    // ---------------------------
    // 3. 파일 변경 핸들러
    // ---------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        const file = e.target.files?.[0];
        
        if (!file) {
            setNewFile(null);
            return; 
        }

        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        
        if (!validTypes.includes(file.type)) {
            setAlertMessage({ message: "jpg, jpeg, png 파일만 업로드 가능합니다.", severity: "error" });
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            setNewFile(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setAlertMessage({ message: `파일 크기는 ${MAX_SIZE_MB}MB를 초과할 수 없습니다.`, severity: "error" });
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            setNewFile(null);
            return;
        }

        setNewFile(file);
        // 💡 버튼 텍스트에 맞게 메시지 수정
        setAlertMessage({ message: `✅ 새 이미지 (${file.name})가 선택되었습니다. '저장' 버튼을 눌러 적용하세요.`, severity: "info" });
    };

    // ---------------------------
    // 4. 저장/수정 (PUT/PATCH) - 💡 함수 이름 변경: handleReplace -> handleSave
    // ---------------------------
    const handleSave = async () => {
        setAlertMessage(null);
        // 현재는 이미지 수정만 구현되어 있어 newFile이 없으면 알림창 띄우고 종료
        if (!item || !newFile) {
            setAlertMessage({ message: "수정할 새 이미지를 먼저 선택해주세요.", severity: "error" });
            return;
        }
        
        // 폼 데이터도 있다면 여기에 추가적인 유효성 검사를 수행해야 합니다.

        // 💡 저장 확인 메시지
        if (!window.confirm(`선택한 파일(${newFile.name})로 이미지를 교체하고 저장하시겠습니까?`)) return;

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append("image", newFile);
            // 💡 다른 필드가 있다면 여기에 추가: formData.append("title", item.title);

            await api.put(`/api/gallery/${id}`, formData, { 
                headers: { "Content-Type": "multipart/form-data" }
            });

            // 💡 저장 성공 메시지
            setAlertMessage({ message: "이미지가 성공적으로 저장되었습니다! 목록으로 이동합니다.", severity: "success" });
            
            if (fileInputRef.current) fileInputRef.current.value = ""; 

            // 💡 저장 성공 시 목록으로 이동
            setTimeout(() => router.push("/gallery"), 1000);

        } catch (err: any) {
            console.error("이미지 저장 요청 실패:", err);
            const errorMsg = extractErrorMessage(err, "이미지 저장에 실패했습니다. 서버 연결을 확인하세요.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false);
        }
    };

    // ---------------------------
    // 5. 삭제 (DELETE)
    // ---------------------------
    const handleDelete = async () => {
        setAlertMessage(null);
        if (!id) return;
        
        // 💡 사용자 요청에 맞게 알럿 메시지 수정
        if (!window.confirm("삭제하시겠습니까?")) return;

        setIsProcessing(true);

        try {
            await api.delete(`/api/gallery/${id}`); 
            setAlertMessage({ message: "이미지가 성공적으로 삭제되었습니다! 목록으로 이동합니다.", severity: "success" });
            
            // 💡 삭제 성공 시 목록으로 이동
            setTimeout(() => router.push("/gallery"), 1000);

        } catch (err: any) {
            console.error("갤러리 삭제 요청 실패:", err);
            const errorMsg = extractErrorMessage(err, "이미지 삭제에 실패했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false);
        }
    };

    // ---------------------------
    // 6. 렌더링
    // ---------------------------
    if (!id)
        return (
            <Layout>
                <Box p={4}>
                    <Typography color="error">잘못된 접근입니다. 이미지 ID가 필요합니다.</Typography>
                </Box>
            </Layout>
        );

    if (loading)
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                    <CircularProgress />
                    <Typography ml={2} mt={2}>로딩 중...</Typography>
                </Box>
            </Layout>
        );

    if (!item)
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="warning">갤러리 이미지를 찾을 수 없습니다.</Alert>
                    <Button onClick={() => router.push("/gallery")} sx={{ mt: 2}}>목록</Button>
                </Box>
            </Layout>
        );


    const currentPreviewUrl = previewUrl || item.url || FALLBACK_IMAGE_URL; 

    return (
        <Layout>
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
                <Typography variant="h4" mb={4} fontWeight="bold" textAlign="center" color={theme.palette.primary.main}>
                    갤러리 상세 
                </Typography>
                
                <Divider sx={{ mb: 4 }}/>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 3 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Stack spacing={4}>
                    {/* 이미지 Card: 기존 이미지와 새 이미지 미리보기를 통합하여 보여줌 */}
                    <Card sx={{ p: 4, borderRadius: 3, boxShadow: 6 }}>
                        <Typography variant="h5" gutterBottom fontWeight="bold" borderBottom={`2px solid ${theme.palette.divider}`} pb={1}>
                            {/* 💡 텍스트 변경: "현재 저장된 이미지" */}
                            {newFile ? "새 이미지 미리보기" : "현재 저장된 이미지"} 
                        </Typography>
                        
                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box 
                                sx={{ 
                                    position: 'relative', 
                                    width: '100%', 
                                    maxWidth: 600,
                                    paddingTop: '66.66%',
                                    borderRadius: 1, 
                                    overflow: 'hidden', 
                                    border: `3px solid ${newFile ? theme.palette.success.main : theme.palette.divider}`,
                                }}
                            >
                                <Image
                                    src={currentPreviewUrl}
                                    alt={`Gallery image ${item.id}`}
                                    fill
                                    sizes="(max-width: 600px) 100vw, 600px"
                                    style={{ objectFit: 'cover' }} 
                                    unoptimized={currentPreviewUrl.includes('placehold.co')}
                                />
                            </Box>
                        
                            <Typography variant="body2" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                                {newFile 
                                    ? <span style={{ fontWeight: 'bold', color: theme.palette.success.dark }}>
                                        새 파일 준비 완료: {newFile.name} ({(newFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </span> 
                                    : `원본 파일 (업로드 시각: ${new Date(item.createdAt).toLocaleString()})`}
                            </Typography>
                        </Box>
                    </Card>

                    {/* 이미지 교체/저장 Card */}
                    <Card sx={{ p: 4, borderRadius: 3, boxShadow: 6 }}>
                        <Typography variant="h5" gutterBottom fontWeight="bold" borderBottom={`2px solid ${theme.palette.divider}`} pb={1}>
                            이미지 변경 및 저장
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 3 }}>
                            
                            <Stack direction="row" spacing={2} alignItems="center">
                                {/* 파일 선택 버튼 */}
                                <Button 
                                    variant="outlined" 
                                    component="label" 
                                    color="secondary" 
                                    disabled={isProcessing}
                                    sx={{ py: 1, px: 3 }}
                                >
                                    이미지 선택
                                    <input 
                                        type="file" 
                                        hidden
                                        ref={fileInputRef}
                                        accept="image/jpeg,image/jpg,image/png" 
                                        onChange={handleFileChange} 
                                        disabled={isProcessing} 
                                    />
                                </Button>
                                {/* 새 파일 제거 버튼 (선택 사항) */}
                                {newFile && (
                                    <Button
                                        variant="text"
                                        color="error"
                                        onClick={() => {
                                            setNewFile(null);
                                            setAlertMessage(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        disabled={isProcessing}
                                    >
                                        선택 취소
                                    </Button>
                                )}
                            </Stack>
                            
                            <Typography variant="caption" color="text.secondary">
                                * 허용 파일: **JPG, PNG** | 최대 크기: **{MAX_SIZE_MB}MB**
                            </Typography>

                            {/* 💡 저장 버튼 (함수: handleSave) */}
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleSave} // 💡 handleSave로 변경
                                // newFile이 없어도 저장 버튼은 활성화될 수 있지만, 현재는 이미지 수정만 있으므로 newFile 유무에 따라 disabled 처리
                                disabled={isProcessing || !newFile}
                                sx={{ mt: 3, py: 1.5, px: 4, alignSelf: 'flex-start', borderRadius: 2 }}
                                startIcon={isProcessing && newFile ? <CircularProgress size={20} color="inherit" /> : undefined}
                            >
                                {/* 💡 버튼 텍스트 변경: "저장" */}
                                {isProcessing && newFile ? "저장 중..." : "저장"}
                            </Button>
                            
                            {!newFile && (
                                <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                                    새 이미지를 선택해야 저장 버튼이 활성화됩니다.
                                </Typography>
                            )}

                        </Stack>
                    </Card>

                    {/* 액션 버튼 그룹 */}
                    <Divider sx={{ mt: 5, mb: 3 }}/>
                    <Stack 
                        direction="row" 
                        spacing={2} 
                        justifyContent="space-between" 
                        sx={{ p: 1 }}
                    >
                        {/* 목록 버튼 (좌측) */}
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            onClick={() => router.push("/gallery")} 
                            disabled={isProcessing}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            목록
                        </Button>

                        {/* 💡 삭제 버튼 (우측) */}
                        <Button 
                            variant="contained" 
                            color="error" 
                            size="large" 
                            onClick={handleDelete} // 💡 handleDelete 함수 유지
                            disabled={isProcessing}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
                        >
                            {isProcessing ? "삭제 중..." : "삭제"}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Layout>
    );
}