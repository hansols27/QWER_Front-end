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

// SmartEditor는 SSR 제외하고 동적 로딩
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
    
    // 에디터의 내용을 직접 관리할 상태
    const [contentHtml, setContentHtml] = useState(""); 

    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // 에디터의 ref는 setContent/setReadOnly와 같은 메서드 호출에만 사용합니다.
    const editorRef = useRef<SmartEditorHandle>(null);
    const router = useRouter();

    // SmartEditor가 로드 완료 시 호출되는 콜백
    const handleEditorReady = () => {
        setEditorLoaded(true);
    };
    
    // 내용 변경 시 contentHtml 상태 업데이트
    const handleContentChange = (value: string) => {
        setContentHtml(value); 
    };

    const handleSubmit = async () => {
        setAlertMessage(null);
        
        // 제출 시점의 최종 유효성 검사
        const rawContentHTML = contentHtml || ""; 
        const trimmedTitle = title.trim();
        const trimmedContentText = rawContentHTML.replace(/<[^>]*>?/gm, '').trim(); 
        const isEmptyQuillContent = rawContentHTML.trim() === "<p><br></p>" || rawContentHTML.trim() === "";

        if (!trimmedTitle) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }
        
        if (!trimmedContentText || isEmptyQuillContent) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" });
            return;
        }

        setIsProcessing(true);

        try {
            // contentHtml 상태를 API에 전달
            const res = await api.post<NoticeCreateResponse>("/api/notice", { type, title: trimmedTitle, content: rawContentHTML });
            
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
    
    /**
     * 폼 유효성 검사 (버튼 비활성화 여부 결정)
     * @returns {boolean} true이면 비활성화 (등록 불가능), false이면 활성화 (등록 가능)
     */
    const checkFormValidity = (): boolean => {
        const titleValid = title.trim().length > 0;
        
        // contentHtml 상태를 직접 사용
        const rawContentHTML = contentHtml || ""; 
        
        let contentValid = false;
        let trimmedContentText = "";

        // editorLoaded가 true일 때만 내용 유효성 검사 수행
        if (editorLoaded) {
            
            // ReactQuill이 반환하는 HTML에서 태그를 제거하여 실제 텍스트만 추출
            trimmedContentText = rawContentHTML.replace(/<[^>]*>?/gm, '').trim(); 
            
            // ReactQuill의 일반적인 빈 콘텐츠 형태 추가 체크
            const isEmptyQuillContent = rawContentHTML.trim() === "<p><br></p>" || rawContentHTML.trim() === "";

            // 텍스트가 존재하고, 에디터의 빈 콘텐츠 패턴이 아니어야 유효함
            contentValid = trimmedContentText.length > 0 && !isEmptyQuillContent; 
        }
        
        // isInvalid = (에디터가 로드되지 않았거나) OR (제목이 유효하지 않거나) OR (내용이 유효하지 않거나)
        const isInvalid = !editorLoaded || !titleValid || !contentValid;

        // 디버깅 로그를 제거했습니다.

        return isInvalid; 
    }
    
    // contentHtml 상태가 변경될 때마다 isFormInValid가 재계산됩니다.
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
                                // 에디터 내용 변경 시 contentHtml 상태 업데이트
                                onChange={handleContentChange} 
                                // 부모 컴포넌트의 contentHtml 상태를 초기값으로 제공합니다.
                                initialContent={contentHtml} 
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
                        // isFormInValid가 false일 때만 활성화 (disabled = false)
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