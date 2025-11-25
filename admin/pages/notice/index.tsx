'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import type { Notice } from "@shared/types/notice"; 
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    TableContainer // 💡 TableContainer 추가
} from "@mui/material";

// 💡 앨범 목록처럼 'warning' 타입을 추가하여 더 유연하게 대응
type AlertSeverity = "success" | "error" | "info" | "warning"; 

interface NoticeListResponse {
    success: boolean;
    data: Notice[]; 
}

// 🟢 등록일자 포맷 함수
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-').slice(0, -1);
};

// 헬퍼: 에러 메시지 추출 (앨범 목록과 동일하게 유지)
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function NoticeList() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);
    const router = useRouter();

    const fetchNotices = useCallback(async () => {
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.get<NoticeListResponse>("/api/notice");
            setNotices(res.data.data); 
        } catch (err: any) {
            console.error("공지사항 목록 로드 실패:", err);
            setAlertMessage({ 
                message: extractErrorMessage(err, "공지사항 목록 로드 실패"), 
                severity: "error" 
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]); 

    /**
     * 💡 앨범 목록과 동일하게 상세 페이지 이동 핸들러를 명확히 분리
     */
    const handleRowClick = (noticeId: string) => {
        if (!noticeId || typeof noticeId !== 'string') {
            // 유효성 검사 및 경고 메시지 처리 (404 추적 목적)
            console.error("⛔ 유효하지 않은 공지사항 ID:", noticeId);
            setAlertMessage({ message: "유효하지 않은 항목입니다.", severity: "warning" });
            return;
        }
        
        // ⭐️ 디버깅: 라우팅 되는 ID 값을 확인        
        router.push(`/notice/${noticeId}`);
    };

    return (
        <Layout>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold">공지사항 관리</Typography>
                    <Button variant="contained" onClick={() => router.push("/notice/create")} disabled={loading}>
                        등록
                    </Button>
                </Box>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={4} flexDirection="column">
                        <CircularProgress />
                        <Typography mt={2}>로딩 중...</Typography>
                    </Box>
                ) : notices.length === 0 ? (
                    <Typography variant="body1" color="textSecondary" align="center" py={4}>등록된 공지사항이 없습니다.</Typography>
                ) : (
                    <Paper>
                        <TableContainer> {/* 💡 TableContainer로 감싸서 안정성 확보 */}
                            <Table sx={{ minWidth: 650 }} aria-label="공지사항 목록">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: "bold", width: "10%" }}>구분</TableCell>
                                        <TableCell sx={{ fontWeight: "bold", width: "70%" }}>제목</TableCell> 
                                        <TableCell sx={{ fontWeight: "bold", width: "20%" }}>등록일</TableCell> 
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {notices.map((notice) => (
                                        <TableRow 
                                            key={notice.id} 
                                            hover 
                                            sx={{ cursor: "pointer" }} 
                                            // 💡 분리된 핸들러를 호출하도록 수정
                                            onClick={() => handleRowClick(notice.id)}
                                        >
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        backgroundColor: notice.type === "공지" ? "#e3f2fd" : "#fff3e0",
                                                        color: notice.type === "공지" ? "#1565c0" : "#e65100",
                                                        fontWeight: "bold",
                                                        fontSize: "0.75rem",
                                                        display: 'inline-block' 
                                                    }}
                                                >
                                                    {notice.type}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{notice.title}</TableCell>
                                            <TableCell>{formatDate(notice.createdAt)}</TableCell> 
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Box>
        </Layout>
    );
}