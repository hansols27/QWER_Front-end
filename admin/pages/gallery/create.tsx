'use client';

import { useState, ChangeEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import Image from "next/image";
import { 
    Box, 
    Button, 
    Card, 
    Typography, 
    IconButton, 
    Alert, 
    CircularProgress,
    Grid
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
    const fileInputRef = useRef<HTMLInputElement>(null); // 파일 인풋 참조

    // ---------------------------
    // 1. 파일 선택 및 유효성 검사
    // ---------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        if (!e.target.files) return;

        const selected = Array.from(e.target.files);
        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        const maxSize = 10 * 1024 * 1024; // 10MB

        const filtered: File[] = [];
        const errorMessages: string[] = [];

        selected.forEach((file) => {
            if (!validTypes.includes(file.type)) {
                errorMessages.push(`${file.name} → jpg, jpeg, png만 가능합니다.`);
            } else if (file.size > maxSize) {
                errorMessages.push(`${file.name} → 최대 10MB 초과`);
            } else {
                filtered.push(file);
            }
        });

        if (errorMessages.length > 0) {
            setAlertMessage({ message: errorMessages.join(" | "), severity: "error" });
        }

        if (filtered.length > 0) {
            setFiles(filtered);
            setAlertMessage((prev) => ({
                message: `${filtered.length}개의 파일이 선택되었습니다.`,
                severity: "info",
            }));
        } else {
            // 모든 파일이 유효하지 않으면 상태 초기화
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // ---------------------------
    // 2. 파일 미리보기 생성 및 해제
    // ---------------------------
    useEffect(() => {
        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviews(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [files]);

    // ---------------------------
    // 3. 선택 이미지 삭제
    // ---------------------------
    const handleRemoveFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        setPreviews(previews.filter((_, i) => i !== index));

        if (newFiles.length === 0) {
            setAlertMessage(null);
            // 파일 목록이 비면 input도 초기화
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };

    // ---------------------------
    // 4. 이미지 업로드 (POST)
    // ---------------------------
    const handleUpload = async () => {
        setAlertMessage(null);

        if (files.length === 0) {
            setAlertMessage({ message: "업로드할 이미지를 선택해주세요.", severity: "error" });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        files.forEach((file) => formData.append("images", file)); // "images" 키로 다중 파일 전송

        try {
            // Base URL은 axios 인스턴스에 위임
            await api.post("/api/gallery", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setAlertMessage({ message: `${files.length}개 이미지가 성공적으로 업로드되었습니다.`, severity: "success" });

            // 업로드 성공 후 상태 초기화 및 리다이렉트
            setFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            
            setTimeout(() => router.push("/gallery"), 1000);
        } catch (err: any) {
            console.error("업로드 실패:", err);
            const msg = extractErrorMessage(err, "이미지 업로드에 실패했습니다. 백엔드 연결을 확인하세요.");
            setAlertMessage({ message: msg, severity: "error" });
            setLoading(false);
        }
    };

    // ---------------------------
    // 5. 렌더링
    // ---------------------------
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">
                    갤러리 등록
                </Typography>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                        이미지 파일 선택 (다중 선택 가능, jpg/jpeg/png, 최대 10MB)
                    </Typography>
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                </Box>

                {files.length > 0 && (
                    <>
                        <Typography variant="h6" mb={2} fontWeight="bold">
                            {files.length}개 미리보기
                        </Typography>

                        <Grid container spacing={4} {...({} as any)}>
                            {previews.map((url, idx) => (
                                <Grid item xs={6} sm={4} md={3} key={idx} {...({} as any)}>
                                    <Card sx={{ position: "relative" }}>
                                        {/* next/image 사용으로 최적화 */}
                                        <Box sx={{ width: '100%', height: 200, position: 'relative' }}>
                                            <Image
                                                src={url}
                                                alt={`preview-${idx}`}
                                                fill
                                                sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
                                                style={{ objectFit: "cover" }}
                                                priority={false}
                                                unoptimized // 로컬 미리보기 URL은 최적화 제외
                                            />
                                        </Box>

                                        <IconButton
                                            size="small"
                                            color="error"
                                            sx={{
                                                position: "absolute",
                                                top: 5,
                                                right: 5,
                                                backgroundColor: "rgba(255,255,255,0.7)",
                                            }}
                                            onClick={() => handleRemoveFile(idx)}
                                            disabled={loading}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                <Box mt={4} display="flex" justifyContent="space-between">
                    <Button variant="text" onClick={() => router.push("/gallery")} disabled={loading}>
                        목록
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpload}
                        disabled={files.length === 0 || loading}
                        startIcon={loading && <CircularProgress size={20} color="inherit" />}
                    >
                        {loading ? "업로드 중..." : `이미지 ${files.length}개 업로드`}
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
}