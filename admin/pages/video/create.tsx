"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Alert, 
    CircularProgress, 
    Stack, 
    Card, // 👈 Card 컴포넌트 추가
    Divider, // 👈 Divider 컴포넌트 추가
    Paper // Paper는 썸네일 미리보기용으로 유지
} from "@mui/material";
import { VideoItem } from "@shared/types/video";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// 썸네일 추출 로직은 유지
const getThumbnail = (url: string) => {
    let videoId = "";
    // 유튜브 URL에서 videoId 추출 (다양한 형식 지원)
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);
    if (match) videoId = match[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0] ?? "";
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
    
    // 비디오 ID가 있으면 썸네일 URL 반환
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};

export default function VideoCreate() {
    const [title, setTitle] = useState("");
    const [src, setSrc] = useState("");
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ title: false, src: false }); 
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error"; } | null>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        setAlertMessage(null);
        setFieldErrors({ title: false, src: false });
        
        const trimmedTitle = title.trim();
        const trimmedSrc = src.trim();
        let isValid = true;
        
        if (!trimmedTitle) {
            setFieldErrors(prev => ({ ...prev, title: true }));
            isValid = false;
        }
        if (!trimmedSrc) {
            setFieldErrors(prev => ({ ...prev, src: true }));
            isValid = false;
        }
        
        if (!isValid) {
            setAlertMessage({ message: "제목과 유튜브 링크를 모두 입력해 주세요.", severity: "error" });
            return;
        }

        // 유효한 유튜브 링크인지 썸네일로 최종 확인
        if (!getThumbnail(trimmedSrc)) { 
            setFieldErrors(prev => ({ ...prev, src: true }));
            setAlertMessage({ message: "유효한 유튜브 링크 형식이 아닙니다. 확인 후 다시 시도해 주세요.", severity: "error" }); 
            return; 
        }

        if (!process.env.NEXT_PUBLIC_API_URL) { 
            setAlertMessage({ message: "API 주소가 설정되지 않아 등록할 수 없습니다.", severity: "error" }); 
            return; 
        }

        setLoading(true);
        try {
            const res = await api.post<{ success: boolean; data: VideoItem }>(`/api/video`, { 
                title: trimmedTitle, 
                src: trimmedSrc 
            });
            
            if (res.data.success && res.data.data?.id) { 
                setAlertMessage({ message: "영상이 성공적으로 등록되었습니다. 목록으로 이동합니다.", severity: "success" });
                setTimeout(() => router.push("/video"), 1000);
            } else { 
                setAlertMessage({ message: "등록에 성공했으나 반환된 데이터에 문제가 있습니다.", severity: "error" }); 
                setLoading(false); 
            }
        } catch (err: any) {
            setAlertMessage({ message: extractErrorMessage(err, "영상 등록 중 서버 오류 발생"), severity: "error" });
            setLoading(false);
        }
    };

    const thumbnailUrl = getThumbnail(src);
    
    // 환경 변수 검사는 Layout 밖에서 처리 (유지)
    if (!process.env.NEXT_PUBLIC_API_URL) return (
        <Layout>
            <Box p={4}><Alert severity="error">API 주소가 설정되지 않았습니다.</Alert></Box>
        </Layout>
    );

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">영상 등록</Typography>
                
                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                {/* 앨범/갤러리 등록과 통일된 Card 레이아웃 시작 */}
                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
                        <Typography variant="h6" borderBottom="1px solid #eee" pb={1}>등록 정보 입력</Typography>
                        
                        {/* 제목 입력 필드 */}
                        <TextField 
                            label="제목" 
                            fullWidth
                            value={title} 
                            onChange={e => { setTitle(e.target.value); setFieldErrors(prev => ({ ...prev, title: false })); }} 
                            disabled={loading}
                            error={fieldErrors.title}
                            helperText={fieldErrors.title && !title.trim() ? "제목은 필수 입력 사항입니다." : ""}
                        />
                        
                        {/* 유튜브 링크 입력 필드 */}
                        <TextField 
                            label="유튜브 링크" 
                            fullWidth
                            value={src} 
                            onChange={e => { setSrc(e.target.value); setFieldErrors(prev => ({ ...prev, src: false })); }} 
                            disabled={loading} 
                            error={fieldErrors.src}
                            helperText={
                                fieldErrors.src ? 
                                    (!src.trim() ? "유튜브 링크는 필수 입력 사항입니다." : "유효한 유튜브 링크 형식이 아닙니다.") 
                                    : "예: https://www.youtube.com/watch?v=xxxxxxxxxxx"
                            }
                        />
                        
                        {/* 썸네일 미리보기 UX */}
                        {src.trim() && thumbnailUrl ? (
                            <Paper elevation={1} sx={{ p: 2, maxWidth: 400, mt: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" mb={1} fontWeight="bold">썸네일 미리보기</Typography>
                                <img 
                                    src={thumbnailUrl} 
                                    alt="썸네일" 
                                    style={{ 
                                        borderRadius: 4, 
                                        width: '100%', 
                                        height: 'auto', 
                                        display: 'block', 
                                        border: '1px solid #ddd' 
                                    }} 
                                />
                            </Paper>
                        ) : (
                            src.trim() && <Alert severity="warning">링크가 유효하지 않아 썸네일을 표시할 수 없습니다.</Alert>
                        )}
                    </Stack>
                </Card>
                {/* Card 레이아웃 끝 */}

                {/* 액션 버튼 섹션 */}
                <Divider sx={{ mt: 4, mb: 4 }}/>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large" // 👈 large size 적용
                        onClick={() => router.push("/video")} 
                        disabled={loading}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        목록
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success" // 👈 success color 적용
                        size="large" // 👈 large size 적용
                        onClick={handleSubmit} 
                        disabled={loading || !title.trim() || !src.trim()} 
                        startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        {loading ? "등록 중..." : "등록"}
                    </Button>
                </Stack>
            </Box>
        </Layout>
    );
}