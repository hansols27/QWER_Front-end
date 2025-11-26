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
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
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
    const [isEditorReady, setIsEditorReady] = useState(false); // 에디터 준비 상태
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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


    // 저장 핸들러
    const handleSave = async () => {
        
        if (!id || !notice || !editorRef.current) {
             console.error("저장 실패: 필수 데이터 또는 에디터 Ref가 준비되지 않았습니다.");
             return; 
        }
        
        // 1. 에디터 준비 상태 최종 확인 (Ref 오류 방지)
        if (!isEditorReady) {
            setAlertMessage({ message: "에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.", severity: "warning" });
            return;
        }

        // 💡 핵심: SmartEditor에서 500ms 지연을 주었으므로 이 코드는 이제 안전하게 동작해야 합니다.
        if (typeof editorRef.current.getContent !== 'function') {
             // 타이밍 문제 발생 시 최종 방어벽
             console.error("저장 실패: SmartEditor 인스턴스가 getContent 함수를 제공하지 않습니다.");
             setAlertMessage({ message: "에디터 인스턴스 초기화 오류. 새로고침 후 시도해주세요.", severity: "error" });
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
    
    // 커스텀 모달을 통한 실제 삭제 실행 함수
    const executeDelete = async () => {
        setShowDeleteConfirm(false); 
        if (!id || isProcessing) return; 

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

    // 삭제 버튼 클릭 시 모달만 열기
    const handleDelete = () => {
        if (isProcessing) return;
        setShowDeleteConfirm(true); 
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
                    공지사항 상세/수정
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
                            {/* 💡 에디터 로딩 시 로딩 인디케이터 표시 */}
                            {!isEditorReady && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                                    <CircularProgress />
                                </Box>
                            )}
                            <Box sx={{ 
                                // 에디터가 준비되지 않으면 숨김 (지연 로딩이므로)
                                display: isEditorReady ? 'block' : 'none', 
                                height: isEditorReady ? '100%' : '0' 
                            }}>
                                <SmartEditor 
                                    ref={editorRef} 
                                    height="400px" 
                                    initialContent={initialContent} 
                                    disabled={isProcessing} 
                                    onReady={handleEditorReady} 
                                />
                            </Box>
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
                            삭제
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
                            // 에디터 준비와 제목 유효성 검사를 통해 활성화
                            disabled={isProcessing || !title.trim() || !isEditorReady} 
                            startIcon={isProcessing && alertMessage?.severity !== "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing && alertMessage?.severity !== "info" ? "저장 중..." : "저장"}
                        </Button>
                    </Stack>
                </Box>
            </Box>
            
            {/* 삭제 확인 커스텀 모달 */}
            <Dialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"공지사항 삭제 확인"}</DialogTitle>
                <DialogContent>
                    <Typography>
                        정말로 이 공지사항을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteConfirm(false)} color="primary" disabled={isProcessing}>
                        취소
                    </Button>
                    <Button 
                        onClick={executeDelete} 
                        color="error" 
                        variant="contained" 
                        autoFocus
                        disabled={isProcessing}
                        startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
                    >
                        삭제 확인
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}