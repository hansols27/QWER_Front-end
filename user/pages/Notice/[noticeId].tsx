'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from "@shared/services/axios";
import type { Notice } from "@shared/types/notice";
import styles from "@front/styles/noticedetail.module.css";
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';

// ===========================
// 유틸 함수
// ===========================
const formatDate = (dateString: string): string => {
  if (!dateString) return '날짜 미정';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '잘못된 날짜';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-').slice(0, -1);
};

const extractErrorMessage = (error: any, defaultMsg: string): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return defaultMsg;
};

// ===========================
// 컴포넌트
// ===========================
export default function NoticeDetail() {
  const router = useRouter();
  const noticeId = router.query.noticeId as string | undefined;

  const [noticeDetail, setNoticeDetail] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNoticeDetail = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
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
    if (router.isReady) {
      if (noticeId) {
        fetchNoticeDetail(noticeId);
      } else {
        setLoading(false);
        setError("잘못된 접근입니다. 공지사항 ID가 누락되었습니다.");
      }
    }
  }, [router.isReady, noticeId]);

  const handleListClick = () => {
    router.push('/notice');
  };

  // ===========================
  // 렌더링
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
    content = (
      <div className={styles['ndetail-content']}>
        <div className={styles['ndetail-header']}>
          <Typography variant="h5" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
            {noticeDetail.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            등록일: {formatDate(noticeDetail.createdAt)}
          </Typography>
        </div>

        <div className={styles['ndetail-body']} style={{ minHeight: '300px', padding: '20px 0', borderTop: '1px solid #eee' }}>
          <div dangerouslySetInnerHTML={{ __html: noticeDetail.content }} />
        </div>

        <Box display="flex" justifyContent="center" mt={4}>
          <Button variant="contained" color="primary" onClick={handleListClick}>
            목록
          </Button>
        </Box>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div id="side" className={styles.side}>
        <div className={styles.side2}>
          06
          <span className={styles.s_line}></span>
          NOTICE
        </div>
      </div>

      <div className={`${styles.cont} ${styles['notice-detail-area']}`}>
        <div className={styles.n_left}>
          <div className={`${styles.title} ${styles.n_tt}`}>NOTICE</div>
        </div>
        <div className={styles.n_right}>
          {content}
        </div>
      </div>
    </div>
  );
}
