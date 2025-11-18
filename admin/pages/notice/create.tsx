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
    CircularProgress,
    Card, // 👈 Card 컴포넌트 추가
    Divider // 👈 Divider 컴포넌트 추가
} from "@mui/material";

// 클라이언트 사이드 전용 에디터 동적 로딩
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
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [title, setTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    const editorRef = useRef<SmartEditorHandle>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        setAlertMessage(null);
        
        const trimmedTitle = title.trim();
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
    
    // 등록 버튼 비활성화 조건: 제목 또는 내용이 비었을 때 (HTML 태그 제거 후 검사)
    const isFormInValid = !title.trim() || !editorRef.current?.getContent()?.replace(/<[^>]*>?/gm, '')?.trim();

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">공지사항 등록</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}
                
                {/* 앨범/갤러리 등록과 통일된 Card 레이아웃 시작 */}
                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
                        <Typography variant="h6" borderBottom="1px solid #eee" pb={1}>공지 내용</Typography>

                        {/* 타입 선택 및 제목 */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Select 
                                value={type} 
                                onChange={(e) => setType(e.target.value as "공지" | "이벤트")} 
                                disabled={isProcessing} 
                                sx={{ width: 150 }} // 고정 너비 지정
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
                        </Stack>

                        {/* 에디터 영역 */}
                        <Box sx={{ minHeight: '400px', border: '1px solid #ddd', borderRadius: 1 }}>
                            <SmartEditor ref={editorRef} height="400px" />
                        </Box>
                    </Stack>
                </Card>
                {/* Card 레이아웃 끝 */}

                {/* 액션 버튼 섹션 */}
                <Divider sx={{ mt: 4, mb: 4 }}/>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button 
                        variant="contained" 
                        color="success" // 👈 success color 적용
                        size="large" // 👈 large size 적용
                        onClick={handleSubmit} 
                        disabled={isProcessing || isFormInValid} 
                        startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        {isProcessing ? "저장 중..." : "등록"}
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" // 목록 버튼은 inherit (기본 색상) 유지
                        size="large"
                        onClick={() => router.push("/notice")} 
                        disabled={isProcessing}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        목록
                    </Button>
                </Stack>
            </Box>
        </Layout>
    );
}