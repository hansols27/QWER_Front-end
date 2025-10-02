"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { 
  Box, 
  Button, 
  TextField, 
  Typography,
  Alert, 
  CircularProgress 
} from "@mui/material";
import { VideoItem } from "@shared/types/video";

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function VideoCreate() {
  const [title, setTitle] = useState("");
  const [src, setSrc] = useState(""); // 유튜브 링크
  const [loading, setLoading] = useState(false); // ⭐️ 로딩 상태
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null); // ⭐️ 알림 메시지 상태
  const router = useRouter();

  // 유튜브 썸네일 URL 생성 함수 (VideoList.tsx와 동일하게 개선)
  const getThumbnail = (url: string) => {
    let videoId = '';
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);

    if (match) {
        videoId = match[1];
    } else {
        videoId = url.split("v=")[1]?.split("&")[0] ?? '';
    }

    // ID가 추출되지 않으면 빈 문자열 반환
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
  };

  const handleSubmit = async () => {
    setAlertMessage(null);
    if (!API_BASE_URL) {
      setAlertMessage({ message: "API 주소가 설정되지 않아 등록할 수 없습니다.", severity: "error" });
      return;
    }
    if (!title || !src) {
      setAlertMessage({ message: "제목과 유튜브 링크를 모두 입력해주세요.", severity: "error" });
      return;
    }

    setLoading(true);

    try {
      // ⭐️ 절대 경로 사용
      const res = await axios.post<VideoItem>(`${API_BASE_URL}/api/video`, { title, src });
      
      if (res.data.id) {
        setAlertMessage({ message: "영상이 성공적으로 등록되었습니다! 목록으로 이동합니다.", severity: "success" });
        // 등록 후 리스트 페이지로 이동 (1초 대기)
        setTimeout(() => router.push("/video"), 1000); 
      } else {
        setAlertMessage({ message: "등록 실패: 백엔드에서 ID가 반환되지 않았습니다.", severity: "error" });
      }
    } catch (err) {
      console.error("영상 등록 요청 실패:", err);
      setAlertMessage({ message: "영상 등록에 실패했습니다. 서버 연결을 확인하세요.", severity: "error" });
    } finally {
      // 성공 시 router.push가 처리하므로, 실패한 경우에만 로딩 해제
      if (alertMessage?.severity === 'error') {
         setLoading(false);
      }
    }
  };

  const thumbnailUrl = getThumbnail(src);

  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2}>영상 등록</Typography>
        
        {/* ⭐️ 알림 메시지 표시 */}
        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={3}>
          <TextField 
            label="제목" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            disabled={loading}
          />
          <TextField 
            label="유튜브 링크 (URL)" 
            value={src} 
            onChange={(e) => setSrc(e.target.value)} 
            disabled={loading}
          />
          
          {/* 썸네일 미리보기 */}
          {thumbnailUrl && (
            <Box mt={1}>
              <Typography variant="subtitle1" mb={1}>미리보기</Typography>
              <img 
                src={thumbnailUrl} 
                alt="썸네일 미리보기" 
                width="320" 
                style={{ borderRadius: 4, display: 'block' }}
              />
            </Box>
          )}

          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading || !title || !src || !API_BASE_URL} // ⭐️ 필수값 체크 및 API 경로 체크
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
            sx={{ mt: 2 }}
          >
            {loading ? "등록 중..." : "등록"}
          </Button>
          
          <Button variant="text" onClick={() => router.push("/video")} disabled={loading}>
            목록
          </Button>

        </Box>
      </Box>
    </Layout>
  );
}