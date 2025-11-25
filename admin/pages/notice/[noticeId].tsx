'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@shared/services/axios"; 
import type { SmartEditorHandle } from "@components/common/SmartEditor"; 
import Layout from "@components/common/layout";
import type { Notice, NoticeType } from "@shared/types/notice"; 
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

// 클라이언트 사이드 전용 에디터 동적 로딩
const SmartEditor = dynamic(() => import("@components/common/SmartEditor"), { ssr: false });

type AlertSeverity = "success" | "error" | "info" | "warning"; 

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
    const id = params?.noticeId as string | undefined; 
    const router = useRouter();
    const editorRef = useRef<SmartEditorHandle>(null);

    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false); 
    const [title, setTitle] = useState("");
    const [type, setType] = useState<NoticeType>("공지"); 
    const [initialContent, setInitialContent] = useState(""); 
    const [isEditorReady, setIsEditorReady] = useState(false); 
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // 데이터 로딩 함수
    const fetchNotice = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return; 
        }

        setLoading(true);
        setAlertMessage(null);
        try {
            const res = await api.get<NoticeResponse>(`/api/notice/${id}`); 
            const data = res.data.data;

            setNotice(data);
            setTitle(data.title);
            setType(data.type);
            setInitialContent(data.content); 
            
        } catch (err: any) {
            console.error("공지사항 로드 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "공지사항 로드 실패"), severity: "error" });
            setNotice(null); 
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { 
        fetchNotice(); 
    }, [fetchNotice]);

    // 에디터 준비 완료 핸들러
    const handleEditorReady = useCallback(() => {
        setIsEditorReady(true);
        // console.log("SmartEditor: 준비 완료. 저장 버튼 활성화.");
    }, []);


    // 이 함수는 이제 버튼 비활성화에 사용되지 않으며, handleSave 내부의 최종 검사용으로만 사용됩니다.
    // 하지만, 현재 로직이 명확하므로 주석 처리하고 handleSave에서 직접 검사하는 로직을 유지합니다.
    const isContentValid = useCallback((): boolean => {
        if (!isEditorReady || !editorRef.current || typeof editorRef.current.getContent !== 'function') {
            return false; 
        }
        
        const content = editorRef.current.getContent() || "";
        const textContent = content.replace(/<[^>]*>?/gm, '').trim();
        const isQuillEmpty = content === '<p><br></p>' || content === '';
        
        return textContent.length > 0 && !isQuillEmpty;
    }, [isEditorReady]);

    // 저장 핸들러
    const handleSave = async () => {
        
        if (!id || !notice || !editorRef.current) {
             console.error("저장 실패: 필수 데이터 또는 에디터 Ref가 준비되지 않았습니다.");
             return; 
        }
        
        if (!isEditorReady) {
            setAlertMessage({ message: "에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.", severity: "warning" });
            return;
        }

        if (typeof editorRef.current.getContent !== 'function') {
             console.error("저장 실패: SmartEditor 인스턴스가 getContent 함수를 제공하지 않습니다.");
             setAlertMessage({ message: "에디터 인스턴스 오류. 새로고침 후 시도해주세요.", severity: "error" });
             return; 
        }

        const trimmedTitle = title.trim();
        const content = editorRef.current.getContent() || "";
        
        // 2. 제목 유효성 검사 (필수)
        if (!trimmedTitle) { 
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" }); 
            return; 
        }
        
        // 3. 내용 유효성 검사 (최종 제출 시, 사용자가 내용을 비웠는지 확인)
        const textContent = content.replace(/<[^>]*>?/gm, '').trim();
        const isQuillEmpty = content === '<p><br></p>' || content === '';

        if (textContent.length === 0 || isQuillEmpty) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" }); 
            return; 
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            await api.put(`/api/notice/${id}`, { type, title: trimmedTitle, content }); 
            
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            setNotice(prev => prev ? { ...prev, title: trimmedTitle, type: type } : null);

        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "수정 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };
    
    // 삭제 및 목록 이동 핸들러 (동일)
    const handleDelete = async () => {
        if (!id || isProcessing || !window.confirm("정말로 공지사항을 삭제하시겠습니까?")) return; 

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
    
    const handleListMove = () => {
        router.push("/notice");
    };

    // 로딩 / 에러 UI (동일)
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

    if (!id || !notice) { 
        return (
            <Layout>
                <Box p={4}>
                    {!alertMessage && <Alert severity="warning">공지사항을 찾을 수 없거나 접근 경로가 잘못되었습니다.</Alert>}
                    {alertMessage && alertMessage.severity !== "success" && (
                        <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                            {alertMessage.message}
                        </Alert>
                    )}
                    <Button onClick={handleListMove} variant="contained" sx={{ mt: 2 }}>목록으로 이동</Button>
                </Box>
            </Layout>
        );
    }

    // 메인 상세/수정 UI
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">
                    공지사항 상세
                </Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
                        
                        {/* 제목/타입 영역 */}
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
                                error={!title.trim()}
                                helperText={!title.trim() ? "제목은 필수입니다." : undefined}
                            />
                        </Stack>

                        {/* 에디터 영역 */}
                        <Box sx={{ 
                            minHeight: '400px', 
                            border: '1px solid #ddd', 
                            borderRadius: 1, 
                            overflow: 'hidden',
                        }}> 
                            <SmartEditor 
                                ref={editorRef} 
                                height="400px" 
                                initialContent={initialContent} 
                                disabled={isProcessing} 
                                onReady={handleEditorReady} 
                            />
                        </Box>
                        
                        {/* 등록일시 정보 */}
                        <Typography variant="caption" color="textSecondary" alignSelf="flex-end">
                            등록일: {new Date(notice.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </Typography>

                    </Stack>
                </Card>

                {/* 액션 버튼 섹션 */}
                <Divider sx={{ mt: 4, mb: 4 }}/>
                <Box>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        
                        {/* 삭제 버튼 */}
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="large"
                            onClick={handleDelete} 
                            disabled={isProcessing}
                            startIcon={isProcessing && alertMessage?.severity === "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2, marginRight: 'auto' }} 
                        >
                            {isProcessing && alertMessage?.severity === "info" ? "삭제 중..." : "삭제"}
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
                        
                        {/* 저장 (수정) 버튼 */}
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            onClick={handleSave} 
                            // ⭐️ !isContentValid() 조건을 제거하여 데이터 로드 시 바로 활성화되도록 수정
                            disabled={isProcessing || !title.trim() || !isEditorReady} 
                            startIcon={isProcessing && alertMessage?.severity !== "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing && alertMessage?.severity !== "info" ? "저장 중..." : "저장"}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Layout>
    );
}