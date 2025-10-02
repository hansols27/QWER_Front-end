"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert, 
  CircularProgress, 
  Stack 
} from "@mui/material";
import { VideoItem } from "@shared/types/video";

// 환경 변수를 사용하여 API 기본 URL 설정
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

// VideoItem의 id가 number일 경우를 대비하여 초기 상태를 설정합니다.
const INITIAL_VIDEO_STATE: VideoItem = {
    id: 0 as any, // ID가 string일 경우를 대비하여 any로 임시 설정
    title: "",
    src: "",
    createdAt: "",
};


export default function VideoDetail() {
  const params = useParams();
  const id = params?.id as string; // URL 파라미터는 항상 string
  const router = useRouter();

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [title, setTitle] = useState("");
  const [src, setSrc] = useState("");
  const [loading, setLoading] = useState(true); // ⭐️ 로딩 상태
  const [isProcessing, setIsProcessing] = useState(false); // ⭐️ 수정/삭제 처리 중 상태
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null); // ⭐️ 알림 상태

  // 1. 데이터 로드 (GET)
  useEffect(() => {
    if (!id || !NEXT_PUBLIC_API_URL) {
        if (!id) setLoading(false);
        if (!NEXT_PUBLIC_API_URL) setAlertMessage({ message: "API 주소가 설정되지 않았습니다.", severity: "error" });
        return;
    }

    const fetchVideo = async () => {
        setLoading(true);
        setAlertMessage(null);
        try {
            // ⭐️ 절대 경로 사용
            const res = await axios.get<{ success: boolean; data: VideoItem }>(`${process.env.NEXT_PUBLIC_API_URL}/api/video/${id}`);
            const fetchedVideo = res.data.data;

            setVideo(fetchedVideo);
            setTitle(fetchedVideo.title);
            setSrc(fetchedVideo.src);
        } catch (err) {
            console.error("영상 상세 로드 실패:", err);
            setAlertMessage({ message: "영상 정보를 불러오는 데 실패했습니다.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };
    fetchVideo();
  }, [id]);

  // 썸네일 URL 생성 함수 (Create/List와 동일하게 개선)
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

  // 2. 수정 (PUT) 핸들러
  const handleUpdate = async () => {
    if (!video || !NEXT_PUBLIC_API_URL) return;
    if (!title || !src) {
        setAlertMessage({ message: "제목과 유튜브 링크를 모두 입력해주세요.", severity: "error" });
        return;
    }
    
    setIsProcessing(true);
    setAlertMessage(null);
    
    try {
        // ⭐️ 절대 경로 사용 및 video.id를 string으로 변환
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/video/${String(video.id)}`, { title, src });
        
        setAlertMessage({ message: "영상이 성공적으로 수정되었습니다! 목록으로 이동합니다.", severity: "success" });
        setTimeout(() => router.push("/video"), 1000); 
    } catch (err) {
        console.error("영상 수정 실패:", err);
        setAlertMessage({ message: "영상 수정에 실패했습니다.", severity: "error" });
        setIsProcessing(false);
    }
  };

  // 3. 삭제 (DELETE) 핸들러
  const handleDelete = async () => {
    if (!video || !NEXT_PUBLIC_API_URL) return;
    if (!window.confirm(`"${video.title}" 영상을 정말로 삭제하시겠습니까?`)) return;

    setIsProcessing(true);
    setAlertMessage(null);

    try {
        // ⭐️ 절대 경로 사용 및 video.id를 string으로 변환
        await axios.delete(`${NEXT_PUBLIC_API_URL}/api/video/${String(video.id)}`);
        
        setAlertMessage({ message: "영상이 성공적으로 삭제되었습니다! 목록으로 이동합니다.", severity: "success" });
        setTimeout(() => router.push("/video"), 1000);
    } catch (err) {
        console.error("영상 삭제 실패:", err);
        setAlertMessage({ message: "영상 삭제에 실패했습니다.", severity: "error" });
        setIsProcessing(false);
    }
  };

  // 로딩 중 표시
  if (loading) return (
    <Layout>
      <Box display="flex" justifyContent="center" py={8}><CircularProgress /><Typography ml={2}>영상 로딩 중...</Typography></Box>
    </Layout>
  );

  // 데이터가 없거나 로드 실패 시
  if (!video) return <Layout><Box p={4}><Typography color="error">영상을 찾을 수 없습니다.</Typography></Box></Layout>;

  const thumbnailUrl = getThumbnail(src);

  // 렌더링
  return (
    <Layout>
        <Box p={4}>
            <Typography variant="h4" mb={2}>영상 상세/수정</Typography>

            {alertMessage && (
                <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                    {alertMessage.message}
                </Alert>
            )}

            <Stack spacing={3}>
                <TextField 
                    label="제목" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    disabled={isProcessing}
                />
                <TextField 
                    label="유튜브 링크 (URL)" 
                    value={src} 
                    onChange={(e) => setSrc(e.target.value)} 
                    disabled={isProcessing}
                />
                
                {/* 썸네일 미리보기 */}
                {thumbnailUrl ? (
                    <Box mt={1}>
                        <Typography variant="subtitle1" mb={1}>미리보기</Typography>
                        <img 
                            src={thumbnailUrl} 
                            alt="썸네일 미리보기" 
                            width="320" 
                            style={{ borderRadius: 4, display: 'block' }}
                        />
                    </Box>
                ) : src && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        유효한 유튜브 링크가 아닌 것 같습니다. 썸네일을 불러올 수 없습니다.
                    </Alert>
                )}

                <Box display="flex" gap={2} mt={3}>
                    <Button 
                        variant="contained" 
                        onClick={handleUpdate}
                        disabled={isProcessing || !title || !src}
                        startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                    >
                        {isProcessing ? "수정 중..." : "수정"}
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={handleDelete}
                        disabled={isProcessing}
                    >
                        삭제
                    </Button>
                </Box>
                
                <Button variant="text" onClick={() => router.push("/video")} disabled={isProcessing}>
                    목록
                </Button>
            </Stack>
        </Box>
    </Layout>
  );
}