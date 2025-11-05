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
    Stack, // 레이아웃 통일성을 위해 Stack 사용
    Paper 
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
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);
    if (match) videoId = match[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0] ?? "";
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};

export default function VideoCreate() {
    const [title, setTitle] = useState("");
    const [src, setSrc] = useState("");
    const [loading, setLoading] = useState(false);
    // 입력 필드별 에러 상태 관리를 위해 별도 상태 추가
    const [fieldErrors, setFieldErrors] = useState({ title: false, src: false }); 
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error"; } | null>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        setAlertMessage(null);
        setFieldErrors({ title: false, src: false });
        
        //  trim을 사용한 유효성 검증 강화
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
        
        // 유효성 검사 실패 시 바로 리턴
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
            // API_BASE_URL 제거 및 트리밍된 데이터 전송
            const res = await api.post<{ success: boolean; data: VideoItem }>(`/api/video`, { 
                title: trimmedTitle, 
                src: trimmedSrc 
            });
            
            // 등록 성공 후 처리 로직 개선
            if (res.data.success && res.data.data?.id) { 
                setAlertMessage({ message: "영상이 성공적으로 등록되었습니다. 목록으로 이동합니다.", severity: "success" });
                // UX: 성공 메시지를 사용자가 볼 수 있도록 잠시 지연
                setTimeout(() => router.push("/video"), 1000);
            } else { 
                // 백엔드에서 success: true를 반환했으나 데이터가 없는 경우
                setAlertMessage({ message: "등록에 성공했으나 반환된 데이터에 문제가 있습니다.", severity: "error" }); 
                setLoading(false); 
            }
        } catch (err: any) {
            setAlertMessage({ message: extractErrorMessage(err, "영상 등록 중 서버 오류 발생"), severity: "error" });
            setLoading(false);
        }
    };

    const thumbnailUrl = getThumbnail(src);
    
    // 환경 변수 검사는 Layout 밖에서 처리
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

                <Stack spacing={3}>
                    <TextField 
                        label="제목" 
                        value={title} 
                        onChange={e => { setTitle(e.target.value); setFieldErrors(prev => ({ ...prev, title: false })); }} 
                        disabled={loading}
                        error={fieldErrors.title}
                        helperText={fieldErrors.title && !title.trim() ? "제목은 필수 입력 사항입니다." : ""}
                    />
                    <TextField 
                        label="유튜브 링크" 
                        value={src} 
                        onChange={e => { setSrc(e.target.value); setFieldErrors(prev => ({ ...prev, src: false })); }} 
                        disabled={loading} 
                        error={fieldErrors.src}
                        helperText={fieldErrors.src && !src.trim() ? "유튜브 링크는 필수 입력 사항입니다." : ""}
                    />
                    
                    {/* 썸네일 미리보기 UX */}
                    {src.trim() && thumbnailUrl ? (
                        <Paper elevation={3} sx={{ p: 2, display: 'inline-block', maxWidth: 400 }}>
                            <Typography variant="subtitle2" mb={1}>썸네일 미리보기</Typography>
                            <img 
                                src={thumbnailUrl} 
                                alt="썸네일" 
                                style={{ borderRadius: 4, width: '100%', height: 'auto', display: 'block' }} 
                            />
                        </Paper>
                    ) : (
                        src.trim() && <Alert severity="warning">링크가 유효하지 않아 썸네일을 표시할 수 없습니다.</Alert>
                    )}

                    <Box mt={2} display="flex" justifyContent="space-between">
                        <Button variant="text" onClick={() => router.push("/video")} disabled={loading}>목록</Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit} 
                            // 버튼 비활성화 조건 강화: 로딩 중이거나, 제목/링크가 비어있을 때
                            disabled={loading || !title.trim() || !src.trim()} 
                            startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        >
                            {loading ? "등록 중..." : "등록"}
                        </Button>
                    </Box>
                </Stack>
            </Box>
        </Layout>
    );
}