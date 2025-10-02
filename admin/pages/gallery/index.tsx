"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import type { GalleryItem } from "@shared/types/gallery"; 
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

// 환경 변수를 사용하여 API 기본 URL 설정
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;


export default function GalleryList() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGalleryItems = async () => {
      if (!NEXT_PUBLIC_API_URL) {
        setAlertMessage({ message: "API 주소가 설정되지 않아 갤러리 아이템을 불러올 수 없습니다.", severity: "error" });
        return;
      }
      
      setLoading(true);
      setAlertMessage(null);

      try {
        // ⭐️ 절대 경로 사용
        const res = await axios.get<{ success: boolean; data: GalleryItem[] }>(`${NEXT_PUBLIC_API_URL}/api/gallery`);
        setItems(res.data.data);
      } catch (err) {
        console.error("갤러리 로드 실패:", err);
        setAlertMessage({ message: "갤러리 목록 로드에 실패했습니다. 백엔드 연결을 확인하세요.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchGalleryItems();
  }, []);

  const handleItemClick = (itemId: string) => {
    // 상세/수정 페이지로 이동
    router.push(`/gallery/${itemId}`); 
  };
  
  const handleCreateClick = () => {
    // 등록 페이지로 이동
    router.push("/gallery/create");
  };

  return (
    <Layout>
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h4">갤러리 관리</Typography>
          <Button
            variant="contained"
            onClick={handleCreateClick}
            disabled={loading || !NEXT_PUBLIC_API_URL}
          >
            등록
          </Button>
        </Box>

        {/* 알림 메시지 표시 */}
        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}

        {/* 로딩 중 표시 */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography ml={2}>갤러리 로딩 중...</Typography>
          </Box>
        )}
        
        {/* 데이터 없음 표시 */}
        {!loading && items.length === 0 && !alertMessage && (
            <Typography variant="body1" color="textSecondary" align="center" py={4}>
                등록된 갤러리 이미지가 없습니다.
            </Typography>
        )}

        {/* Grid 컨테이너/아이템 사용 (원본 타입 캐스팅 유지) */}
        <Grid container spacing={4} {...({} as any)}> 
          {items.map((item) => (
            <Grid 
              item 
              xs={6} 
              sm={4} 
              md={3} 
              key={item.id} 
              {...({} as any)} // 원본 코드 유지
            >
              <Card
                onClick={() => handleItemClick(item.id)}
                sx={{ 
                    cursor: "pointer", 
                    transition: "transform 0.2s", 
                    "&:hover": { transform: "scale(1.02)" }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={item.url || 'https://via.placeholder.com/200?text=No+Image'} 
                  alt={`Gallery item ${item.id}`}
                  sx={{ objectFit: 'cover' }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
}