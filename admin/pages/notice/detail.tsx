'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "../api/axios"; // ✅ axios 인스턴스 사용
import Layout from "../../components/common/layout";
import type { SmartEditorHandle } from "../../components/common/SmartEditor";
import { 
    Box, 
    Button, 
    Typography, 
    Stack, 
    TextField, 
    Select, 
    MenuItem, 
    Alert, 
    CircularProgress 
} from "@mui/material";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

type AlertSeverity = "success" | "error" | "info";

const SmartEditor = dynamic(() => import("../../components/common/SmartEditor"), { ssr: false });

interface Notice {
    id: number;
    type: "공지" | "이벤트";
    title: string;
    content: string;
}

export default function NoticeDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const editorRef = useRef<SmartEditorHandle>(null);

    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [initialContent, setInitialContent] = useState("");
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // ✅ 공지 상세 조회
    const fetchNotice = useCallback(async () => {
        if (!id || !API_BASE_URL) {
            setLoading(false);
            if (!API_BASE_URL) {
                setAlertMessage({
                    message: "환경 설정 오류: API 주소가 설정되지 않았습니다.",
                    severity: "error",
                });
            }
            return;
        }

        setLoading(true);
        setAlertMessage(null);
        try {
            const res = await api.get<Notice>(`/api/notice/${id}`);
            const data = res.data;
            setNotice(data);
            setTitle(data.title);
            setType(data.type);
            setInitialContent(data.content);
        } catch (err: any) {
            console.error("공지사항 로드 실패:", err);
            const errorMsg = extractErrorMessage(err, "공지사항을 불러오는데 실패했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchNotice();
    }, [fetchNotice]);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setReadOnly(!isEdit);
            if (isEdit && notice) {
                editorRef.current.setContent(notice.content);
            }
        }
    }, [isEdit, initialContent, notice]);

    // ✅ 수정 (PUT)
    const handleSave = async () => {
        if (!notice) return;
        const content = editorRef.current?.getContent() || "";

        if (!title.trim()) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            await api.put(`/api/notice/${id}`, { title, type, content });
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            setIsEdit(false);
            const updatedNotice = { ...notice, title, type, content };
            setNotice(updatedNotice);
            setInitialContent(content);
        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            const errorMsg = extractErrorMessage(err, "수정 중 오류가 발생했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    // ✅ 삭제 (DELETE)
    const handleDelete = async () => {
        if (!notice) return;
        if (!window.confirm("정말로 삭제하시겠습니까?")) return;

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            await api.delete(`/api/notice/${id}`);
            setAlertMessage({ message: "삭제 완료! 목록으로 이동합니다.", severity: "success" });
            setTimeout(() => router.push("/notice"), 1000);
        } catch (err: any) {
            console.error("공지사항 삭제 실패:", err);
            const errorMsg = extractErrorMessage(err, "삭제 중 오류가 발생했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false);
        }
    };

    const handleCancelEdit = () => {
        if (notice) {
            setIsEdit(false);
            setTitle(notice.title);
            setType(notice.type);
            setAlertMessage(null);
            setInitialContent(notice.content);
        }
    };

    if (loading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                    <CircularProgress />
                    <Typography mt={2}>공지사항 로딩 중...</Typography>
                </Box>
            </Layout>
        );
    }

    if (!notice) {
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="warning">요청한 ID의 공지사항을 찾을 수 없습니다.</Alert>
                    <Button onClick={() => router.push("/notice")} sx={{ mt: 2 }}>목록으로</Button>
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

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Stack spacing={2}>
                    {isEdit ? (
                        <Stack direction="row" spacing={2}>
                            <Select
                                value={type}
                                onChange={(e) => setType(e.target.value as "공지" | "이벤트")}
                                disabled={isProcessing}
                                sx={{ maxWidth: 150 }}
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
                            />
                        </Stack>
                    ) : (
                        <Box sx={{ borderBottom: "1px solid #eee", pb: 1 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 0.5,
                                    fontWeight: "bold",
                                    color: notice.type === "공지" ? "#1565c0" : "#e65100",
                                }}
                            >
                                [{notice.type}]
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                {notice.title}
                            </Typography>
                        </Box>
                    )}

                    <Box>
                        <SmartEditor
                            ref={editorRef}
                            height="400px"
                            initialContent={initialContent}
                        />
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {isEdit ? (
                                <>
                                    <Button
                                        variant="contained"
                                        onClick={handleSave}
                                        disabled={isProcessing || !title.trim()}
                                        startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                                    >
                                        {isProcessing ? "저장 중..." : "저장"}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={handleCancelEdit}
                                        disabled={isProcessing}
                                    >
                                        취소
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="contained"
                                        onClick={() => setIsEdit(true)}
                                        disabled={isProcessing}
                                    >
                                        수정
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={handleDelete}
                                        disabled={isProcessing}
                                    >
                                        삭제
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="outlined"
                                onClick={() => router.push("/notice")}
                                disabled={isProcessing}
                            >
                                목록
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Layout>
    );
}
