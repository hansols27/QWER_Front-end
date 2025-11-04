"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/axios"; // ✅ 공통 axios 인스턴스
import Layout from "../../components/common/layout";
import { 
    Box, 
    Button, 
    Card, 
    CardMedia, 
    Grid, 
    Typography, 
    IconButton, 
    Alert, 
    CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type AlertSeverity = "success" | "error" | "info";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function GalleryCreate() {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);
    const router = useRouter();

    // 파일 선택
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            setFiles(selected);
            if (selected.length > 0) {
                setAlertMessage({
                    message: `${selected.length}개의 파일이 선택되었습니다.`,
                    severity: "info",
                });
            }
        }
    };

    // 선택 이미지 삭제
    const handleRemoveFile = (index: number) => {
        setFiles((prev) => {
            const newFiles = prev.filter((_, i) => i !== index);
            if (newFiles.length === 0) setAlertMessage(null);
            return newFiles;
        });
    };

    // 이미지 업로드
    const handleUpload = async () => {
        setAlertMessage(null);

        if (!API_BASE_URL) {
            setAlertMessage({
                message: "API 주소가 설정되지 않았습니다.",
                severity: "error",
            });
            return;
        }

        if (files.length === 0) {
            setAlertMessage({
                message: "업로드할 이미지를 선택해주세요.",
                severity: "error",
            });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));

        try {
            // ✅ 공통 api 인스턴스 사용
            await api.post(`/api/gallery`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setAlertMessage({
                message: `${files.length}개 이미지가 성공적으로 업로드되었습니다.`,
                severity: "success",
            });

            setTimeout(() => router.push("/gallery"), 1000);
        } catch (err: any) {
            console.error("업로드 실패:", err);
            const msg = extractErrorMessage(err, "이미지 업로드에 실패했습니다.");
            setAlertMessage({ message: msg, severity: "error" });
            setLoading(false);
        }
    };

    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="error">
                        <Typography fontWeight="bold">환경 설정 오류:</Typography>
                        .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                    </Alert>
                </Box>
            </Layout>
        );
    }

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
                        이미지 파일 선택 (다중 선택 가능)
                    </Typography>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                </Box>

                {files.length > 0 && (
                    <>
                        <Typography variant="h6" mb={2} fontWeight="bold">
                            {files.length}개 미리보기
                        </Typography>

                        {/* ✅ Grid에 타입 오류 방지용 코드 포함 */}
                        <Grid container spacing={4} {...({} as any)}>
                            {files.map((file, idx) => (
                                <Grid item xs={6} sm={4} md={3} key={idx} {...({} as any)}>
                                    <Card sx={{ position: "relative" }}>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={URL.createObjectURL(file)}
                                            alt={`preview-${idx}`}
                                            sx={{ objectFit: "cover" }}
                                        />
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
