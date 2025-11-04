"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/axios"; // ✅ axios 대신 공용 api 인스턴스 사용
import Layout from "../../components/common/layout";
import {
  Box,
  Button,
  Card,
  CardMedia,
  Typography,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
  if (
    error &&
    error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    error.response.data.message
  ) {
    return error.response.data.message;
  }
  if (error && typeof error === "object" && error.message) {
    return error.message;
  }
  return defaultMsg;
};

export default function AlbumList() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const router = useRouter();

  /**
   * 앨범 목록 불러오기
   */
  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setAlertMessage(null);

    try {
      const res = await api.get<{ success: boolean; data: AlbumItem[] }>(
        "/api/album"
      );
      setAlbums(res.data.data);
    } catch (err: any) {
      console.error("앨범 로드 실패:", err);
      const errorMsg = extractErrorMessage(
        err,
        "앨범 목록 로드에 실패했습니다. 백엔드 연결 상태를 확인하세요."
      );
      setAlertMessage({ message: errorMsg, severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // 앨범 상세로 이동
  const handleAlbumClick = (albumId: string) => {
    router.push(`/album/${albumId}`);
  };

  // 앨범 생성 페이지로 이동
  const handleCreateClick = () => {
    router.push("/album/create");
  };

  return (
    <Layout>
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            앨범 관리
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateClick}
            disabled={loading}
          >
            앨범 등록
          </Button>
        </Box>

        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography ml={2} sx={{ alignSelf: "center" }}>
              앨범 로딩 중...
            </Typography>
          </Box>
        )}

        {!loading && albums.length === 0 && !alertMessage && (
          <Typography
            variant="body1"
            color="textSecondary"
            align="center"
            py={4}
          >
            등록된 앨범이 없습니다. '앨범 등록' 버튼을 눌러 새 앨범을 추가하세요.
          </Typography>
        )}

        {/* Grid 타입 충돌 방지 */}
        <Grid container spacing={4} {...({} as any)}>
          {albums.map((album) => (
            <Grid item xs={6} sm={4} md={3} key={album.id} {...({} as any)}>
              <Card
                onClick={() => handleAlbumClick(album.id)}
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
                  height: "100%",
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={
                    album.image ||
                    "https://via.placeholder.com/300x300?text=No+Image"
                  }
                  alt={album.title}
                />
                <Box p={1}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {album.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {album.date || "날짜 미정"}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
}
