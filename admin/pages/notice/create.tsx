'use client';

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import type { SmartEditorHandle } from "@components/common/SmartEditor";
import {
    Box,
    Button,
    Select,
    MenuItem,
    TextField,
    Typography,
    Stack,
    Alert,
    CircularProgress
} from "@mui/material";

const SmartEditor = dynamic(() => import("@components/common/SmartEditor"), { ssr: false });

type AlertSeverity = "success" | "error" | "info";

// API 응답 구조를 명확히 정의
interface NoticeCreateResponse {
    success: boolean;
    data: { id: string }; // 등록 후 최소한 id가 반환된다고 가정
}

// 헬퍼: 에러 메시지 추출 (일관성 유지)
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function NoticeCreate() {
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [title, setTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    const editorRef = useRef<SmartEditorHandle>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        setAlertMessage(null);
        
        // trim을 사용하여 제목 유효성 검사 강화
        const trimmedTitle = title.trim();
        const content = editorRef.current?.getContent() || "";
        // HTML 태그 제거 후 내용 공백 여부 검사
        const trimmedContentText = content.replace(/<[^>]*>?/gm, '').trim(); 

        if (!trimmedTitle) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }
        
        // 내용 유효성 검사
        if (!trimmedContentText) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" });
            return;
        }

        setIsProcessing(true);

        try {
            // trim된 제목 사용 및 응답 타입 명시
            const res = await api.post<NoticeCreateResponse>("/api/notice", { type, title: trimmedTitle, content });
            
            if (res.data.success) {
                setAlertMessage({ message: "등록 완료! 목록으로 이동합니다.", severity: "success" });
                setTimeout(() => router.push("/notice"), 1000);
            } else {
                 // 백엔드가 success: false를 반환했지만 에러가 throw되지 않은 경우
                setAlertMessage({ message: "등록에 실패했습니다. 응답을 확인하세요.", severity: "error" });
                setIsProcessing(false);
            }
        } catch (err: any) {
            console.error("공지사항 등록 실패:", err);
            // 에러 메시지 추출 헬퍼 사용
            setAlertMessage({ message: extractErrorMessage(err, "등록 중 오류가 발생했습니다."), severity: "error" }); 
            setIsProcessing(false);
        }
    };
    
    // 등록 버튼 비활성화 조건에 내용 체크 로직 포함
    const isFormInValid = !title.trim() || !editorRef.current?.getContent()?.replace(/<[^>]*>?/gm, '')?.trim();

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">공지사항 등록</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Stack spacing={2}>
                    <Select 
                        value={type} 
                        onChange={(e) => setType(e.target.value as "공지" | "이벤트")} 
                        disabled={isProcessing} 
                        sx={{ maxWidth: 150 }}
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
                        // 제목이 비어 있을 경우 시각적 오류 표시
                        error={!title.trim() && !isProcessing}
                        helperText={!title.trim() && !isProcessing ? "제목은 필수입니다." : ""}
                    />

                    <Box sx={{ minHeight: '400px' }}>
                        <SmartEditor ref={editorRef} height="400px" />
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button 
                                variant="contained" 
                                onClick={handleSubmit} 
                                // isFormInValid 사용 (로딩 중이거나 제목/내용이 비었을 때)
                                disabled={isProcessing || isFormInValid} 
                                startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                            >
                                {isProcessing ? "저장 중..." : "등록"}
                            </Button>
                            <Button variant="outlined" onClick={() => router.push("/notice")} disabled={isProcessing}>목록</Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Layout>
    );
}