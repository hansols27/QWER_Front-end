"use client";

import { useEffect, useState, ChangeEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { 
  Box, 
  Button, 
  TextField, 
  Stack, 
  Typography, 
  Alert, 
  CircularProgress,
  CardMedia, 
} from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

// 환경 변수를 사용하여 API 기본 URL 설정 (백엔드 주소)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // ⭐️ 변수명 통일

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    // Axios 응답 오류 (response.data.message) 확인
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    // 일반적인 Error 객체의 메시지 확인
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return defaultMsg;
};

// Album 타입의 기본값 (로딩 전 초기화용)
const INITIAL_ALBUM_STATE: AlbumItem = {
    id: "",
    title: "",
    date: "",
    description: "",
    tracks: [""], 
    videoUrl: "",
    image: "", 
};

export default function AlbumDetail() {
  const params = useParams();
  // ⭐️ id가 string이 아닐 경우 undefined 처리 (타입스크립트 경고 최소화)
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id; 
  const router = useRouter();

  const [album, setAlbum] = useState<AlbumItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  /**
   * 1. 데이터 로드 (GET)
   */
  const fetchAlbum = useCallback(async () => {
    if (!id || !API_BASE_URL) return;

    setLoading(true);
    setAlertMessage(null);
    try {
      const res = await axios.get<{ success: boolean; data: AlbumItem }>(`${API_BASE_URL}/api/album/${id}`);
      // ⭐️ tracks가 undefined일 경우, UI의 트랙 추가/수정 로직이 즉시 작동하도록 빈 배열로 초기화
      const fetchedAlbum = res.data.data;
      if (!fetchedAlbum.tracks) {
        fetchedAlbum.tracks = [""];
      }
      setAlbum(fetchedAlbum);
    } catch (err: any) { // ⭐️ err: any 명시
      console.error("앨범 상세 로드 실패:", err);
      const errorMsg = extractErrorMessage(err, "앨범 정보를 불러오는 데 실패했습니다.");
      setAlertMessage({ message: errorMsg, severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && API_BASE_URL) {
      fetchAlbum();
    } else if (!id) {
      setLoading(false);
    }
  }, [id, fetchAlbum]);

  /**
   * 2. 수정 (PUT) 핸들러
   */
  const handleUpdate = async () => {
    if (!album || !API_BASE_URL) return;
    
    setIsSaving(true);
    setAlertMessage(null);

    try {
      const formData = new FormData();
      
      // ⭐️ AlbumItem에 정의된 필수/선택 속성들을 널 체크하여 안전하게 추가
      formData.append("title", album.title); // title, date는 필수 가정
      formData.append("date", album.date); 
      formData.append("description", album.description ?? ''); 
      formData.append("videoUrl", album.videoUrl ?? '');
      // existingImage는 기존 이미지를 유지할 때 필요합니다.
      formData.append("existingImage", album.image ?? ''); 
      
      if (coverFile) {
        // 새 파일이 있으면 File 객체를 직접 추가
        formData.append("coverFile", coverFile);
      }
      
      // 트랙 목록 처리 (비어있지 않은 트랙만 필터링)
      const filteredTracks = (album.tracks ?? []).filter(t => t && t.trim() !== "");
      filteredTracks.forEach((track, idx) => {
          // 트랙도 안전하게 널 체크 후 추가
          formData.append(`tracks[${idx}]`, track ?? ''); 
      });

      const res = await axios.put<{ success: boolean; data?: AlbumItem }>(
        `${API_BASE_URL}/api/album/${id}`, 
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        setAlertMessage({ message: "앨범 정보가 성공적으로 수정되었습니다!", severity: "success" });
        setCoverFile(null); 
        if (res.data.data) {
             setAlbum(res.data.data);
        }
      } else {
        setAlertMessage({ message: "수정 실패: 백엔드에서 오류가 발생했습니다.", severity: "error" });
      }

    } catch (err: any) { // ⭐️ err: any 명시
      console.error("앨범 수정 요청 실패:", err);
      const errorMsg = extractErrorMessage(err, "앨범 수정 요청에 실패했습니다.");
      setAlertMessage({ message: errorMsg, severity: "error" });
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * 3. 삭제 (DELETE) 핸들러
   */
  const handleDelete = async () => {
    if (!id || !API_BASE_URL) return;
    
    if (!window.confirm("정말로 이 앨범을 삭제하시겠습니까?")) return;

    setIsSaving(true);
    setAlertMessage(null);

    try {
      await axios.delete(`${API_BASE_URL}/api/album/${id}`);
      
      setAlertMessage({ message: "앨범이 성공적으로 삭제되었습니다!", severity: "success" });
      router.push("/album"); 

    } catch (err: any) { // ⭐️ err: any 명시
      console.error("앨범 삭제 요청 실패:", err);
      const errorMsg = extractErrorMessage(err, "앨범 삭제에 실패했습니다.");
      setAlertMessage({ message: errorMsg, severity: "error" });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 4. 트랙 수정 핸들러
  const handleTrackChange = (index: number, value: string) => {
    if (!album) return;
    // ⭐️ 널 병합 연산자를 사용하여 안전하게 트랙 상태 업데이트
    const newTracks = [...(album.tracks ?? [])]; 
    newTracks[index] = value;
    setAlbum({ ...album, tracks: newTracks });
  };
  
  const addTrack = () => {
    if (!album) return;
    setAlbum({ ...album, tracks: [...(album.tracks ?? []), ""] });
  };
  
  const removeTrack = (index: number) => {
    if (!album) return;
    setAlbum({ ...album, tracks: (album.tracks ?? []).filter((_, i) => i !== index) });
  };
  
  // 5. 파일 변경 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
  };


  if (!id) return <Layout><Box p={4}><Typography color="error">잘못된 접근입니다. 앨범 ID가 필요합니다.</Typography></Box></Layout>;
  
  if (!API_BASE_URL) {
    return (
      <Layout>
        <Box p={4}><Alert severity="error">
          <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
        </Alert></Box>
      </Layout>
    );
  }

  if (loading || !album) return (
    <Layout>
      <Box display="flex" justifyContent="center" py={8}><CircularProgress /><Typography ml={2} sx={{ alignSelf: 'center' }}>앨범 로딩 중...</Typography></Box>
    </Layout>
  );

  // 로딩 완료 후 렌더링
  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2} fontWeight="bold">앨범 "{album.title}" 수정</Typography>
        
        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}
        
        <Stack spacing={3}>
          {/* 기타 입력 필드 */}
          <TextField
            label="타이틀"
            value={album.title}
            onChange={(e) => setAlbum({ ...album, title: e.target.value })}
            disabled={isSaving}
            required
          />
          <TextField
            label="발매일"
            type="date"
            value={album.date}
            onChange={(e) => setAlbum({ ...album, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            disabled={isSaving}
            required
          />
          <TextField 
            label="설명" 
            multiline minRows={3} 
            value={album.description ?? ''} // 널값 처리
            onChange={e => setAlbum({ ...album, description: e.target.value })} 
            disabled={isSaving}
          />
          <TextField 
            label="유튜브 링크" 
            value={album.videoUrl ?? ''} // 널값 처리
            onChange={e => setAlbum({ ...album, videoUrl: e.target.value })} 
            disabled={isSaving}
          />

          {/* 현재 커버 이미지 미리보기 및 파일 선택 */}
          <Typography variant="h6" mt={2} fontWeight="bold">커버 이미지</Typography>
          {(coverFile || album.image) && (
            <Box mb={2}>
                <CardMedia
                    component="img"
                    height="150"
                    // ⭐️ 이미지 URL이 없을 경우 대비
                    image={coverFile ? URL.createObjectURL(coverFile) : album.image || 'https://via.placeholder.com/150?text=No+Image'}
                    alt={`${album.title} Cover`}
                    sx={{ width: 150, objectFit: 'cover', borderRadius: 1 }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                    {coverFile ? `새 파일: ${coverFile.name}` : album.image ? `기존 파일 사용 중` : `이미지 없음`}
                </Typography>
            </Box>
          )}

          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isSaving}
          />
          <Typography variant="body2" color="primary">새 이미지를 선택하면 기존 이미지를 대체합니다.</Typography>
          
          {/* 트랙 목록 */}
          <Typography variant="h6" mt={2} fontWeight="bold">트랙 목록</Typography>
          {(album.tracks ?? []).map((track, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={idx}>
              <TextField
                label={`트랙 ${idx + 1}`}
                value={track ?? ''} // ⭐️ 트랙 항목도 널값 처리
                onChange={e => handleTrackChange(idx, e.target.value)}
                fullWidth
                disabled={isSaving}
              />
              {/* length 체크 */}
              {(album.tracks?.length ?? 0) > 1 && (
                <Button onClick={() => removeTrack(idx)} color="error" disabled={isSaving}>삭제</Button>
              )}
            </Stack>
          ))}
          <Button onClick={addTrack} variant="outlined" disabled={isSaving}>트랙 추가</Button>


          {/* 저장 및 삭제 버튼 */}
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleUpdate} 
              // ⭐️ 저장 버튼 비활성화 조건 강화: 필수 필드(title, date)가 비어있는지 확인
              disabled={isSaving || !API_BASE_URL || !album.title || !album.date}
              startIcon={isSaving && <CircularProgress size={20} color="inherit" />}
            >
              {isSaving ? "저장 중..." : "수정 내용 저장"}
            </Button>
            
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleDelete} 
              disabled={isSaving || !API_BASE_URL}
            >
              삭제
            </Button>
          </Box>
          
          <Button variant="text" onClick={() => router.push("/album")}>목록</Button>

        </Stack>
      </Box>
    </Layout>
  );
}