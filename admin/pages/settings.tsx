import { useState, useEffect } from "react";
import Layout from "../components/common/layout"; 
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "axios"; 
import type { SettingsData, SnsLink } from "@shared/types/settings"; 

// Next.js 환경 변수 접근
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// SNS 링크의 기본 ID 목록
const DEFAULT_SNS_IDS: SnsLink["id"][] = ["instagram", "youtube", "twitter", "cafe", "shop"];


// 오류 객체 구조를 런타임에 직접 체크하는 함수
// TypeScript 오류를 일으키지 않도록 'any'를 사용하여 안전하게 속성에 접근합니다.
const getErrorMessage = (error: any): string => {
    // 1. Axios Error 객체인지 런타임 속성으로 확인
    if (error && error.response && error.response.data) {
        // 백엔드에서 보낸 상세 오류 메시지가 있다면 반환
        if (error.response.data.message) {
            return error.response.data.message;
        }
    }
    // 2. 일반적인 Error 객체의 메시지 반환
    if (error && error.message) {
        return error.message;
    }
    // 3. 알 수 없는 오류 메시지
    return "요청 처리 중 알 수 없는 오류가 발생했습니다. 네트워크 상태를 확인하세요.";
};


const SettingsPage = () => {
  // API URL이 설정되지 않았다면 에러 메시지 출력
  if (!API_BASE_URL) {
    return (
      <Layout>
        <Box p={4}><Alert severity="error">
          <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
        </Alert></Box>
      </Layout>
    );
  }

  const [snsLinks, setSnsLinks] = useState<SnsLink[]>(DEFAULT_SNS_IDS.map(id => ({ id, url: "" })));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  /**
   * 컴포넌트 로드 시 현재 설정을 백엔드에서 불러옵니다. (읽기 기능)
   */
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setAlertMessage(null);
      try {
        // 응답 데이터 타입은 SettingsData를 포함하는 구조로 가정합니다.
        const res = await axios.get<{ success: boolean; data: SettingsData }>(`${API_BASE_URL}/api/settings`);
        const data = res.data.data;
        
        setMainImageUrl(data.mainImage || "");
        setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      } catch (err) {
        console.error("Failed to load settings:", err);
        
        // isAxiosError나 AxiosError 타입 없이 안전하게 메시지 추출
        const errorMsg = getErrorMessage(err);
        
        setAlertMessage({ message: errorMsg, severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []); 

  /**
   * SNS 링크 입력 필드가 변경될 때 상태를 업데이트합니다.
   */
  const updateSnsLink = (id: SnsLink["id"], url: string) => {
    setSnsLinks(prev => prev.map(l => (l.id === id ? { ...l, url } : l)));
  };

  /**
   * 설정을 백엔드에 저장하는 함수 (쓰기 기능).
   */
  const saveSettings = async () => {
    setLoading(true);
    setAlertMessage(null);
    try {
      const formData = new FormData();
      
      if (imageFile) {
        formData.append("image", imageFile);
      }
      
      formData.append("snsLinks", JSON.stringify(snsLinks.filter(l => l.url.trim()))); 

      const res = await axios.post<{ success: boolean; data: SettingsData }>(
        `${API_BASE_URL}/api/settings`, 
        formData, 
        {
          headers: { "Content-Type": "multipart/form-data" }, 
        }
      );

      const data = res.data.data;
      setMainImageUrl(data.mainImage || "");
      setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      setImageFile(null);
      setAlertMessage({ message: "설정이 성공적으로 저장되었습니다!", severity: "success" });

    } catch (err) {
      console.error("Failed to save settings:", err);
      
      // isAxiosError나 AxiosError 타입 없이 안전하게 메시지 추출
      const errorMsg = getErrorMessage(err);
      
      setAlertMessage({ message: errorMsg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- UI 부분은 이전과 동일합니다 ---
  return (
    <Layout>
      <Box p={4} maxWidth="800px" margin="0 auto">
        <Typography variant="h4" mb={2} fontWeight="bold">
          기본 설정
        </Typography>

        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 3 }}>
            {alertMessage.message}
          </Alert>
        )}

        {/* Main Image */}
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>메인 이미지 설정</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
              <Box>
                <Button variant="contained" component="label" color="primary">
                  이미지 선택 ({imageFile ? imageFile.name : '미선택'})
                  <input 
                    type="file" 
                    hidden 
                    accept="image/*"
                    onChange={e => e.target.files && setImageFile(e.target.files[0])} 
                  />
                </Button>
                {imageFile && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      저장 버튼을 눌러야 업로드됩니다.
                    </Typography>
                )}
              </Box>
              
              {(mainImageUrl || imageFile) && (
                <Box>
                  <Typography variant="caption" display="block" mb={1}>미리보기</Typography>
                  <img 
                    src={imageFile ? URL.createObjectURL(imageFile) : mainImageUrl} 
                    alt="Main Banner" 
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }} 
                  />
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* SNS Links */}
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>SNS 링크 설정</Typography>
            <Stack spacing={3}>
              {snsLinks.map(link => (
                <TextField
                  key={link.id}
                  label={link.id.charAt(0).toUpperCase() + link.id.slice(1)} 
                  value={link.url}
                  onChange={e => updateSnsLink(link.id, e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder={`예: https://www.${link.id}.com/my_page (URL 전체 입력)`}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <Button 
          variant="contained" 
          color="success"
          size="large"
          onClick={saveSettings} 
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
          sx={{ py: 1.5, px: 4, borderRadius: 2 }}
        >
          {loading ? "설정 저장 중..." : "모든 설정 저장"}
        </Button>

      </Box>
    </Layout>
  );
};

export default SettingsPage;