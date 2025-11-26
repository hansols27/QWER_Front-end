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

// 동적 로딩 SmartEditor
const SmartEditor = dynamic<any>(
    () => import("@components/common/SmartEditor").then(mod => mod.default),
    {
        ssr: false,
        loading: () => (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        )
    }
);

type AlertSeverity = "success" | "error" | "info" | "warning";

// 에러 메시지 추출
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// API 응답 타입
interface NoticeResponse {
    success: boolean;
    data: Notice; 
}

export default function NoticeDetail() {
    const params = useParams();
    const id = params?.noticeId ? params.noticeId as string : '';
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ------------------------
    // 데이터 로딩
    // ------------------------
    const fetchNotice = useCallback(async () => {
        if (!id) {
            setLoading(false);
            setAlertMessage({ message: "공지사항 ID가 유효하지 않습니다.", severity: "warning" });
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

    // ------------------------
    // 에디터 준비 완료 핸들러
    // ------------------------
    const handleEditorReady = useCallback(() => {
        if (!isEditorReady) {
            setIsEditorReady(true);
            console.log("SmartEditor: 준비 완료. 저장 버튼 활성화.");

            // 초기 content 설정 보장
            if (editorRef.current && initialContent) {
                editorRef.current.setContent(initialContent);
            }
        }
    }, [initialContent, isEditorReady]);

    // ------------------------
    // 저장 핸들러
    // ------------------------
    const handleSave = async () => {
        if (!id || !notice) {
            setAlertMessage({ message: "수정할 공지사항 정보가 없습니다.", severity: "error" });
            return; 
        }

        if (!isEditorReady) {
            setAlertMessage({ message: "에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.", severity: "warning" });
            return;
        }

        if (!editorRef.current || typeof editorRef.current.getContent !== "function") {
            console.error("SmartEditor 인스턴스가 getContent를 제공하지 않음");
            setAlertMessage({ message: "에디터 초기화 오류. 새로고침 후 시도해주세요.", severity: "error" });
            return;
        }

        const trimmedTitle = title.trim();
        const content = editorRef.current.getContent() || "";

        if (!trimmedTitle) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }

        if (!content || content === "<p><br></p>") {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" });
            return;
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            await api.put(`/api/notice/${id}`, { type, title: trimmedTitle, content }); 
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            setNotice(prev => prev ? { ...prev, title: trimmedTitle, type, content } : null);
        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "수정 실패"), severity: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    // ------------------------
    // 삭제 핸들러
    // ------------------------
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

    const handleDelete = () => { if (!isProcessing) setShowDeleteConfirm(true); };
    const handleListMove = () => router.push("/notice");

    // ------------------------
    // 로딩 / 에러 UI
    // ------------------------
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

    // ------------------------
    // 메인 상세 UI
    // ------------------------
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">공지사항 상세/수정</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
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

                        <Box sx={{ minHeight: '400px', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                            {!isEditorReady && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                                    <CircularProgress />
                                </Box>
                            )}
                            <Box sx={{ display: isEditorReady ? 'block' : 'none', height: '100%' }}>
                                <SmartEditor
                                    ref={editorRef}
                                    height="400px"
                                    initialContent={initialContent}
                                    disabled={isProcessing}
                                    onReady={handleEditorReady}
                                />
                            </Box>
                        </Box>

                        <Typography variant="caption" color="textSecondary" alignSelf="flex-end">
                            등록일: {new Date(notice.createdAt).toLocaleString('ko-KR', {
                                year: 'numeric', month: '2-digit', day: '2-digit', 
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </Typography>
                    </Stack>
                </Card>

                <Divider sx={{ mt: 4, mb: 4 }} />
                <Box>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button 
                            variant="outlined" color="error" size="large"
                            onClick={handleDelete} disabled={isProcessing}
                            startIcon={isProcessing && alertMessage?.severity === "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2, marginRight: 'auto' }}
                        >
                            삭제
                        </Button>

                        <Button 
                            variant="contained" color="primary" size="large"
                            onClick={handleListMove} disabled={isProcessing}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            목록
                        </Button>

                        <Button 
                            variant="contained" color="success" size="large"
                            onClick={handleSave}
                            disabled={isProcessing || !title.trim() || !isEditorReady || !editorRef.current}
                            startIcon={isProcessing && alertMessage?.severity !== "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing && alertMessage?.severity !== "info" ? "저장 중..." : "저장"}
                        </Button>
                    </Stack>
                </Box>

                <Dialog
                    open={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle>{"삭제 확인"}</DialogTitle>
                    <DialogContent>
                        <Typography>삭제하시겠습니까?</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowDeleteConfirm(false)} color="primary" disabled={isProcessing}>
                            취소
                        </Button>
                        <Button 
                            onClick={executeDelete} color="error" variant="contained" autoFocus
                            disabled={isProcessing}
                            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
                        >
                            확인
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}
