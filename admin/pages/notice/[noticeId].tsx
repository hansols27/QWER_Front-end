'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@shared/services/axios"; 
import Layout from "@components/common/layout";
import type { SmartEditorHandle } from "@components/common/SmartEditor"; 
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

type AlertSeverity = "success" | "error" | "info";

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
    // Next.js App Router에서 ID 가져오기
    const params = useParams();
    const id = params?.noticeId as string | undefined; 
    const router = useRouter();
    const editorRef = useRef<SmartEditorHandle>(null);

    // 상세 데이터 상태
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    // 수정/삭제 처리 중 상태
    const [isProcessing, setIsProcessing] = useState(false); 
    // 폼 입력 상태 (수정 가능하도록 초기화)
    const [title, setTitle] = useState("");
    const [type, setType] = useState<NoticeType>("공지"); 
    // 에디터 초기값 저장을 위한 상태
    const [initialContent, setInitialContent] = useState(""); 
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // ✅ 데이터 로딩 함수
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

            // 로드 후 상태 업데이트
            setNotice(data);
            setTitle(data.title);
            setType(data.type);
            setInitialContent(data.content); // 에디터 초기값 설정
            
        } catch (err: any) {
            console.error("공지사항 로드 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "공지사항 로드 실패"), severity: "error" });
            // 로드 실패 시 notice를 null로 유지하여 '찾을 수 없음' UI 표시
            setNotice(null); 
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { 
        fetchNotice(); 
    }, [fetchNotice]);

    // 헬퍼: 내용 유효성 검사 (useCallback으로 최적화)
    const isContentValid = useCallback((): boolean => {
        const content = editorRef.current?.getContent() || "";
        return content.replace(/<[^>]*>?/gm, '').trim().length > 0;
    }, []);

    // 💡 수정(저장) 핸들러
    const handleSave = async () => {
        if (!id || !notice) return; 
        
        const trimmedTitle = title.trim();
        const content = editorRef.current?.getContent() || "";
        
        // 유효성 검사
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
            
            // 성공 후 알림 표시 및 상태 초기화
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            // 성공 시, notice state의 제목과 타입을 수정한 값으로 즉시 업데이트 (createdAt 필드는 변하지 않음)
            setNotice(prev => prev ? { ...prev, title: trimmedTitle, type: type } : null);

        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "수정 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };

    // 💡 삭제 핸들러
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
    
    // 💡 목록 이동 핸들러
    const handleListMove = () => {
        router.push("/notice");
    };

    // 로딩 중 UI
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

    // 데이터 없음/에러 UI
    if (!id || !notice) { 
        return (
            <Layout>
                <Box p={4}>
                    {/* 로드 실패 시 표시된 에러 메시지가 있다면 그대로 유지 */}
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
                                // 로드된 내용을 initialContent로 전달하여 에디터에 표시
                                initialContent={initialContent} 
                                disabled={isProcessing} // 에디터 입력 비활성화
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
                        
                        {/* 삭제 버튼 (좌측으로 배치하여 강조를 낮춤) */}
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="large"
                            onClick={handleDelete} 
                            disabled={isProcessing}
                            startIcon={isProcessing && alertMessage?.severity === "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2, marginRight: 'auto' }} // auto로 왼쪽 끝에 배치
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
                            disabled={isProcessing || !title.trim() || !isContentValid()} 
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