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
import { VideoItem } from "@shared/types/video";

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function VideoList() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const router = useRouter();

  // 1. 데이터 로드 (GET)
  useEffect(() => {
    const fetchVideoItems = async () => {
      if (!API_BASE_URL) {
        setLoading(false);
        setAlertMessage({ message: "API 주소가 설정되지 않아 영상을 불러올 수 없습니다.", severity: "error" });
        return;
      }
      
      setLoading(true);
      setAlertMessage(null);

      try {
        const res = await axios.get<{ success: boolean; data: VideoItem[] }>(`${API_BASE_URL}/api/video`);
        setItems(res.data.data);
      } catch (err) {
        console.error("영상 목록 로드 실패:", err);
        setAlertMessage({ message: "영상 목록 로드에 실패했습니다. 백엔드 연결을 확인하세요.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchVideoItems();
  }, []);

  // 유튜브 썸네일 URL 생성 함수
  const getThumbnail = (url: string) => {
    let videoId = '';
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);

    if (match) {
        videoId = match[1];
    } else {
        videoId = url.split("v=")[1]?.split("&")[0] ?? '';
    }

    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
  };

  const handleCreateClick = () => {
    router.push("/video/create");
  };
  
  const handleItemClick = (itemId: string | number) => {
    // ⭐️ 수정: item.id가 number일 수 있으므로 명시적으로 문자열로 변환
    router.push(`/video/${String(itemId)}`); 
  };

  return (
    <Layout>
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h4">영상 관리</Typography>
          <Button 
            variant="contained" 
            onClick={handleCreateClick}
            disabled={loading || !API_BASE_URL}
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
            <Typography ml={2}>영상 로딩 중...</Typography>
          </Box>
        )}
        
        {!loading && items.length === 0 && !alertMessage && (
            <Typography variant="body1" color="textSecondary" align="center" py={4}>
                등록된 영상이 없습니다.
            </Typography>
        )}

        {/* Grid container: 원본 타입 캐스팅 유지 */}
        <Grid container spacing={4} {...({} as any)}> 
          {items.map((item) => (
            <Grid 
              item 
              xs={6} 
              sm={4} 
              md={3} 
              // ⭐️ 수정: item.id가 number일 수 있으므로 String()으로 변환
              key={String(item.id)} 
              {...({} as any)} 
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
                  image={getThumbnail(item.src) || 'https://via.placeholder.com/200x200?text=No+Thumbnail'} 
                  alt={item.title}
                  sx={{ objectFit: 'cover' }}
                />
                <Box p={1}>
                    <Typography variant="subtitle1" noWrap>{item.title}</Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
}