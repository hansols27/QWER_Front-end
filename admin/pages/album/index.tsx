"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { 
  Box, 
  Button, 
  Card, 
  CardMedia, 
  Typography, 
  Grid, 
  Alert, 
  CircularProgress
} from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

// 환경 변수를 사용하여 API 기본 URL 설정 (백엔드 주소)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function AlbumList() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!API_BASE_URL) {
        setAlertMessage({ message: "API 주소가 설정되지 않아 앨범을 불러올 수 없습니다.", severity: "error" });
        return;
      }
      
      setLoading(true);
      setAlertMessage(null);

      try {
        // ⭐️ API 절대 경로 사용 수정
        const res = await axios.get<{ success: boolean; data: AlbumItem[] }>(`${API_BASE_URL}/api/album`);
        setAlbums(res.data.data);
      } catch (err) {
        console.error("앨범 로드 실패:", err);
        setAlertMessage({ message: "앨범 목록 로드에 실패했습니다. 백엔드 연결을 확인하세요.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);
  
  const handleAlbumClick = (albumId: string) => {
    router.push(`/album/${albumId}`); 
  };
  
  const handleCreateClick = () => {
    router.push("/album/create");
  };

  return (
    <Layout>
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h4">앨범 관리</Typography>
          <Button
            variant="contained"
            onClick={handleCreateClick}
            disabled={loading || !API_BASE_URL} // 로딩 및 API 주소 체크
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
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography ml={2}>앨범 로딩 중...</Typography>
          </Box>
        )}
        
        {!loading && albums.length === 0 && !alertMessage && (
            <Typography variant="body1" color="textSecondary" align="center" py={4}>
                등록된 앨범이 없습니다.
            </Typography>
        )}

        {/* ⭐️ container 속성과 타입 캐스팅을 그대로 사용 */}
        <Grid container spacing={2} {...({} as any)}> 
          {albums.map((album) => (
            <Grid 
              item 
              xs={6} 
              sm={4} 
              md={3} 
              key={album.id} 
              {...({} as any)} // 
            >
              <Card
                onClick={() => handleAlbumClick(album.id)}
                sx={{ 
                    cursor: "pointer", 
                    transition: "transform 0.2s", 
                    "&:hover": { transform: "scale(1.02)" }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={album.image || 'https://via.placeholder.com/200?text=No+Image'}
                  alt={album.title}
                />
                <Box p={1}>
                    <Typography variant="subtitle1" noWrap>{album.title}</Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
}