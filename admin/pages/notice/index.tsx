'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
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

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // ⭐️ 변수명 통일

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return defaultMsg;
};

// ⭐️ Alert severity 타입 통일
type AlertSeverity = "success" | "error" | "info";


interface Notice {
    id: number;
    type: "공지" | "이벤트";
    title: string;
    createdAt?: string;
}

export default function NoticeList() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true); 
    // ⭐️ AlertSeverity 타입 사용
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null); 
    const router = useRouter();

    // 1. 데이터 로드 (GET) - ⭐️ useCallback 적용
    const fetchNotices = useCallback(async () => {
        if (!API_BASE_URL) {
            setLoading(false);
            setAlertMessage({ message: "API 주소가 설정되지 않아 공지사항을 불러올 수 없습니다.", severity: "error" });
            return;
        }

        setLoading(true);
        setAlertMessage(null);
        try {
            const res = await axios.get<Notice[]>(`${API_BASE_URL}/api/notice`);
            // 백엔드 응답 형태가 { success: true, data: Notice[] }일 수도 있으므로, 필요 시 확인
            setNotices(res.data); 
        } catch (err: any) { // ⭐️ 상세 오류 추출 적용
            console.error("공지사항 목록 로드 실패:", err);
            const errorMsg = extractErrorMessage(err, "공지사항 목록 로드에 실패했습니다. 백엔드 연결을 확인하세요.");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    const handleRowClick = (id: number) => {
        // 상세/수정 페이지로 이동
        router.push(`/notice/${id}`); 
    };

    // ⭐️ 환경 설정 오류 조기 종료
    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}><Alert severity="error">
                    <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                </Alert></Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    {/* ⭐️ Typography 스타일 일관성 유지 */}
                    <Typography variant="h4" fontWeight="bold">공지사항 관리</Typography> 
                    <Button 
                        variant="contained" 
                        onClick={() => router.push("/notice/create")}
                        disabled={loading} // ⭐️ API_BASE_URL 체크 로직 제거 (이미 위에서 체크)
                    >
                        등록
                    </Button>
                </Box>
                
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                {loading && (
                    <Box display="flex" justifyContent="center" alignItems="center" py={4} flexDirection="column">
                        <CircularProgress />
                        <Typography ml={2} mt={2}>공지사항 로딩 중...</Typography>
                    </Box>
                )}
                
                {!loading && notices.length === 0 && !alertMessage && (
                    <Typography variant="body1" color="textSecondary" align="center" py={4}>
                        등록된 공지사항이 없습니다.
                    </Typography>
                )}

                {!loading && notices.length > 0 && (
                    <Paper>
                        <Table sx={{ minWidth: 650 }} aria-label="공지사항 목록">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>구분</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', width: '60%' }}>제목</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>작성일</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>수정</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {notices.map((notice) => (
                                    <TableRow 
                                        key={notice.id} 
                                        hover
                                        sx={{ 
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            // ⭐️ 커서 스타일 추가
                                            cursor: 'pointer' 
                                        }}
                                        onClick={() => handleRowClick(notice.id)} 
                                    >
                                        <TableCell>
                                            <Box 
                                                component="span" 
                                                sx={{ 
                                                    padding: '2px 8px', 
                                                    borderRadius: '4px', 
                                                    backgroundColor: notice.type === '공지' ? '#e3f2fd' : '#fff3e0',
                                                    color: notice.type === '공지' ? '#1565c0' : '#e65100',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {notice.type}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1" sx={{ fontWeight: '600' }}>
                                                {notice.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                onClick={(e) => {
                                                    // ⭐️ 이벤트 버블링 방지
                                                    e.stopPropagation(); 
                                                    router.push(`/notice/${notice.id}`);
                                                }}
                                            >
                                                수정
                                            </Button>
                                        </TableCell>
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