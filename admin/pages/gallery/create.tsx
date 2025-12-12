'use client';

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import { 
    Box, 
    Button, 
    Card, 
    Typography, 
    IconButton, 
    Alert, 
    CircularProgress,
    Stack, 
    Divider, 
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

type AlertSeverity = "success" | "error" | "info";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function GalleryCreate() {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. 파일 선택 및 유효성 검사 (변경 없음)
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        if (!e.target.files) return;

        const selected = Array.from(e.target.files);
        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        const maxSize = 30 * 1024 * 1024; // 30MB

        const filtered: File[] = [];
        const errorMessages: string[] = [];

        selected.forEach((file) => {
            if (!validTypes.includes(file.type)) {
                errorMessages.push(`${file.name} → jpg, jpeg, png만 가능합니다.`);
            } else if (file.size > maxSize) {
                errorMessages.push(`${file.name} → 최대 30MB 초과`);
            } else {
                filtered.push(file);
            }
        });

        if (errorMessages.length > 0) {
            setAlertMessage({ message: errorMessages.join(" | "), severity: "error" });
        }

        const newFiles = [...files, ...filtered]; 

        if (newFiles.length > 0) {
            setFiles(newFiles);
            setAlertMessage((prev) => ({
                message: `${newFiles.length}개의 파일이 선택되었습니다.`,
                severity: "info",
            }));
        } else {
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // 2. 파일 미리보기 생성 및 해제 (변경 없음)
    useEffect(() => {
        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviews(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [files]);

    // 3. 선택 이미지 삭제 (변경 없음)
    const handleRemoveFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);

        if (newFiles.length === 0) {
            setAlertMessage(null);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        } else {
            setAlertMessage({ message: `${newFiles.length}개의 파일이 남아있습니다.`, severity: "info" });
        }
    };

    // 4. 이미지 업로드 (POST) (변경 없음)
    const handleUpload = async () => {
        setAlertMessage(null);

        if (files.length === 0) {
            setAlertMessage({ message: "업로드할 이미지를 선택해주세요.", severity: "error" });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));

        try {
            await api.post("/api/gallery/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setAlertMessage({ message: `${files.length}개 이미지가 성공적으로 업로드되었습니다! 목록으로 이동합니다.`, severity: "success" });

            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            
            setTimeout(() => router.push("/gallery"), 1000);
        } catch (err: any) {
            console.error("업로드 실패:", err);
            const msg = extractErrorMessage(err, "이미지 업로드에 실패했습니다. 서버 연결을 확인하세요.");
            setAlertMessage({ message: msg, severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    // 5. 렌더링
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">갤러리 등록</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Stack spacing={3}>
                    {/* 파일 선택 섹션 (변경 없음) */}
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>이미지 파일 선택</Typography>
                        
                        <Stack direction="row" spacing={3} alignItems="center">
                            {/* MUI Button을 통해 파일 입력 필드 접근 */}
                            <Button variant="contained" component="label" color="primary" disabled={loading}>
                                이미지 파일 선택 (다중)
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    multiple
                                    hidden 
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                            </Button>
                            
                            {/* 선택된 파일 개수 표시 */}
                            {files.length > 0 && (
                                <Typography variant="body1" fontWeight="bold" color="primary">
                                    총 {files.length}개의 파일이 선택됨
                                </Typography>
                            )}
                        </Stack>
                        
                        <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                            * 다중 선택 가능, JPG/PNG 허용, 최대 크기: 30MB
                        </Typography>

                    </Card>

                    {/* 미리보기 섹션 */}
                    {files.length > 0 && (
                        <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                            <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>
                                {files.length}개 이미지 미리보기
                            </Typography>

                            {/* 💡 Grid 대신 Flexbox/Stack을 사용하여 80x80 이미지를 나열합니다. */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {previews.map((url, idx) => (
                                    <Box 
                                        key={idx}
                                        sx={{ position: "relative" }}
                                    > 
                                        <Box
                                            component="img"
                                            // 💡 item.url 대신 map 함수의 url 인자를 사용합니다.
                                            src={url || undefined} 
                                            alt={`preview-${idx}`}
                                            sx={{ 
                                                // 💡 고정된 크기 80px x 80px 적용 (요청하신 크기)
                                                width: 80, 
                                                height: 80, 
                                                objectFit: "cover", 
                                                borderRadius: 1, 
                                                border: "1px solid #ccc",
                                            }}
                                        />

                                        {/* 삭제 버튼 (기존 코드와 동일) */}
                                        <IconButton
                                            size="small"
                                            color="error"
                                            sx={{
                                                position: "absolute",
                                                top: -10, // 위치 조정
                                                right: -10, // 위치 조정
                                                backgroundColor: "rgba(255,255,255,0.8)",
                                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' }
                                            }}
                                            onClick={() => handleRemoveFile(idx)}
                                            disabled={loading}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Card>
                    )}
                    
                    {/* 액션 버튼 섹션 (변경 없음) */}
                    <Divider sx={{ mt: 4, mb: 4 }}/>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            onClick={() => router.push("/gallery")} 
                            disabled={loading}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            목록
                        </Button>
                        <Button
                            variant="contained"
                            color="success" 
                            size="large"
                            onClick={handleUpload}
                            disabled={files.length === 0 || loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }} 
                        >
                            {loading ? "업로드 중..." : `이미지 ${files.length}개 등록`}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Layout>
    );
}