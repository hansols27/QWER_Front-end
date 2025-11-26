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

// 💡 추가된 헬퍼 함수: 내용이 비어있는지 확인
const isContentEmpty = (htmlContent: string): boolean => {
    // HTML 태그를 제거하고 공백을 없앤 문자열이 비어있는지 확인
    const textContent = htmlContent.replace(/<[^>]*>?/gm, '').trim();
    // Quill 기본 빈 값 또는 완전히 비어있는지 확인
    const isQuillEmpty = htmlContent === '<p><br></p>' || htmlContent === '';

    return textContent.length === 0 || isQuillEmpty;
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
    // 💡 추가: SmartEditor에서 실시간으로 업데이트되는 내용을 담을 상태
    const [content, setContent] = useState(""); 

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
            // 💡 추가: content 상태 초기화
            setContent(data.content); 
            
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
        // 이 검사를 통해 에디터 인스턴스가 getContent를 제공하는지 최종 확인합니다.
        if (!isEditorReady || typeof editorRef.current.getContent !== 'function') {
             console.error("저장 실패: SmartEditor 인스턴스가 완전히 초기화되지 않았습니다.");
             setAlertMessage({ message: "에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.", severity: "warning" });
             return; 
        }

        const trimmedTitle = title.trim();
        // 💡 변경: Ref에서 직접 내용을 가져오지 않고 content 상태를 사용합니다.
        const currentContent = content || "";
        
        // 2. 제목 유효성 검사
        if (!trimmedTitle) { 
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" }); 
            return; 
        }
        
        // 3. 내용 유효성 검사
        if (isContentEmpty(currentContent)) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" }); 
            return; 
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            // 💡 API 호출 시 content 상태 사용
            await api.put(`/api/notice/${id}`, { type, title: trimmedTitle, content: currentContent }); 
            
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            setNotice(prev => prev ? { ...prev, title: trimmedTitle, type: type } : null);

        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "수정 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };
    
    // 💡 커스텀 모달을 통한 실제 삭제 실행 함수 (변경 없음)
    const executeDelete = async () => {
        setShowDeleteConfirm(false); // 모달 닫기
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

    // 💡 삭제 버튼 클릭 시 모달만 열도록 변경 (변경 없음)
    const handleDelete = () => {
        if (isProcessing) return;
        setShowDeleteConfirm(true); 
    };
    
    const handleListMove = () => {
        router.push("/notice");
    };

    // ... (로딩/에러 UI는 변경 없음)
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
                            {/* isEditorReady가 false일 때 로딩 인디케이터를 보여줄 수도 있습니다. */}
                            {!isEditorReady && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                                    <CircularProgress />
                                    <Typography>에디터 로딩 중...</Typography>
                                </Box>
                            )}
                            <Box sx={{ display: isEditorReady ? 'block' : 'none', height: '100%' }}>
                                <SmartEditor 
                                    ref={editorRef} 
                                    height="400px" 
                                    initialContent={initialContent} 
                                    disabled={isProcessing} 
                                    onReady={handleEditorReady} 
                                    // 💡 추가: 에디터 내용 변경 시 content 상태 업데이트
                                    onChange={setContent} 
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
                            onClick={handleDelete} // 모달 열기
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
                            // ⭐️ 수정된 disabled 조건:
                            // 1. 저장 처리 중 (isProcessing)
                            // 2. 제목이 비어있음 (!title.trim())
                            // 3. 내용이 비어있음 (isContentEmpty(content))
                            // 4. 에디터가 아직 로드되지 않음 (!isEditorReady) - 안전을 위해 유지
                            disabled={
                                isProcessing || 
                                !title.trim() || 
                                isContentEmpty(content) || 
                                !isEditorReady
                            } 
                            startIcon={isProcessing && alertMessage?.severity !== "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing && alertMessage?.severity !== "info" ? "저장 중..." : "저장"}
                        </Button>
                    </Stack>
                </Box>
            </Box>
            
            {/* 💡 삭제 확인 커스텀 모달 (변경 없음) */}
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