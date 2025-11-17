'use client';

import { useEffect, useState, ChangeEvent, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import { 
    Box, 
    Button, 
    Stack, 
    Typography, 
    Alert, 
    CircularProgress,
} from "@mui/material";
import type { GalleryItem } from "@shared/types/gallery"; 

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

type AlertSeverity = "success" | "error" | "info";

export default function GalleryDetail() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

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
        if (!newFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(newFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [newFile]);

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
        const maxSize = 30 * 1024 * 1024; // 30MB
        
        if (!validTypes.includes(file.type)) {
            setAlertMessage({ message: "jpg, jpeg, png 파일만 업로드 가능합니다.", severity: "error" });
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            setNewFile(null);
            return;
        }

        if (file.size > maxSize) {
            setAlertMessage({ message: "파일 크기는 10MB를 초과할 수 없습니다.", severity: "error" });
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            setNewFile(null);
            return;
        }

        setNewFile(file);
        setAlertMessage({ message: `새 이미지 (${file.name})가 선택되었습니다. '이미지 교체' 버튼을 눌러 적용하세요.`, severity: "info" });
    };

    // ---------------------------
    // 4. 이미지 교체 (PUT)
    // ---------------------------
    const handleReplace = async () => {
        setAlertMessage(null);
        if (!item || !newFile) {
            setAlertMessage({ message: "교체할 새 이미지를 먼저 선택해주세요.", severity: "error" });
            return;
        }
        if (!window.confirm(`선택한 파일(${newFile.name})로 이 이미지를 교체하시겠습니까?`)) return;

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append("image", newFile);

            await api.put(`/api/gallery/${id}`, formData, { 
                headers: { "Content-Type": "multipart/form-data" }
            });

            setAlertMessage({ message: "이미지가 성공적으로 교체되었습니다! 목록으로 이동합니다.", severity: "success" });
            
            if (fileInputRef.current) fileInputRef.current.value = ""; 

            setTimeout(() => router.push("/gallery"), 1000);

        } catch (err: any) {
            console.error("이미지 교체 요청 실패:", err);
            const errorMsg = extractErrorMessage(err, "이미지 교체에 실패했습니다. 서버 연결을 확인하세요.");
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
        if (!window.confirm("정말로 이 이미지를 갤러리에서 삭제하시겠습니까? (이 작업은 취소할 수 없습니다)")) return;

        setIsProcessing(true);

        try {
            await api.delete(`/api/gallery/${id}`); 
            setAlertMessage({ message: "이미지가 성공적으로 삭제되었습니다! 목록으로 이동합니다.", severity: "success" });
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
                    <Button onClick={() => router.push("/gallery")} sx={{ mt: 2 }}>목록</Button>
                </Box>
            </Layout>
        );

    const imageUrl = previewUrl || item.url || 'https://via.placeholder.com/400?text=No+Image';

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={4} fontWeight="bold">갤러리 상세/교체</Typography>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Stack spacing={4}>
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight="bold">현재 이미지</Typography>
                        <Box 
                            sx={{ 
                                position: 'relative', 
                                width: '100%', 
                                maxWidth: 600,
                                height: 400,
                                borderRadius: 1, 
                                overflow: 'hidden', 
                                border: '1px solid #eee' 
                            }}
                        >
                            <Image
                                src={imageUrl}
                                alt={`Gallery image ${item.id}`}
                                fill
                                sizes="(max-width: 600px) 100vw, 600px"
                                style={{ objectFit: 'contain' }}
                                unoptimized={imageUrl.includes('placeholder')}
                            />
                        </Box>
                        
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                            {newFile 
                                ? `새 파일 미리보기: ${newFile.name} (${(newFile.size / 1024 / 1024).toFixed(2)} MB)` 
                                : `기존 파일 (업로드 시각: ${new Date(item.createdAt).toLocaleString()})`}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight="bold">이미지 교체</Typography>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/jpeg,image/jpg,image/png" 
                            onChange={handleFileChange} 
                            disabled={isProcessing} 
                        />
                        
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleReplace} 
                            disabled={isProcessing || !newFile}
                            sx={{ mt: 2 }}
                            startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                        >
                            {isProcessing && newFile ? "교체 처리 중..." : "이미지 교체"}
                        </Button>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                            * 허용 파일: JPG, PNG | 최대 크기: 10MB
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="flex-end" pt={4} borderTop="1px solid #eee">
                        <Button 
                            variant="text" 
                            onClick={() => router.push("/gallery")} 
                            disabled={isProcessing}
                        >
                            목록
                        </Button>

                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={handleDelete} 
                            disabled={isProcessing}
                            startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                        >
                            {isProcessing ? "삭제 처리 중..." : "이미지 삭제"}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Layout>
    );
}