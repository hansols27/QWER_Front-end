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
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

const SmartEditor = dynamic(() => import("../../components/common/SmartEditor"), { ssr: false });

export default function NoticeCreate() {
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [title, setTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false); // ⭐️ 처리 중 상태
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null); // ⭐️ 알림 상태
    
    const editorRef = useRef<SmartEditorHandle>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        setAlertMessage(null); // 알림 초기화
        const content = editorRef.current?.getContent() || "";
        
        if (!NEXT_PUBLIC_API_URL) {
            setAlertMessage({ message: "API 주소가 설정되지 않아 등록할 수 없습니다.", severity: "error" });
            return;
        }

        if (!title.trim()) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }
        
        setIsProcessing(true);

        try {
            // ⭐️ 절대 경로 API 사용
            await axios.post(`${NEXT_PUBLIC_API_URL}/api/notice`, { type, title, content });
            
            setAlertMessage({ message: "등록 완료! 목록으로 이동합니다.", severity: "success" });
            
            // 성공 후 목록 페이지로 이동
            setTimeout(() => router.push("/notice"), 1000);

        } catch (err) {
            console.error("등록 실패:", err);
            setAlertMessage({ message: "등록 중 오류가 발생했습니다. 서버 연결을 확인하세요.", severity: "error" });
            setIsProcessing(false); // 오류 발생 시 로딩 해제
        }
    };

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2}>공지사항 등록</Typography>
                
                {/* ⭐️ 알림 메시지 표시 */}
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
                    >
                        <MenuItem value="공지">공지</MenuItem>
                        <MenuItem value="이벤트">이벤트</MenuItem>
                    </Select>

                    <TextField 
                        label="제목" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        disabled={isProcessing}
                    />

                    <Box>
                        <SmartEditor ref={editorRef} height="400px" /> 
                    </Box>

                    {/* 버튼 Box에 상단 margin을 넉넉하게 주어 에디터와의 간격을 확보 */}
                    <Box sx={{ mt: 3 }}> 
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button 
                                variant="contained" 
                                onClick={handleSubmit}
                                disabled={isProcessing || !title.trim()} // 제목이 없거나 처리 중일 때 비활성화
                                startIcon={isProcessing && <CircularProgress size={20} color="inherit" />} // 로딩 아이콘 표시
                            >
                                {isProcessing ? "저장 중..." : "등록"}
                            </Button>
                            <Button 
                                variant="outlined" 
                                onClick={() => router.push("/notice")}
                                disabled={isProcessing} // 처리 중일 때 비활성화
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
