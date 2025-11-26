'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// @shared/services/axios와 @shared/types/notice는 예시로 그대로 둠
// 실제 환경에 맞게 경로를 수정해야 할 수 있습니다.
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
// SmartEditor 컴포넌트가 해당 경로에 존재해야 합니다.
const SmartEditor = dynamic(() => import("@components/common/SmartEditor"), { ssr: false });

type AlertSeverity = "success" | "error" | "info" | "warning"; 

interface NoticeResponse {
    success: boolean;
    data: Notice; 
}

// 헬퍼: 에러 메시지 추출
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    // API 응답 구조에 따라 에러 메시지 추출 로직 조정
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// 헬퍼 함수: 내용이 비어있는지 확인
const isContentEmpty = (htmlContent: string): boolean => {
    if (!htmlContent) return true;
    
    // HTML 태그를 제거하고 공백을 없앤 문자열이 비어있는지 확인
    const textContent = htmlContent.replace(/<[^>]*>?/gm, '').trim();
    
    // Quill 기본 빈 값 또는 완전히 비어있는지 확인
    const isQuillEmpty = htmlContent === '<p><br></p>' || htmlContent === '<p></p>' || htmlContent.trim() === '';

    return textContent.length === 0 || isQuillEmpty;
};

export default function NoticeDetail() {
    const params = useParams();
    // noticeId가 배열일 가능성을 대비하여 string으로 확실히 캐스팅
    const id = Array.isArray(params?.noticeId) ? params.noticeId[0] : (params?.noticeId as string | undefined);
    
    const router = useRouter();
    // SmartEditorHandle 타입은 @components/common/SmartEditor에서 정의되어야 합니다.
    const editorRef = useRef<SmartEditorHandle>(null); 

    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false); 
    const [title, setTitle] = useState("");
    const [type, setType] = useState<NoticeType>("공지"); 
    // 에디터의 초기값 설정용 상태. fetchNotice에서만 변경됨.
    const [initialContent, setInitialContent] = useState(""); 
    // SmartEditor의 실시간 내용을 담을 상태. 저장/유효성 검사에 사용됨.
    const [content, setContent] = useState(""); 
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
            // API 경로가 `/api/notice/${id}`라고 가정
            const res = await api.get<NoticeResponse>(`/api/notice/${id}`); 
            const data = res.data.data;

            setNotice(data);
            setTitle(data.title);
            setType(data.type);
            // 초기 내용과 현재 내용을 모두 업데이트
            setInitialContent(data.content); 
            setContent(data.content); 
            
        } catch (err: any) {
            console.error("공지사항 로드 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "공지사항 로드 실패"), severity: "error" });
            setNotice(null); 
        } finally {
            setLoading(false);
        }
    }, [id]);

    // id가 변경될 때마다 데이터를 다시 불러옵니다.
    useEffect(() => { 
        fetchNotice(); 
    }, [fetchNotice]);

    // 에디터 준비 완료 핸들러
    const handleEditorReady = useCallback(() => {
        setIsEditorReady(true);
    }, []);

    // 저장 핸들러
    const handleSave = async () => {
        
        // 1. 필수 데이터 및 준비 상태 확인
        if (!id || !notice) {
             console.error("저장 실패: 필수 데이터가 준비되지 않았습니다.");
             return; 
        }
        
        const trimmedTitle = title.trim();
        const currentContent = content; // content 상태 사용

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

        // 4. 에디터가 아직 로드되지 않은 상태에서 저장을 시도하는 경우 경고 (이중 확인)
        if (!isEditorReady) {
            setAlertMessage({ message: "에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.", severity: "warning" });
            return;
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            // API 호출 시 content 상태 사용
            await api.put(`/api/notice/${id}`, { type, title: trimmedTitle, content: currentContent }); 
            
            setAlertMessage({ message: "수정 완료! 목록으로 이동합니다.", severity: "success" });
            // 저장 성공 후 notice 객체 업데이트
            setNotice(prev => prev ? { ...prev, title: trimmedTitle, type: type, content: currentContent } : null);
            
            // ✅ 요청 사항: 저장 완료 후 목록 페이지로 이동
            setTimeout(() => router.push("/notice"), 1500);

        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "수정 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };
    
    // 실제 삭제 실행 함수
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

    // 삭제 버튼 클릭 시 모달 열기
    const handleDelete = () => {
        if (isProcessing) return;
        setShowDeleteConfirm(true); 
    };
    
    const handleListMove = () => {
        router.push("/notice");
    };

    // 로딩 UI
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

    // 데이터 없음/오류 UI
    if (!id || !notice) { 
        return (
            <Layout>
                <Box p={4}>
                    {/* 로드 실패 시 alertMessage가 이미 설정되어 있을 수 있음 */}
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
                            {/* isEditorReady가 false일 때 로딩 인디케이터 */}
                            {!isEditorReady && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px" flexDirection="column">
                                    <CircularProgress />
                                    <Typography mt={1}>에디터 로딩 중...</Typography>
                                </Box>
                            )}
                            {/* isEditorReady가 true일 때만 에디터 표시 */}
                            <Box sx={{ display: isEditorReady ? 'block' : 'none', height: '100%' }}>
                                <SmartEditor 
                                    ref={editorRef} 
                                    height="400px" 
                                    initialContent={initialContent} 
                                    disabled={isProcessing} 
                                    onReady={handleEditorReady} 
                                    // 에디터 내용 변경 시 content 상태 업데이트
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
                            // 저장 버튼 disabled 조건:
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