'use client';

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
// SmartEditorHandle 인터페이스에 onReady Prop을 위한 변경이 필요합니다.
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

// 클라이언트 사이드 전용 에디터 동적 로딩
// SmartEditor 컴포넌트가 onReady prop을 받아 setEditorLoaded를 호출할 수 있도록 구현되어야 합니다.
const SmartEditor = dynamic(() => import("@components/common/SmartEditor"), { ssr: false });

type AlertSeverity = "success" | "error" | "info";

// API 응답 구조
interface NoticeCreateResponse {
    success: boolean;
    data: { id: string };
}

// 헬퍼: 에러 메시지 추출
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function NoticeCreate() {
    const [type, setType] = useState<NoticeType>("공지"); 
    const [title, setTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    // 💡 추가: 에디터가 완전히 로드되어 getContent 메서드를 사용할 수 있는 상태인지 확인합니다.
    const [editorLoaded, setEditorLoaded] = useState(false); 
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    const editorRef = useRef<SmartEditorHandle>(null);
    const router = useRouter();

    const handleEditorReady = () => {
        // 💡 에디터 로드 완료 시 상태를 true로 설정합니다.
        setEditorLoaded(true);
    };

    const handleSubmit = async () => {
        setAlertMessage(null);
        
        // 에디터 로드 상태 확인 (선택적)
        if (!editorLoaded) {
            setAlertMessage({ message: "에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.", severity: "info" });
            return;
        }

        const trimmedTitle = title.trim();
        // editorLoaded가 true이므로 getContent 호출이 안전해집니다.
        const content = editorRef.current?.getContent() || "";
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
        
        let contentValid = false;
        // 💡 수정: 에디터가 로드된 상태일 때만 getContent를 호출합니다.
        if (editorLoaded && editorRef.current) {
            const content = editorRef.current.getContent() || "";
            contentValid = content.replace(/<[^>]*>?/gm, '').trim().length > 0;
        }
        
        // 🟢 유효하지 않은 상태(Invalid)를 반환: 둘 중 하나라도 유효하지 않으면 true
        // 에디터 로드 전까지는 contentValid가 false이므로 버튼이 비활성화됩니다.
        return !titleValid || !contentValid; 
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

                        {/* 타입 선택 및 제목 */}
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

                        {/* 에디터 영역 */}
                        <Box sx={{ minHeight: '400px', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                            {/* 💡 수정: onReady prop을 추가하여 에디터 로드 완료를 알립니다. */}
                            <SmartEditor 
                                ref={editorRef} 
                                height="400px" 
                                onReady={handleEditorReady} // <-- SmartEditor 컴포넌트 내부에서 호출되도록 구현해야 합니다.
                            />
                            {!editorLoaded && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 10 }}>
                                    <CircularProgress />
                                    <Typography sx={{ ml: 2 }}>에디터 로딩 중...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                </Card>

                {/* 액션 버튼 섹션 */}
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
                        // isFormInValid가 true일 때(유효하지 않을 때) disabled
                        disabled={isProcessing || isFormInValid || !editorLoaded} // 💡 추가: 에디터 로드 전에는 비활성화
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