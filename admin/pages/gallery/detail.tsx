"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { 
  Box, 
  Button, 
  Stack, 
  Typography, 
  Alert, 
  CircularProgress,
  CardMedia, 
} from "@mui/material";
import type { GalleryItem } from "@shared/types/gallery"; 

// 환경 변수를 사용하여 API 기본 URL 설정
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function GalleryDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [item, setItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true); 
  const [isProcessing, setIsProcessing] = useState(false); // 처리 중 (삭제/교체) 상태
  const [newFile, setNewFile] = useState<File | null>(null); // ⭐️ 교체할 새 파일
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  // 1. 데이터 로드 (GET)
  useEffect(() => {
    if (!id || !NEXT_PUBLIC_API_URL) {
      if (!id) setLoading(false);
      if (!NEXT_PUBLIC_API_URL) setAlertMessage({ message: "API 주소가 설정되지 않았습니다.", severity: "error" });
      return;
    }

    const fetchGalleryItem = async () => {
      setLoading(true);
      setAlertMessage(null);
      try {
        const res = await axios.get<{ success: boolean; data: GalleryItem }>(`${NEXT_PUBLIC_API_URL}/api/gallery/${id}`);
        setItem(res.data.data);
      } catch (err) {
        console.error("갤러리 아이템 로드 실패:", err);
        setAlertMessage({ message: "갤러리 정보를 불러오는 데 실패했습니다.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchGalleryItem();
  }, [id]);
  
  // 2. 파일 변경 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setNewFile(e.target.files[0]);
    }
  };
  
  // 3. 이미지 교체/수정 (PUT) 핸들러
  const handleReplace = async () => {
    if (!item || !NEXT_PUBLIC_API_URL || !newFile) {
        setAlertMessage({ message: "교체할 새 이미지를 먼저 선택해주세요.", severity: "error" });
        return;
    }
    
    if (!window.confirm("이 이미지를 새 이미지로 교체하시겠습니까?")) return;

    setIsProcessing(true);
    setAlertMessage(null);

    try {
      const formData = new FormData();
      formData.append("image", newFile); 
      
      // ⭐️ PUT 요청으로 기존 아이템을 업데이트합니다.
      await axios.put(`${NEXT_PUBLIC_API_URL}/api/gallery/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setAlertMessage({ message: "이미지가 성공적으로 교체되었습니다! 목록으로 이동합니다.", severity: "success" });
      
      // 성공 후 목록 페이지로 이동
      setTimeout(() => router.push("/gallery"), 1000); 

    } catch (err) {
      console.error("이미지 교체 요청 실패:", err);
      setAlertMessage({ message: "이미지 교체에 실패했습니다. 서버 연결을 확인하세요.", severity: "error" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 4. 삭제 (DELETE) 핸들러
  const handleDelete = async () => {
    if (!id || !NEXT_PUBLIC_API_URL) return;
    
    if (!window.confirm("정말로 이 이미지를 갤러리에서 삭제하시겠습니까? (이 작업은 취소할 수 없습니다)")) return;

    setIsProcessing(true);
    setAlertMessage(null);

    try {
      // ⭐️ DELETE 요청
      await axios.delete(`${NEXT_PUBLIC_API_URL}/api/gallery/${id}`);
      
      setAlertMessage({ message: "이미지가 성공적으로 삭제되었습니다! 목록으로 이동합니다.", severity: "success" });
      
      // 삭제 성공 후 목록 페이지로 이동
      setTimeout(() => router.push("/gallery"), 1000); 

    } catch (err) {
      console.error("갤러리 삭제 요청 실패:", err);
      setAlertMessage({ message: "이미지 삭제에 실패했습니다.", severity: "error" });
    } finally {
      setIsProcessing(false);
    }
  };


  if (!id) return <Layout><Box p={4}><Typography color="error">잘못된 접근입니다. 이미지 ID가 필요합니다.</Typography></Box></Layout>;
  
  if (loading || !item) return (
    <Layout>
      <Box display="flex" justifyContent="center" py={8}><CircularProgress /><Typography ml={2}>이미지 로딩 중...</Typography></Box>
    </Layout>
  );

  // 로딩 완료 후 렌더링
  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2}>갤러리 상세</Typography>
        
        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}
        
        <Stack spacing={4}>
          <Box>
            <Typography variant="h6" gutterBottom>미리보기</Typography>
            <CardMedia
                component="img"
                sx={{ maxHeight: 400, width: 'auto', borderRadius: 1, objectFit: 'contain' }} 
                // ⭐️ 새 파일이 선택되면 그것을 보여줍니다.
                image={newFile ? URL.createObjectURL(newFile) : item.url}
                alt={`Gallery image ${item.id}`}
            />
             <Typography variant="caption" color="textSecondary">
                {newFile ? `새 파일 미리보기: ${newFile.name}` : `기존 파일 (업로드 시각: ${new Date(item.createdAt).toLocaleString()})`}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>등록</Typography>
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                disabled={isProcessing}
            />
            {newFile && (
                <Typography variant="body2" color="primary" mt={1}>
                    **새 이미지가 선택되었습니다.** 아래 '이미지 교체' 버튼을 눌러 적용하세요.
                </Typography>
            )}
            
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleReplace} 
                disabled={isProcessing || !newFile || !NEXT_PUBLIC_API_URL}
                sx={{ mt: 2 }}
                startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
            >
              {isProcessing && newFile ? "교체 중..." : "이미지 교체"}
            </Button>
          </Box>


          {/* 삭제 버튼 */}
          <Box mt={4}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDelete} 
              disabled={isProcessing || !NEXT_PUBLIC_API_URL}
              startIcon={isProcessing && !newFile && <CircularProgress size={20} color="inherit" />}
            >
              {isProcessing && !newFile ? "삭제 중..." : "이미지 삭제"}
            </Button>
          </Box>
          
          <Button variant="text" onClick={() => router.push("/gallery")}>목록</Button>

        </Stack>
      </Box>
    </Layout>
  );
}