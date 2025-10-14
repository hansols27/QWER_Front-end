'use client';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
console.log("🔧 API_BASE_URL:", process.env.NEXT_PUBLIC_API_URL);
const DEFAULT_SNS_IDS: SnsLink["id"][] = ["instagram", "youtube", "twitter", "cafe", "shop"];

// 안전하게 에러 메시지 추출
const getErrorMessage = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message ?? e.message ?? "요청 처리 중 알 수 없는 오류가 발생했습니다.";
};

interface GetSettingsResponse {
  success: boolean;
  data: SettingsData;
}

interface SaveSettingsResponse {
  success: boolean;
  data: SettingsData;
}

const SettingsPage = () => {
  if (!API_BASE_URL) {
    return (
      <Layout>
        <Box p={4}>
          <Alert severity="error">
            <Typography fontWeight="bold">환경 설정 오류:</Typography> 
            .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
          </Alert>
        </Box>
      </Layout>
    );
  }

  const [snsLinks, setSnsLinks] = useState<SnsLink[]>(DEFAULT_SNS_IDS.map(id => ({ id, url: "" })));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setAlertMessage(null);
      try {
        const res = await axios.get<GetSettingsResponse>(`${API_BASE_URL}/api/settings`);
        const data = res.data.data;
        setMainImageUrl(data.mainImage || "");
        setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      } catch (err) {
        console.error("Failed to load settings:", err);
        setAlertMessage({ message: getErrorMessage(err), severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSnsLink = (id: SnsLink["id"], url: string) => {
    setSnsLinks(prev => prev.map(l => (l.id === id ? { ...l, url } : l)));
  };

  const saveSettings = async () => {
    setLoading(true);
    setAlertMessage(null);
    try {
      const formData = new FormData();
      if (imageFile) formData.append("image", imageFile);
      formData.append("snsLinks", JSON.stringify(snsLinks.filter(l => l.url.trim())));

      const res = await axios.post<SaveSettingsResponse>(
        `${API_BASE_URL}/api/settings`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const data = res.data.data;
      setMainImageUrl(data.mainImage || "");
      setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      setImageFile(null);
      setAlertMessage({ message: "설정이 성공적으로 저장되었습니다!", severity: "success" });
    } catch (err) {
      console.error("Failed to save settings:", err);
      setAlertMessage({ message: getErrorMessage(err), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box p={4} width="100%" marginLeft={0}>
        <Typography variant="h4" mb={2} fontWeight="bold">기본 설정</Typography>

        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 3 }}>
            {alertMessage.message}
          </Alert>
        )}

        {/* Main Image */}
        <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>메인 이미지</Typography>
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
                  placeholder={`예: https://www.${link.id}.com/my_page`}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Button 
          variant="contained" 
          color="success"
          size="large"
          onClick={saveSettings} 
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
          sx={{ py: 1.5, px: 4, borderRadius: 2 }}
        >
          {loading ? "저장 중..." : "저장"}
        </Button>

      </Box>
    </Layout>
  );
};

export default SettingsPage;
