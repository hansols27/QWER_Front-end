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
    CircularProgress
} from "@mui/material";

const SmartEditor = dynamic(() => import("@components/common/SmartEditor"), { ssr: false });

type AlertSeverity = "success" | "error" | "info";

interface Notice {
    id: string;
    type: "공지" | "이벤트";
    title: string;
    content: string;
    createdAt: string;
}

// API 응답 구조를 명확히 정의
interface NoticeResponse {
    success: boolean;
    data: Notice;
}

// 헬퍼: 에러 메시지 추출 (일관성 유지)
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
    const [isEdit, setIsEdit] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [initialContent, setInitialContent] = useState("");
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    const fetchNotice = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setAlertMessage(null);
        try {
            // API 응답 타입 명시 및 데이터 추출
            const res = await api.get<NoticeResponse>(`/api/notice/${id}`); 
            const data = res.data.data;

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

    useEffect(() => {
        // isEdit 모드 변경 시 SmartEditor 상태 업데이트
        if (editorRef.current) {
            editorRef.current.setReadOnly(!isEdit);
            // 수정 모드 진입 시에만 현재 notice 내용을 에디터에 다시 설정 (필요한 경우)
            if (isEdit && notice) {
                editorRef.current.setContent(notice.content); 
            }
        }
    }, [isEdit, notice]);

    const handleSave = async () => {
        if (!notice) return;
        
        const trimmedTitle = title.trim();
        const content = editorRef.current?.getContent() || "";
        // 🚨 개선: HTML 태그 제거 후 공백 여부 검사
        const trimmedContentText = content.replace(/<[^>]*>?/gm, '').trim(); 
        
        if (!trimmedTitle) { 
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" }); 
            return; 
        }
        if (!trimmedContentText) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" }); 
            return; 
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            // API 통신 시 trim된 제목 사용
            const res = await api.put<NoticeResponse>(`/api/notice/${id}`, { type, title: trimmedTitle, content }); 
            const updatedNotice = res.data.data;
            
            // API에서 반환된 최신 데이터로 상태 업데이트
            setNotice(updatedNotice);
            setTitle(updatedNotice.title);
            setType(updatedNotice.type);
            setInitialContent(updatedNotice.content);
            
            setIsEdit(false);
            setAlertMessage({ message: "수정 완료!", severity: "success" });
        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "수정 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };

    const handleDelete = async () => {
        if (!notice) return;
        if (!window.confirm(`[${notice.type}] ${notice.title}을(를) 정말 삭제하시겠습니까?`)) return;

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            await api.delete(`/api/notice/${id}`);
            setAlertMessage({ message: "삭제 완료! 목록으로 이동합니다.", severity: "success" });
            setTimeout(() => router.push("/notice"), 1000);
        } catch (err: any) {
            console.error("공지사항 삭제 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "삭제 실패"), severity: "error" });
            setIsProcessing(false);
        }
    };

    const handleCancelEdit = () => {
        if (notice) {
            // 원본 데이터로 모든 상태 복원
            setIsEdit(false);
            setTitle(notice.title);
            setType(notice.type);
            setInitialContent(notice.content);
            setAlertMessage(null);
            
            // 에디터 내용도 원본으로 되돌리기
            if (editorRef.current) {
                editorRef.current.setContent(notice.content);
            }
        }
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
                    <Button onClick={() => router.push("/notice")} sx={{ mt: 2 }}>목록</Button>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">
                    공지사항 {isEdit ? "수정" : "상세"}
                </Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Stack spacing={2}>
                    {isEdit ? (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Select 
                                value={type} 
                                onChange={(e) => setType(e.target.value as "공지" | "이벤트")} 
                                disabled={isProcessing} 
                                sx={{ width: 150 }} // 폭을 명시적으로 설정
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
                                error={isEdit && !title.trim()} // 수정 모드에서 공백일 경우 에러 표시
                                helperText={isEdit && !title.trim() ? "제목은 필수입니다." : ""}
                            />
                        </Stack>
                    ) : (
                        <Box sx={{ borderBottom: "1px solid #eee", pb: 1, mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: "bold", color: notice.type === "공지" ? "#1565c0" : "#e65100" }}>
                                [{notice.type}]
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">{notice.title}</Typography>
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                                등록일: {new Date(notice.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ minHeight: '400px' }}> {/* 에디터 최소 높이 확보 */}
                        {/* initialContent prop은 SmartEditor가 내부적으로 처리하므로 그대로 유지합니다. */}
                        <SmartEditor ref={editorRef} height="400px" initialContent={initialContent} />
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {isEdit ? (
                                <>
                                    <Button 
                                        variant="contained" 
                                        onClick={handleSave} 
                                        // 버튼 비활성화 조건 강화: 로딩 중이거나 제목/내용 공백
                                        disabled={isProcessing || !title.trim()} 
                                        startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                                    >
                                        {isProcessing ? "저장 중..." : "저장"}
                                    </Button>
                                    <Button variant="outlined" onClick={handleCancelEdit} disabled={isProcessing}>취소</Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="contained" onClick={() => setIsEdit(true)} disabled={isProcessing}>수정</Button>
                                    <Button variant="contained" color="error" onClick={handleDelete} disabled={isProcessing}>삭제</Button>
                                </>
                            )}
                            <Button variant="outlined" onClick={() => router.push("/notice")} disabled={isProcessing}>목록</Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Layout>
    );
}