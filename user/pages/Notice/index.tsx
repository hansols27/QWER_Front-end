'use client';

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { api } from "@shared/services/axios";
import type { Notice } from "@shared/types/notice";
import btn_prev from "@front/assets/icons/bg-btn-prev.png";
import btn_next from "@front/assets/icons/bg-btn-next.png";
import styles from "@front/styles/notice.module.css";

// ===========================
// 타입 정의
// ===========================
interface NoticeListResponse {
  success: boolean;
  data: Notice[];
}

type AlertSeverity = "success" | "error" | "info" | "warning";

// ===========================
// 유틸 함수
// ===========================
const formatDate = (dateString: string): string => {
  if (!dateString) return "날짜 미정";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "잘못된 날짜";
  return date
    .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\./g, "-")
    .slice(0, -1);
};

const extractErrorMessage = (error: any, defaultMsg: string): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return defaultMsg;
};

// ===========================
// 컴포넌트
// ===========================
export default function Notice() {
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

  const itemsPerPage = 10;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(allNotices.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentNotices = allNotices.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setAlertMessage(null);
    setPage(1);

    try {
      const res = await api.get<NoticeListResponse>("/api/notice");
      const sortedNotices = res.data.data.sort((a, b) => b.id.localeCompare(a.id));
      setAllNotices(sortedNotices);

      if (res.data.data.length === 0) {
        setAlertMessage({ message: "등록된 공지사항이 없습니다.", severity: "info" });
      }
    } catch (err: any) {
      console.error("공지사항 목록 로드 실패:", err);
      const errorMsg = extractErrorMessage(err, "공지사항 목록 로드에 실패했습니다.");
      setAlertMessage({ message: errorMsg, severity: "error" });
      setAllNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  return (
    <div className={styles.container}>
      {/* Side */}
      <div id="side" className={styles.side}>
        <div className={styles.side2}>
          06
          <span className={styles.s_line}></span>
          NOTICE
        </div>
      </div>

      {/* Main */}
      <div className={`${styles.cont} ${styles.notice}`}>
        {/* Left */}
        <div className={styles.n_left}>
          <div className={`${styles.title} ${styles.n_tt}`}>NOTICE</div>
        </div>

        {/* Right */}
        <div className={styles.n_right}>
          {alertMessage && (
            <Box py={2}>
              <Alert severity={alertMessage.severity}>{alertMessage.message}</Alert>
            </Box>
          )}

          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
              <CircularProgress size={30} />
              <Typography mt={2}>공지사항을 불러오는 중...</Typography>
            </Box>
          )}

          {!loading && allNotices.length > 0 && (
            <>
              {/* Notice List */}
              <div className={styles.noticeList}>
                <ul>
                  {currentNotices.map((noticeItem) => (
                    <li key={noticeItem.id}>
                      <Link href={`/notice/${noticeItem.id}`} className={styles['notice-item-link']}>
                        <p className={styles.cate}>{noticeItem.type}</p>
                        <p className={styles.nc_in}>
                          <span className={styles.tit}>{noticeItem.title}</span>
                          <span className={styles.date}>{formatDate(noticeItem.createdAt)}</span>
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pagination */}
              <div className={`${styles['page-btn-box']} ${styles.nt_bt}`}>
                <button
                  type="button"
                  className={styles['prev-btn']}
                  onClick={handlePrev}
                  disabled={page === 1}
                >
                  <Image alt="이전" src={btn_prev} width={36} height={36} />
                  이전
                </button>

                <span className={styles['page-number']}>
                  <strong>{page}</strong> / <em>{totalPages}</em>
                </span>

                <button
                  type="button"
                  className={styles['next-btn']}
                  onClick={handleNext}
                  disabled={page >= totalPages}
                >
                  <Image alt="이후" src={btn_next} width={36} height={36} />
                  이후
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
