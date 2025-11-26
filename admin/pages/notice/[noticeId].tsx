'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import type { SmartEditorHandle } from "@components/common/SmartEditor"; 
import type { NoticeType } from "@shared/types/notice"; 
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
    Card, 
    Divider,
    Dialog,        
    DialogTitle,  
    DialogContent, 
    DialogActions, 
    Skeleton,      
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material"; 

// SmartEditor는 SSR 제외하고 동적 로딩
const SmartEditor = dynamic(() => import("@components/common/SmartEditor"), { ssr: false });

type AlertSeverity = "success" | "error" | "info";

interface NoticeData {
    id: string;
    type: NoticeType;
    title: string;
    content: string; // HTML 콘텐츠
    // 필요한 다른 필드 (예: createdAt, updatedAt)
}

interface NoticeResponse {
    success: boolean;
    data: NoticeData;
}

interface ApiStatusResponse {
    success: boolean;
    message?: string;
}

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// 컴포넌트 이름 변경: NoticeCreate -> NoticeDetail
export default function NoticeDetail() {
    // URL에서 noticeId를 가져옵니다.
    const params = useParams();
    const noticeId = params.noticeId as string;

    const [type, setType] = useState<NoticeType>("공지"); 
    const [title, setTitle] = useState("");
    const [contentHtml, setContentHtml] = useState(""); // 에디터의 내용을 직접 관리할 상태
    
    const [isProcessing, setIsProcessing] = useState(false); // 저장/삭제 처리 중 상태
    const [isLoading, setIsLoading] = useState(true); // 데이터 로딩 중 상태
    const [editorLoaded, setEditorLoaded] = useState(false); 
    
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // 삭제 확인 모달 상태

    // 에디터의 ref는 setContent/setReadOnly와 같은 메서드 호출에만 사용합니다.
    const editorRef = useRef<SmartEditorHandle>(null);
    const router = useRouter();

    /**
     * 공지사항 데이터 로드
     */
    useEffect(() => {
        if (!noticeId) return;

        const fetchNotice = async () => {
            setIsLoading(true);
            try {
                // GET 요청으로 공지사항 상세 데이터 로드
                const res = await api.get<NoticeResponse>(`/api/notice/${noticeId}`);
                
                if (res.data.success) {
                    const notice = res.data.data;
                    setType(notice.type);
                    setTitle(notice.title);
                    setContentHtml(notice.content);
                } else {
                    setAlertMessage({ message: "공지사항 데이터를 로드하는 데 실패했습니다.", severity: "error" });
                }
            } catch (err: any) {
                console.error("공지사항 로드 실패:", err);
                setAlertMessage({ message: extractErrorMessage(err, "공지사항 로드 중 오류가 발생했습니다."), severity: "error" }); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotice();
    }, [noticeId]); // noticeId가 변경될 때마다 실행

    // SmartEditor가 로드 완료 시 호출되는 콜백
    const handleEditorReady = () => {
        setEditorLoaded(true);
        // 에디터 로드 후 초기 콘텐츠 설정 (useEffect에서 contentHtml이 업데이트되면 SmartEditor 컴포넌트가 알아서 처리할 것임)
    };
    
    // 내용 변경 시 contentHtml 상태 업데이트
    const handleContentChange = (value: string) => {
        setContentHtml(value); 
    };

    /**
     * 공지사항 수정 (저장) 처리
     */
    const handleUpdate = async () => {
        setAlertMessage(null);
        
        // 제출 시점의 최종 유효성 검사 (등록 페이지와 동일)
        const rawContentHTML = contentHtml || ""; 
        const trimmedTitle = title.trim();
        const trimmedContentText = rawContentHTML.replace(/<[^>]*>?/gm, '').trim(); 
        const isEmptyQuillContent = rawContentHTML.trim() === "<p><br></p>" || rawContentHTML.trim() === "";

        if (!trimmedTitle) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }
        
        if (!trimmedContentText || isEmptyQuillContent) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" });
            return;
        }

        setIsProcessing(true);

        try {
            // PUT/PATCH 요청으로 공지사항 수정
            const res = await api.patch<ApiStatusResponse>(`/api/notice/${noticeId}`, { 
                type, 
                title: trimmedTitle, 
                content: rawContentHTML 
            });
            
            if (res.data.success) {
                setAlertMessage({ message: "저장 (수정) 완료!", severity: "success" });
                // 수정 완료 후 목록으로 이동하지 않고 현재 페이지에 머무르거나, 1초 후 메시지 초기화
                setTimeout(() => setAlertMessage(null), 1500);
            } else {
                setAlertMessage({ message: res.data.message || "저장에 실패했습니다. 응답을 확인하세요.", severity: "error" });
            }
        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "저장 중 오류가 발생했습니다."), severity: "error" }); 
        } finally {
            setIsProcessing(false);
        }
    };
    
    /**
     * 공지사항 삭제 처리
     */
    const handleDelete = async () => {
        setIsDeleteDialogOpen(false); // 모달 닫기
        setAlertMessage(null);
        setIsProcessing(true);

        try {
            // DELETE 요청으로 공지사항 삭제
            const res = await api.delete<ApiStatusResponse>(`/api/notice/${noticeId}`);
            
            if (res.data.success) {
                setAlertMessage({ message: "삭제 완료! 목록으로 이동합니다.", severity: "success" });
                // 삭제 완료 후 목록 페이지로 이동
                setTimeout(() => router.push("/notice"), 1000);
            } else {
                setAlertMessage({ message: res.data.message || "삭제에 실패했습니다. 응답을 확인하세요.", severity: "error" });
            }
        } catch (err: any) {
            console.error("공지사항 삭제 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "삭제 중 오류가 발생했습니다."), severity: "error" }); 
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * 폼 유효성 검사 (버튼 비활성화 여부 결정) - 등록 페이지와 동일 로직 사용
     * @returns {boolean} true이면 비활성화 (저장 불가능), false이면 활성화 (저장 가능)
     */
    const checkFormValidity = (): boolean => {
        const titleValid = title.trim().length > 0;
        const rawContentHTML = contentHtml || ""; 
        
        let contentValid = false;
        let trimmedContentText = "";

        if (editorLoaded) {
            trimmedContentText = rawContentHTML.replace(/<[^>]*>?/gm, '').trim(); 
            const isEmptyQuillContent = rawContentHTML.trim() === "<p><br></p>" || rawContentHTML.trim() === "";
            contentValid = trimmedContentText.length > 0 && !isEmptyQuillContent; 
        }
        
        const isInvalid = !editorLoaded || !titleValid || !contentValid;
        return isInvalid; 
    }
    
    const isFormInValid = checkFormValidity();
    const isActionDisabled = isProcessing || isLoading;

    // 로딩 중일 때 스켈레톤 UI를 보여줍니다.
    if (isLoading) {
        return (
            <Layout>
                <Box p={4}>
                    <Typography variant="h4" mb={2} fontWeight="bold">공지사항 상세</Typography>
                    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                        <Stack spacing={3}>
                            <Skeleton variant="text" sx={{ fontSize: '2rem' }} width="40%" />
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Skeleton variant="rectangular" width={150} height={56} />
                                <Skeleton variant="rectangular" height={56} sx={{ flexGrow: 1 }} />
                            </Stack>
                            <Skeleton variant="rectangular" height={400} />
                        </Stack>
                    </Card>
                    <Divider sx={{ mt: 4, mb: 4 }}/>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Skeleton variant="rectangular" width={100} height={50} />
                        <Skeleton variant="rectangular" width={100} height={50} />
                        <Skeleton variant="rectangular" width={100} height={50} />
                    </Stack>
                </Box>
            </Layout>
        );
    }


    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">공지사항 상세/수정 ({noticeId})</Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}
                
                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
                        <Typography variant="h6" borderBottom="1px solid #eee" pb={1}>공지 내용</Typography>

                        <Stack direction="row" spacing={2} alignItems="center">
                            {/* 타입 선택 */}
                            <Select 
                                value={type} 
                                onChange={(e: SelectChangeEvent<NoticeType>) => setType(e.target.value as NoticeType)} 
                                disabled={isActionDisabled} 
                                sx={{ width: 150 }} 
                            >
                                <MenuItem value="공지">공지</MenuItem>
                                <MenuItem value="이벤트">이벤트</MenuItem>
                            </Select>
                            
                            {/* 제목 입력 */}
                            <TextField 
                                label="제목" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                disabled={isActionDisabled} 
                                fullWidth
                            />
                        </Stack>

                        {/* 에디터 영역 */}
                        <Box sx={{ minHeight: '400px', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
                            <SmartEditor 
                                ref={editorRef} 
                                height="400px" 
                                onReady={handleEditorReady}
                                onChange={handleContentChange} 
                                initialContent={contentHtml} // 로드된 내용으로 초기화
                            />
                            {!editorLoaded && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.9)', zIndex: 10 }}>
                                    <CircularProgress />
                                    <Typography sx={{ ml: 2, color: 'text.secondary' }}>에디터 로딩 중...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                </Card>

                {/* 하단 버튼 영역: 삭제, 목록, 저장 순서 */}
                <Divider sx={{ mt: 4, mb: 4 }}/>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    
                    {/* 1. 삭제 버튼 */}
                    <Button 
                        variant="outlined" 
                        color="error" 
                        size="large"
                        onClick={() => setIsDeleteDialogOpen(true)} // 모달 열기
                        disabled={isActionDisabled}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        삭제
                    </Button>

                    {/* 2. 목록 버튼 */}
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        onClick={() => router.push("/notice")} 
                        disabled={isActionDisabled}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        목록
                    </Button>

                    {/* 3. 저장 (수정) 버튼 */}
                    <Button 
                        variant="contained" 
                        color="success" 
                        size="large"
                        onClick={handleUpdate} // 수정 처리 함수 호출
                        // isFormInValid가 false일 때만 활성화 (disabled = false)
                        disabled={isActionDisabled || isFormInValid} 
                        startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
                        sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                    >
                        {isProcessing ? "저장 중..." : "저장"}
                    </Button>
                </Stack>
            </Box>

            {/* 삭제 확인 모달 */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
            >
                <DialogTitle>{"삭제 확인"}</DialogTitle>
                <DialogContent>
                    <Typography>삭제하시겠습니까?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary" disabled={isProcessing}>
                        취소
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        color="error" 
                        autoFocus 
                        variant="contained"
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