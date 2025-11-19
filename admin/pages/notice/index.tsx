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
    Paper
} from "@mui/material";

type AlertSeverity = "success" | "error" | "info";

interface NoticeListResponse {
    success: boolean;
    data: Notice[]; 
}

// 🟢 컴포넌트 외부로 이동: 등록일자 포맷 함수
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    // 현재 구현된 로직 유지 (YYYY-MM-DD 형태 예상)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-').slice(0, -1);
};

// 헬퍼: 에러 메시지 추출
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

    // 🟢 의존성 배열에 fetchNotices만 유지하거나, Next.js 모범 사례에 따라 []를 사용합니다.
    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]); 

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
                                        onClick={() => router.push(`/notice/${notice.id}`)}
                                    >
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    padding: "2px 8px",
                                                    borderRadius: "4px",
                                                    // NoticeType을 사용하므로 === "공지"가 타입 안전합니다.
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
                    </Paper>
                )}
            </Box>
        </Layout>
    );
}