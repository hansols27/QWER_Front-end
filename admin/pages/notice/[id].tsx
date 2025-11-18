'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@shared/services/axios"; 
import Layout from "@components/common/layout";
import type { SmartEditorHandle } from "@components/common/SmartEditor"; 
import {
    Box,
    Button,
    Typography,
    Stack,
    Select,
    MenuItem,
    TextField,
    Alert,
    CircularProgress,
    Card, 
    Divider 
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";

const SmartEditor = dynamic(() => import("@components/common/SmartEditor"), { ssr: false });

type AlertSeverity = "success" | "error" | "info";

interface Notice {
    id: string;
    type: "공지" | "이벤트";
    title: string;
    content: string;
    createdAt: string;
}

interface NoticeResponse {
    success: boolean;
    data: Notice;
}

// 헬퍼: 에러 메시지 추출
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function NoticeDetail() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const editorRef = useRef<SmartEditorHandle>(null);

    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [initialContent, setInitialContent] = useState("");
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // 💡 SmartEditor의 읽기 전용 상태를 항상 false로 설정 (수정 가능하게 유지)
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setReadOnly(false); 
        }
    }, []); 

    const fetchNotice = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setAlertMessage(null);
        try {
            const res = await api.get<NoticeResponse>(`/api/notice/${id}`); 
            const data = res.data.data;

            // 💡 데이터 로딩 후, state에 저장하여 즉시 수정 가능하도록 준비
            setNotice(data);
            setTitle(data.title);
            setType(data.type);
            setInitialContent(data.content);
            
        } catch (err: any) {
            console.error("공지사항 로드 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "공지사항 로드 실패"), severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchNotice(); }, [fetchNotice]);

    // 헬퍼: 내용 유효성 검사
    const isContentValid = useCallback(() => {
        const content = editorRef.current?.getContent() || "";
        return content.replace(/<[^>]*>?/gm, '').trim().length > 0;
    }, []);

    // 💡 수정(저장) 핸들러
    const handleSave = async () => {
        if (!notice) return;
        
        const trimmedTitle = title.trim();
        const content = editorRef.current?.getContent() || "";
        
        if (!trimmedTitle) { 
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" }); 
            return; 
        }
        if (!isContentValid()) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" }); 
            return; 
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            // PUT API 호출 (수정)
            await api.put(`/api/notice/${id}`, { type, title: trimmedTitle, content }); 
            
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            // 저장 성공 후, alert 메시지를 본 후 상세 페이지 상태(목록으로 이동 가능) 유지
            // 필요 시 fetchNotice()를 다시 호출하여 최신 데이터를 반영할 수도 있음
        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "수정 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };

    // 💡 삭제 핸들러
    const handleDelete = async () => {
        if (!window.confirm("삭제하시겠습니까?")) return; 

        setIsProcessing(true);
        setAlertMessage({ message: "삭제 중...", severity: "info" });

        try {
            await api.delete(`/api/notice/${id}`);
            
            setAlertMessage({ message: "삭제 완료! 목록으로 이동합니다.", severity: "success" });
            
            setTimeout(() => router.push("/notice"), 1500); 
        } catch (err: any) {
            console.error("공지사항 삭제 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "삭제 실패"), severity: "error" });
            setIsProcessing(false);
        }
    };
    
    // 💡 목록 이동 핸들러
    const handleListMove = () => {
        router.push("/notice");
    };


    if (loading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                    <CircularProgress />
                    <Typography mt={2}>로딩 중...</Typography>
                </Box>
            </Layout>
        );
    }

    if (!notice) {
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="warning">공지사항을 찾을 수 없습니다.</Alert>
                    <Button onClick={handleListMove} sx={{ mt: 2 }}>목록</Button>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">
                    공지사항 상세/수정
                </Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                {/* Card 레이아웃 시작 */}
                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
                        
                        {/* 제목/타입 영역: 항상 수정 가능한 상태로 렌더링 */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Select 
                                value={type} 
                                onChange={(e: SelectChangeEvent<"공지" | "이벤트">) => setType(e.target.value as "공지" | "이벤트")} 
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
                                error={!title.trim()}
                                helperText={!title.trim() ? "제목은 필수입니다." : undefined}
                            />
                        </Stack>

                        {/* 에디터 영역: 항상 수정 가능한 상태로 렌더링 */}
                        <Box sx={{ 
                            minHeight: '400px', 
                            border: '1px solid #ddd', 
                            borderRadius: 1, 
                            overflow: 'hidden',
                        }}> 
                            {/* initialContent를 통해 로드된 데이터를 에디터에 표시 */}
                            <SmartEditor ref={editorRef} height="400px" initialContent={initialContent} />
                        </Box>
                        
                        {/* 원본 등록일시 정보 (선택적 표시) */}
                        <Typography variant="caption" color="textSecondary" alignSelf="flex-end">
                            등록일: {new Date(notice.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </Typography>

                    </Stack>
                </Card>
                {/* Card 레이아웃 끝 */}

                {/* 액션 버튼 섹션: 저장, 목록, 삭제 3가지 버튼만 표시 */}
                <Divider sx={{ mt: 4, mb: 4 }}/>
                <Box>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        
                        {/* 저장 (수정) 버튼 */}
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            onClick={handleSave} 
                            // 제목 또는 내용이 유효하지 않으면 비활성화
                            disabled={isProcessing || !title.trim() || !isContentValid()} 
                            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing ? "저장 중..." : "저장"}
                        </Button>
                        
                        {/* 목록 버튼 */}
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            onClick={handleListMove} 
                            disabled={isProcessing}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            목록
                        </Button>
                        
                        {/* 삭제 버튼 */}
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="large"
                            onClick={handleDelete} 
                            disabled={isProcessing}
                            startIcon={isProcessing && alertMessage?.severity === "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing && alertMessage?.severity === "info" ? "삭제 중..." : "삭제"}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Layout>
    );
}