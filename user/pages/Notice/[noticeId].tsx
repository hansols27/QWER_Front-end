import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // 1. Next.js 라우터 훅 사용
import { api } from "@shared/services/axios";
import type { Notice } from "@shared/types/notice";
import '@front/ui/noticedetail.module.css';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material'; 

// ===========================
// 관리자 코드에서 재사용하는 유틸리티
// ===========================

// 등록일자 포맷 함수
const formatDate = (dateString: string): string => {
    // 입력된 날짜 문자열이 유효한지 확인합니다.
    if (!dateString) return '날짜 미정';
    const date = new Date(dateString);
    // 날짜가 유효하지 않으면 기본 문자열 반환
    if (isNaN(date.getTime())) return '잘못된 날짜';

    // 원하는 포맷(YYYY-MM-DD)으로 변환
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-').slice(0, -1);
};

// 헬퍼: 에러 메시지 추출
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// ===========================
// 컴포넌트 시작 (파일 이름은 [noticeId].tsx가 됩니다)
// ===========================

export default function NoticeDetail() {
    const router = useRouter(); // Next.js 라우터 초기화
    
    // 💡 router.query에서 noticeId 값 추출 (string 또는 string[] 또는 undefined)
    const noticeId = router.query.noticeId as string | undefined; 

    const [noticeDetail, setNoticeDetail] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 상세 데이터 로딩 함수
    const fetchNoticeDetail = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            // API 호출: /api/notice/{noticeId}
            const res = await api.get<{ success: boolean; data: Notice }>(`/api/notice/${id}`);
            setNoticeDetail(res.data.data);
        } catch (err: any) {
            console.error(`공지사항 ID ${id} 로드 실패:`, err);
            setError(extractErrorMessage(err, "공지사항 상세 정보를 불러오는 데 실패했습니다."));
            setNoticeDetail(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 💡 [useRouter] router.isReady가 true일 때만 쿼리 파라미터가 확정됩니다.
        if (router.isReady) {
            if (noticeId) {
                fetchNoticeDetail(noticeId);
            } else {
                setLoading(false);
                setError("잘못된 접근입니다. 공지사항 ID가 누락되었습니다.");
            }
        }
        // 의존성 배열: router.isReady, noticeId
    }, [router.isReady, noticeId]);

    // "목록" 버튼 핸들러
    const handleListClick = () => {
        // 💡 [useNavigate 대체] router.push를 사용하여 공지사항 목록 페이지로 이동
        router.push('/Notice'); 
    };

    // ===========================
    // 렌더링 로직
    // ===========================

    let content;

    if (loading) {
        content = (
            <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                <CircularProgress size={40} />
                <Typography mt={2}>공지사항 상세 정보 로딩 중...</Typography>
            </Box>
        );
    } else if (error) {
        content = (
            <Box py={4} textAlign="center">
                <Alert severity="error">{error}</Alert>
                <Box mt={2}>
                    <Button variant="contained" color="primary" onClick={handleListClick}>
                        목록으로 돌아가기
                    </Button>
                </Box>
            </Box>
        );
    } else if (!noticeDetail) {
        content = (
            <Box py={4} textAlign="center">
                <Alert severity="warning">요청하신 공지사항을 찾을 수 없습니다.</Alert>
                <Box mt={2}>
                    <Button variant="contained" color="primary" onClick={handleListClick}>
                        목록으로 돌아가기
                    </Button>
                </Box>
            </Box>
        );
    } else {
        // 정상 데이터 렌더링
        content = (
            <div className="ndetail-content">
                {/* 제목 영역 */}
                <div className="ndetail-header">
                    <Typography variant="h5" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
                        {noticeDetail.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        등록일: **{formatDate(noticeDetail.createdAt)}**
                    </Typography>
                </div>

                {/* 내용 영역 */}
                <div className="ndetail-body" style={{ minHeight: '300px', padding: '20px 0', borderTop: '1px solid #eee' }}>
                    {/* 💡 HTML 내용을 안전하게 렌더링 */}
                    <div dangerouslySetInnerHTML={{ __html: noticeDetail.content }} />
                </div>
                
                {/* 하단 버튼 영역 */}
                <Box display="flex" justifyContent="center" mt={4}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleListClick}
                    >
                        목록
                    </Button>
                </Box>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Side 영역 */}
            <div id="side">
                <div className="side2">
                    06
                    <span className="s_line"></span>
                    NOTICE
                </div>
            </div>

            {/* Main Content 영역 */}
            <div className="cont notice-detail-area">
                <div className="n_left">
                    <div className="title n_tt">NOTICE</div>
                </div>
                <div className="n_right">
                    {content}
                </div>
            </div>
        </div>
    );
}