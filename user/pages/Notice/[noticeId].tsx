'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { api } from "@shared/services/axios";
import type { Notice } from "@shared/types/notice";
import styles from "@front/styles/noticedetail.module.css"; 
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';
// global.css의 클래스는 직접 문자열로 사용합니다.

// ===========================
// 타입 정의 및 유틸 함수 (이전과 동일)
// ===========================

type AlertSeverity = "success" | "error" | "info" | "warning";

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
  const noticeId = router.query.id as string | undefined;

  const [noticeDetail, setNoticeDetail] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNoticeDetail = useCallback(async (id: string) => {
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
  }, []);

  useEffect(() => {
    if (router.isReady) {
      if (noticeId) {
        fetchNoticeDetail(noticeId);
      } else {
        setLoading(false);
        setError("잘못된 접근입니다. 공지사항 ID가 누락되었습니다.");
      }
    }
  }, [router.isReady, noticeId, fetchNoticeDetail]);


  // ===========================
  // 렌더링 - 상세 내용 (mainContent)
  // ===========================
  let mainContent;

  if (loading) {
    mainContent = (
      <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
        <CircularProgress size={40} />
        <Typography mt={2}>공지사항 상세 정보 로딩 중...</Typography>
      </Box>
    );
  } else if (error || !noticeDetail) {
    const message = error || "요청하신 공지사항을 찾을 수 없습니다.";
    const severity = error ? "error" : "warning";

    mainContent = (
      <Box py={4} textAlign="center">
        <Alert severity={severity}>{message}</Alert>
        <Box mt={2}>
          {/* 목록 이동 버튼: global.css의 .btn_list 클래스 사용 */}
          <Link href="/notice" className="btn_list">
            목록으로 돌아가기
          </Link>
        </Box>
      </Box>
    );
  } else {
    // 상세 내용 렌더링
    mainContent = (
      <div className={styles.boardView}>
        {/* 1. 헤더: 카테고리, 제목, 날짜 */}
        <div className={styles.boardView_header}>
          {/* 카테고리: float: left */}
          <p className={styles.cate}>{noticeDetail.type || '공지'}</p>
          
          {/* 제목: float: left, width: 82% */}
          <p className={styles.tit}>{noticeDetail.title}</p>
          
          {/* 날짜: float: right */}
          <p className={styles.date}>{formatDate(noticeDetail.createdAt)}</p>
          
          {/* float 해제를 위한 클리어 */}
          <div style={{ clear: 'both' }}></div>
        </div>

        {/* 2. 본문 내용 */}
        <div className={styles.boardView_cont}>
          <div dangerouslySetInnerHTML={{ __html: noticeDetail.content }} />
        </div>

        {/* 3. boardView_next 영역: 다음/이전 글이 없으므로 빈 상태로 닫습니다. */}
        <div className={styles.boardView_next}>
          {/* 다음/이전 글 영역 */}
          <div style={{ clear: 'both' }}></div>
        </div>

        {/* 4. 목록 버튼 영역: 중앙에 목록 버튼만 배치 */}
        <Box display="flex" justifyContent="center" width="100%" py={5}>
          {/* global.css의 .btn_list 클래스 사용 */}
          <Link href="/notice" className="btn_list">
            목록
          </Link>
        </Box>

      </div>
    );
  }

  return (
    <div className="container"> 
      <div id="side">
        <div className="side2">
          06
          <span className="s_line"></span>
          NOTICE
        </div>
      </div>

      <div className={`${styles.cont} ${styles.notice}`}> 
        {/* Left Title Area (모듈 CSS 유지) */}
        <div className={styles.n_left}>
          <div className={styles.n_tt}>NOTICE</div>
        </div>
        
        {/* Right Content Area (모듈 CSS 유지) */}
        <div className={styles.n_right}>
          {mainContent}
        </div>
      </div>
    </div>
  );
}