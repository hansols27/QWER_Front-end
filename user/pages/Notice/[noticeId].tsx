'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { api } from "@shared/services/axios";
import type { Notice } from "@shared/types/notice";
import styles from "@front/styles/noticedetail.module.css"; 
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';

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
  const noticeId = router.query.noticeId as string | undefined;

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
        <Typography mt={2} color="white">공지사항 상세 정보 로딩 중...</Typography>
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
        
        {/* 1. 헤더: 카테고리, 제목, 날짜 - float 레이아웃에 맞게 p 태그로 구성 */}
        <div className={styles.boardView_header}>
          
          {/* 카테고리: float: left, .cate */}
          <p className={styles.cate}>{noticeDetail.type || '공지'}</p>
          
          {/* 제목: float: left, .tit */}
          <p className={styles.tit}>{noticeDetail.title}</p>
          
          {/* 날짜: float: right, .date */}
          <p className={styles.date}>{formatDate(noticeDetail.createdAt)}</p>
          
          {/* float 해제를 위한 클리어 */}
          <div style={{ clear: 'both' }}></div>
        </div>

        {/* 2. 본문 내용 - .boardView_cont */}
        <div className={styles.boardView_cont}>
          {/* 실제 공지사항 내용은 HTML로 삽입 */}
          <div dangerouslySetInnerHTML={{ __html: noticeDetail.content }} />
        </div>

        {/* 3. 이전/다음 글 영역 - .boardView_next */}
        <div className={styles.boardView_next}>
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

      <div className={`${styles.ntCont} ${styles.notice}`}> 
          <div className="title">NOTICE</div>     
        
        {/* Right Content Area (모듈 CSS 유지) */}
        <div className={styles.n_right}>
          {mainContent}
        </div>
      </div>
    </div>
  );
}