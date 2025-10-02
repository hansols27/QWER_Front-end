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

// 환경 변수에서 API URL을 가져옵니다. (Next.js 빌드 환경에서 자동으로 주입됨)
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!NEXT_PUBLIC_API_URL) {
  console.error("API_BASE_URL 환경 변수가 설정되지 않았습니다. API 호출이 실패할 수 있습니다.");
}

const DEFAULT_SNS_IDS: SnsLink["id"][] = ["instagram", "youtube", "twitter", "cafe", "shop"];

const SettingsPage = () => {
  const [snsLinks, setSnsLinks] = useState<SnsLink[]>(DEFAULT_SNS_IDS.map(id => ({ id, url: "" })));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  // 성공 메시지 또는 실패 메시지를 담을 상태
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  /**
   * 컴포넌트 로드 시 현재 설정을 백엔드에서 불러옵니다.
   */
  useEffect(() => {
    const fetchSettings = async () => {
      // API URL이 설정되지 않았다면 로드 시도 중지
      if (!NEXT_PUBLIC_API_URL) {
        setAlertMessage({ message: "API URL이 없어 설정을 로드할 수 없습니다.", severity: "error" });
        return;
      }
      
      setLoading(true);
      setAlertMessage(null);
      try {
        // 백엔드에서 GET 요청으로 현재 설정 데이터를 불러옵니다.
        const res = await axios.get<{ success: boolean; data: SettingsData }>(`${NEXT_PUBLIC_API_URL}/api/settings`);
        const data = res.data.data;
        
        // 메인 이미지 URL과 SNS 링크를 상태에 저장합니다.
        setMainImageUrl(data.mainImage || "");
        setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      } catch (err) {
        console.error("Failed to load settings:", err);
        setAlertMessage({ message: "설정 로드에 실패했습니다.", severity: "error" });
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
   * 설정을 백엔드에 저장하는 함수 (POST 요청).
   */
  const saveSettings = async () => {
    if (!NEXT_PUBLIC_API_URL) {
      setAlertMessage({ message: "API 설정이 없어 저장할 수 없습니다.", severity: "error" });
      return;
    }

    setLoading(true);
    setAlertMessage(null);
    try {
      const formData = new FormData();
      // 1. 이미지 파일 추가 (선택 사항)
      if (imageFile) {
        formData.append("image", imageFile);
      }
      // 2. SNS 링크 데이터 추가 (JSON 문자열로 변환하여 전송)
      // 백엔드는 이 문자열을 파싱하여 데이터베이스에 저장해야 합니다.
      formData.append("snsLinks", JSON.stringify(snsLinks.filter(l => l.url))); // URL이 있는 링크만 저장

      // 백엔드 API에 POST 요청으로 설정 데이터를 저장합니다.
      const res = await axios.post<{ success: boolean; data: SettingsData }>(
        `${NEXT_PUBLIC_API_URL}/api/settings`, 
        formData, 
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const data = res.data.data;
      setMainImageUrl(data.mainImage || "");
      // 저장 후 최신 데이터로 SNS 링크 상태를 업데이트합니다.
      setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      setImageFile(null); // 파일 전송 완료 후 초기화
      setAlertMessage({ message: "설정이 성공적으로 저장되었습니다!", severity: "success" });

    } catch (err) {
      console.error("Failed to save settings:", err);
      setAlertMessage({ message: "설정 저장에 실패했습니다. 백엔드 또는 네트워크 상태를 확인하세요.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

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
              
              {/* 현재 서버에 저장된 이미지 미리보기 */}
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
                  label={link.id.charAt(0).toUpperCase() + link.id.slice(1)} // Instagram, Youtube 등
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
          disabled={loading || !NEXT_PUBLIC_API_URL}
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
