'use client';

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import dynamic from "next/dynamic";
import { 
    Box, 
    Button, 
    MenuItem, 
    Select, 
    TextField, 
    Typography, 
    Stack,
    Alert, 
    CircularProgress 
} from "@mui/material";
import type { SmartEditorHandle } from "../../components/common/SmartEditor";

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // ⭐️ 변수명 통일

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return defaultMsg;
};

// ⭐️ Alert severity 타입 통일
type AlertSeverity = "success" | "error" | "info";


const SmartEditor = dynamic(() => import("../../components/common/SmartEditor"), { ssr: false });

export default function NoticeCreate() {
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [title, setTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false); 
    // ⭐️ AlertSeverity 타입 사용
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null); 
    
    const editorRef = useRef<SmartEditorHandle>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        setAlertMessage(null);
        const content = editorRef.current?.getContent() || "";
        
        if (!API_BASE_URL) { // ⭐️ API_BASE_URL 사용
            setAlertMessage({ message: "API 주소가 설정되지 않아 등록할 수 없습니다.", severity: "error" });
            return;
        }

        if (!title.trim()) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }
        
        setIsProcessing(true);

        try {
            // ⭐️ API_BASE_URL 사용
            await axios.post(`${API_BASE_URL}/api/notice`, { type, title, content });
            
            setAlertMessage({ message: "등록 완료! 목록으로 이동합니다.", severity: "success" });
            
            // 성공 후 목록 페이지로 이동 (1초 대기)
            setTimeout(() => router.push("/notice"), 1000);

        } catch (err: any) { // ⭐️ 상세 오류 추출 적용
            console.error("등록 실패:", err);
            const errorMsg = extractErrorMessage(err, "등록 중 오류가 발생했습니다. 서버 연결을 확인하세요.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false); 
        }
    };
    
    // ⭐️ 환경 설정 오류 조기 종료
    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}><Alert severity="error">
                    <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                </Alert></Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box p={4}>
                {/* ⭐️ Typography 스타일 일관성 유지 */}
                <Typography variant="h4" mb={2} fontWeight="bold">공지사항 등록</Typography>
                
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Stack spacing={2}>
                    <Select 
                        value={type} 
                        onChange={(e) => setType(e.target.value as "공지" | "이벤트")}
                        disabled={isProcessing}
                        sx={{ maxWidth: 150 }} // Select 박스 크기 조정
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

                    <Box>
                        {/* SmartEditor는 content가 없으므로 초기값 설정을 명시적으로 하지 않음 */}
                        <SmartEditor ref={editorRef} height="400px" /> 
                    </Box>

                    {/* 버튼 Box에 상단 margin을 넉넉하게 주어 에디터와의 간격을 확보 */}
                    <Box sx={{ mt: 3 }}> 
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button 
                                variant="contained" 
                                onClick={handleSubmit}
                                disabled={isProcessing || !title.trim()} // 제목이 없거나 처리 중일 때 비활성화
                                startIcon={isProcessing && <CircularProgress size={20} color="inherit" />} 
                            >
                                {isProcessing ? "저장 중..." : "등록"}
                            </Button>
                            <Button 
                                variant="outlined" 
                                onClick={() => router.push("/notice")}
                                disabled={isProcessing}
                            >
                                목록
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Layout>
    );
}