"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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
    CircularProgress,
    Stack 
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// 환경 변수를 사용하여 API 기본 URL 설정
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function GalleryCreate() {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false); 
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null); 
    const router = useRouter();

    // 파일 선택
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            if (e.target.files.length > 0) {
                setAlertMessage({ message: `${e.target.files.length}개의 파일이 선택되었습니다.`, severity: "success" });
            }
        }
    };

    // 선택 이미지 삭제
    const handleRemoveFile = (index: number) => {
        setFiles((prev) => {
            const newFiles = prev.filter((_, i) => i !== index);
            // 파일이 모두 제거되면 알림 초기화
            if (newFiles.length === 0) setAlertMessage(null); 
            return newFiles;
        });
    };

    // 업로드
    const handleUpload = async () => {
        setAlertMessage(null);
        if (!NEXT_PUBLIC_API_URL) {
            setAlertMessage({ message: "API 주소가 설정되지 않아 업로드할 수 없습니다.", severity: "error" });
            return;
        }
        if (files.length === 0) {
            setAlertMessage({ message: "업로드할 이미지를 선택해주세요.", severity: "error" });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        files.forEach((file) => formData.append("images", file)); 

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/gallery`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            
            setAlertMessage({ message: `${files.length}개 이미지가 성공적으로 업로드되었습니다. 목록으로 이동합니다.`, severity: "success" });
            
            // 성공 후 리스트 페이지로 이동
            setTimeout(() => router.push("/gallery"), 1000); 

        } catch (err) {
            console.error("업로드 실패:", err);
            setAlertMessage({ message: "이미지 업로드에 실패했습니다. 서버 연결을 확인하세요.", severity: "error" });
        } finally {
            // 성공 시 페이지 이동이 발생하므로, 실패한 경우에만 명시적으로 해제
            if (alertMessage?.severity === 'error' || files.length === 0) {
                setLoading(false);
            }
        }
    };

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2}>등록</Typography>

                {/* ⭐️ 알림 메시지 표시 */}
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>업로드</Typography>
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
                        <Typography variant="h6" mb={2}>{files.length}개 미리보기</Typography>
                        
                        <Grid container spacing={3} {...({} as any)}> 
                            {files.map((file, idx) => (
                                <Grid 
                                    item 
                                    xs={6} 
                                    sm={4} 
                                    md={3} 
                                    key={idx} 
                                    {...({} as any)}
                                >
                                    <Card sx={{ position: "relative" }}>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={URL.createObjectURL(file)} 
                                            alt={`preview-${idx}`}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            sx={{ 
                                                position: "absolute", 
                                                top: 5, 
                                                right: 5,
                                                backgroundColor: 'rgba(255, 255, 255, 0.7)' 
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

                {/* ⭐️ 버튼 섹션 */}
                <Box mt={4} display="flex" justifyContent="flex-end">
                    <Stack direction="row" spacing={2}>
                        
                        {/* 1. 목록 이동 버튼 */}
                        <Button 
                            variant="text" 
                            onClick={() => router.push("/gallery")} 
                            disabled={loading}
                        >
                            목록
                        </Button>

                        {/* 2. 업로드 버튼 */}
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={files.length === 0 || loading || !NEXT_PUBLIC_API_URL}
                            startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        >
                            {loading ? "업로드 중..." : `이미지 ${files.length}개 업로드`}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Layout>
    );
}