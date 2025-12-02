'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from "@shared/services/axios";
import type { Notice } from "@shared/types/notice";
import styles from "@front/styles/noticedetail.module.css";
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link'; // 목록 버튼에 Next.js Link 사용을 고려하여 추가

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
  } else if (error || !noticeDetail) {
    const message = error || "요청하신 공지사항을 찾을 수 없습니다.";
    const severity = error ? "error" : "warning";

    content = (
      <Box py={4} textAlign="center">
        <Alert severity={severity}>{message}</Alert>
        <Box mt={2}>
          {/* 목록 이동 버튼 */}
          <Button variant="contained" color="primary" onClick={handleListClick}>
            목록으로 돌아가기
          </Button>
        </Box>
      </Box>
    );
  } else {
    content = (
      // CSS 클래스 적용 시작
      <div className={styles.boardView}>
        {/* 1. 헤더: 카테고리, 제목, 날짜 */}
        <div className={styles.boardView_header}>
          {/* 카테고리 */}
          <p className={styles.cate}>{noticeDetail.type || '공지'}</p>
          
          {/* 제목 */}
          <p className={styles.tit}>{noticeDetail.title}</p>
          
          {/* 날짜 */}
          <p className={styles.date}>{formatDate(noticeDetail.createdAt)}</p>
          
          {/* float 해제를 위한 클리어 */}
          <div style={{ clear: 'both' }}></div>
        </div>

        {/* 2. 본문 내용 */}
        <div className={styles.boardView_cont}>
          {/* 서버에서 받아온 HTML 콘텐츠 삽입 */}
          <div dangerouslySetInnerHTML={{ __html: noticeDetail.content }} />

          {/* 참고: .bd_img, .bd_txt 클래스는 content 내부의 HTML에 포함되어야 함 */}
        </div>

        {/* 3. 목록 버튼 및 다음/이전 글 링크 영역 */}
        {/* .boardView_next 클래스는 보통 다음/이전 글 링크에 사용되나, 여기서는 목록 버튼을 배치 */}
        <div className={styles.boardView_next}>
          <Box display="flex" justifyContent="center" width="100%">
            <Button variant="contained" color="primary" onClick={handleListClick}>
              목록
            </Button>
          </Box>
          {/* float 해제를 위한 클리어 */}
          <div style={{ clear: 'both' }}></div>
        </div>
        {/* CSS 클래스 적용 종료 */}
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

      {/* Main 영역: .cont + n_right, n_left 레이아웃 유지 */}
      <div className={`${styles.cont} ${styles['notice-detail-area']}`}>
        <div className={styles.n_left}>
          <div className={styles.n_tt}>NOTICE</div>
        </div>
        <div className={styles.n_right}>
          {content}
        </div>
      </div>
    </div>
  );
}