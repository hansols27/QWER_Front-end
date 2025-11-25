'use client';

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import type { SmartEditorHandle } from "@components/common/SmartEditor"; 
import type { NoticeType } from "@shared/types/notice"; 
import {
    Box,
    Button,
    Select,
    MenuItem,
    TextField,
    Typography,
    Stack,
    Alert,
    CircularProgress,
    Card, 
    Divider 
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material"; 

const SmartEditor = dynamic(() => import("@components/common/SmartEditor"), { ssr: false });

type AlertSeverity = "success" | "error" | "info";

interface NoticeCreateResponse {
    success: boolean;
    data: { id: string };
}

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function NoticeCreate() {
    const [type, setType] = useState<NoticeType>("공지"); 
    const [title, setTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [editorLoaded, setEditorLoaded] = useState(false); 
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    const editorRef = useRef<SmartEditorHandle>(null);
    const router = useRouter();

    const handleEditorReady = () => {
        setEditorLoaded(true);
    };

    const handleSubmit = async () => {
        setAlertMessage(null);
        
        // 💡 콘텐츠를 가져올 때도 안정성 확인 로직 사용
        const contentGetter = editorRef.current?.getContent;
        
        if (!editorLoaded || typeof contentGetter !== 'function') {
             setAlertMessage({ message: "에디터가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.", severity: "info" });
             return;
        }

        const trimmedTitle = title.trim();
        const content = contentGetter() || ""; // 안전하게 호출
        const trimmedContentText = content.replace(/<[^>]*>?/gm, '').trim(); 

        if (!trimmedTitle) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }
        
        if (!trimmedContentText) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" });
            return;
        }

        setIsProcessing(true);

        try {
            const res = await api.post<NoticeCreateResponse>("/api/notice", { type, title: trimmedTitle, content });
            
            if (res.data.success) {
                setAlertMessage({ message: "등록 완료! 목록으로 이동합니다.", severity: "success" });
                setTimeout(() => router.push("/notice"), 1000);
            } else {
                setAlertMessage({ message: "등록에 실패했습니다. 응답을 확인하세요.", severity: "error" });
                setIsProcessing(false);
            }
        } catch (err: any) {
            console.error("공지사항 등록 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "등록 중 오류가 발생했습니다."), severity: "error" }); 
            setIsProcessing(false);
        }
    };
    
    const checkFormValidity = (): boolean => {
        const titleValid = title.trim().length > 0;
        
        const contentGetter = editorRef.current?.getContent;
        
        let contentValid = false;

        // 💡 R.current.getContent (contentGetter)가 함수일 때만 호출
        if (editorLoaded && typeof contentGetter === 'function') {
            const content = contentGetter() || ""; 
            contentValid = content.replace(/<[^>]*>?/gm, '').trim().length > 0;
        }
        
        // 에디터 로드 전이나 내용이 유효하지 않으면 버튼 비활성화
        return !editorLoaded || !titleValid || !contentValid; 
    }
    const isFormInValid = checkFormValidity();


    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">공지사항 등록</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}
                
                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
                        <Typography variant="h6" borderBottom="1px solid #eee" pb={1}>공지 내용</Typography>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Select 
                                value={type} 
                                onChange={(e: SelectChangeEvent<NoticeType>) => setType(e.target.value as NoticeType)} 
                                disabled={isProcessing} 
                                sx={{ width: 150 }} 
                            >
                                <MenuItem value="공지">공지</MenuItem>
                                <MenuItem value="이벤트">이벤트</MenuItem>
                            </Select>
                            
                            <TextField 
                                label="제목" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                disabled={isProcessing} 
                                fullWidth
                            />
                        </Stack>

                        <Box sx={{ minHeight: '400px', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
                            <SmartEditor 
                                ref={editorRef} 
                                height="400px" 
                                onReady={handleEditorReady}
                            />
                            {!editorLoaded && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.9)', zIndex: 10 }}>
                                    <CircularProgress />
                                    <Typography sx={{ ml: 2, color: 'text.secondary' }}>에디터 로딩 중...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                </Card>

                <Divider sx={{ mt: 4, mb: 4 }}/>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        onClick={() => router.push("/notice")} 
                        disabled={isProcessing}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        목록
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success" 
                        size="large"
                        onClick={handleSubmit} 
                        disabled={isProcessing || isFormInValid} 
                        startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        {isProcessing ? "저장 중..." : "등록"}
                    </Button>
                </Stack>
            </Box>
        </Layout>
    );
}