'use client';

import { useEffect, useState } from "react";
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Notice {
    id: number;
    type: "공지" | "이벤트";
    title: string;
    createdAt?: string;
}

export default function NoticeList() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true); // ⭐️ 로딩 상태 추가
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null); // ⭐️ 알림 상태 추가
    const router = useRouter();

    useEffect(() => {
        if (!API_BASE_URL) {
            setLoading(false);
            setAlertMessage({ message: "API 주소가 설정되지 않아 공지사항을 불러올 수 없습니다.", severity: "error" });
            return;
        }

        const fetchNotices = async () => {
            setLoading(true);
            setAlertMessage(null);
            try {
                // ⭐️ 절대 경로 API 사용
                const res = await axios.get<Notice[]>(`${API_BASE_URL}/api/notice`);
                setNotices(res.data);
            } catch (err) {
                console.error("공지사항 목록 로드 실패:", err);
                setAlertMessage({ message: "공지사항 목록 로드에 실패했습니다. 백엔드 연결을 확인하세요.", severity: "error" });
            } finally {
                setLoading(false);
            }
        };
        fetchNotices();
    }, []);

    const handleRowClick = (id: number) => {
        // 상세/수정 페이지로 이동
        router.push(`/notice/${id}`); 
    };

    return (
        <Layout>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="h4">공지사항 관리</Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => router.push("/notice/create")}
                        disabled={loading || !API_BASE_URL}
                    >
                        등록
                    </Button>
                </Box>
                
                {/* ⭐️ 알림 메시지 표시 */}
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                {/* ⭐️ 로딩 중 표시 */}
                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                        <Typography ml={2}>공지사항 로딩 중...</Typography>
                    </Box>
                )}
                
                {/* ⭐️ 데이터가 없을 때 표시 */}
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
                                    <TableCell sx={{ fontWeight: 'bold' }}>구분</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>제목</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>작성일</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>수정</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {notices.map((notice) => (
                                    <TableRow 
                                        key={notice.id} 
                                        hover
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell 
                                            onClick={() => handleRowClick(notice.id)} 
                                            style={{ cursor: "pointer" }}
                                        >
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
                                        <TableCell 
                                            onClick={() => handleRowClick(notice.id)} 
                                            style={{ cursor: "pointer" }}
                                        >
                                            {notice.title}
                                        </TableCell>
                                        <TableCell 
                                            onClick={() => handleRowClick(notice.id)} 
                                            style={{ cursor: "pointer" }}
                                        >
                                            {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                // ⭐️ 수정 시 경로를 /notice/[id]로 통일
                                                onClick={() => router.push(`/notice/${notice.id}`)}
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