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

// 클라이언트 사이드 전용 에디터 동적 로딩 (실제 경로 가정)
const SmartEditor = dynamic<any>(
    () => import("@components/common/SmartEditor").then(mod => mod.default), 
    { ssr: false, loading: () => <Box display="flex" justifyContent="center" alignItems="center" height="400px"><CircularProgress /></Box> }
);

type AlertSeverity = "success" | "error" | "info" | "warning"; 

// 헬퍼: 에러 메시지 추출
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// API 응답 타입 (실제 환경에 맞게 조정 필요)
interface NoticeResponse {
    success: boolean;
    data: Notice; 
}

export default function NoticeDetail() {
    const params = useParams();
    // 실제 환경에서는 ID를 useParams에서 가져옴
    const id = params?.noticeId ? params.noticeId as string : ''; 
    const router = useRouter();
    
    // 💡 핵심: SmartEditorHandle 타입으로 useRef 선언
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
            // ID가 없으면 에러 메시지를 표시하고 목록으로 이동하도록 유도
            setAlertMessage({ message: "공지사항 ID가 유효하지 않습니다.", severity: "warning" });
            return; 
        }

        setLoading(true);
        setAlertMessage(null);
        try {
            // 실제 API 호출
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
        console.log("SmartEditor: 준비 완료. 저장 버튼 활성화.");
    }, []);


    // 저장 핸들러
    const handleSave = async () => {
        
        if (!id || !notice) {
            console.error("저장 실패: 필수 데이터가 누락되었습니다.");
            setAlertMessage({ message: "수정할 공지사항 정보가 없습니다.", severity: "error" });
            return; 
        }

        // 1. 에디터 준비 상태 최종 확인 (Ref 오류 방지)
        if (!isEditorReady || !editorRef.current) {
            setAlertMessage({ message: "에디터 로딩 중입니다. 잠시 후 다시 시도해주세요. (Ref Not Ready)", severity: "warning" });
            return;
        }

        // 💡 핵심: Ref가 유효하고 isEditorReady가 true일 때만 호출
        if (typeof editorRef.current?.getContent !== 'function') {
            // 타이밍 문제 발생 시 최종 방어벽 (이 메시지가 보이면 SmartEditor 구현을 재확인해야 함)
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
        
        // 3. 내용 유효성 검사
        // Quill 기본 비어 있는 값 체크: <p><br></p>
        const isQuillEmpty = content === '<p><br></p>' || content === '';

        if (isQuillEmpty) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" }); 
            return; 
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            // 실제 API 호출
            await api.put(`/api/notice/${id}`, { type, title: trimmedTitle, content }); 
            
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            setNotice(prev => prev ? { ...prev, title: trimmedTitle, type: type, content: content } : null); // content 업데이트 추가

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
            // 실제 API 호출
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
                            
                            {!isEditorReady && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                                    <CircularProgress />
                                </Box>
                            )}
                            <Box sx={{ 
                                // 에디터가 준비되지 않으면 숨김
                                display: isEditorReady ? 'block' : 'none', 
                                height: '100%'
                            }}>
                                <SmartEditor 
                                    ref={editorRef} // 💡 핵심: Ref 연결
                                    height="400px" 
                                    initialContent={initialContent} 
                                    disabled={isProcessing} 
                                    onReady={handleEditorReady} // 💡 핵심: 준비 완료 시 isEditorReady=true 설정
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
                <DialogTitle id="alert-dialog-title">{"삭제 확인"}</DialogTitle>
                <DialogContent>
                    <Typography>
                        삭제하시겠습니까? 
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
                        확인
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}