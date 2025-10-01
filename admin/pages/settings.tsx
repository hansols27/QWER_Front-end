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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// API 경로가 설정되지 않았을 경우, 사용자에게 알려줍니다. (로컬 환경 테스트 시 유용)
if (!API_BASE_URL) {
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

  // 현재 설정을 불러오는 함수
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setAlertMessage(null);
      try {
        // ⭐️ 절대 경로 사용
        const res = await axios.get<{ success: boolean; data: SettingsData }>(`${API_BASE_URL}/api/settings`);
        const data = res.data.data;
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

  const updateSnsLink = (id: SnsLink["id"], url: string) => {
    setSnsLinks(prev => prev.map(l => (l.id === id ? { ...l, url } : l)));
  };

  // 설정을 저장하는 함수
  const saveSettings = async () => {
    setLoading(true);
    setAlertMessage(null);
    try {
      const formData = new FormData();
      if (imageFile) formData.append("image", imageFile);
      // SNS 링크 데이터를 JSON 문자열로 변환하여 FormData에 추가
      formData.append("snsLinks", JSON.stringify(snsLinks));

      // ⭐️ 절대 경로 사용
      const res = await axios.post<{ success: boolean; data: SettingsData }>(
        `${API_BASE_URL}/api/settings`, 
        formData, 
        {
          // 파일을 포함한 데이터를 전송할 때 필수 헤더
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const data = res.data.data;
      setMainImageUrl(data.mainImage || "");
      // 저장 후에도 현재 설정된 데이터로 UI 업데이트
      setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      setImageFile(null); // 파일 전송 완료 후 초기화
      setAlertMessage({ message: "설정이 성공적으로 저장되었습니다!", severity: "success" });

    } catch (err) {
      console.error("Failed to save settings:", err);
      // 백엔드에서 반환된 구체적인 오류 메시지가 있다면 표시하도록 개선 가능
      setAlertMessage({ message: "설정 저장에 실패했습니다. 백엔드 로그를 확인하세요.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2}>
          기본 설정
        </Typography>

        {/* ⭐️ 알림 메시지 상태 사용 */}
        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}

        {/* Main Image */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>메인 이미지</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label">
                업로드{imageFile ? ` (${imageFile.name})` : ''}
                <input 
                  type="file" 
                  hidden 
                  accept="image/*" // 이미지 파일만 허용
                  onChange={e => e.target.files && setImageFile(e.target.files[0])} 
                />
              </Button>
              {/* 현재 서버에 저장된 이미지 또는 새로 업로드될 이미지 미리보기 */}
              {mainImageUrl && !imageFile && (
                <img src={mainImageUrl} alt="main" width={100} style={{ maxHeight: '100px', objectFit: 'cover' }} />
              )}
               {imageFile && (
                <Typography variant="body2" color="primary">
                    새 이미지 선택됨: {imageFile.name}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* SNS Links */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>SNS 링크</Typography>
            <Stack spacing={2}>
              {snsLinks.map(link => (
                <TextField
                  key={link.id}
                  label={link.id.charAt(0).toUpperCase() + link.id.slice(1)} // 첫 글자 대문자
                  value={link.url}
                  onChange={e => updateSnsLink(link.id, e.target.value)}
                  fullWidth
                  placeholder={`예: https://www.${link.id}.com/my_page`}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* ⭐️ 로딩 중일 때 버튼 비활성화 및 텍스트 변경 */}
        <Button 
          variant="contained" 
          onClick={saveSettings} 
          disabled={loading || !API_BASE_URL} // API URL이 없거나 로딩 중일 때 비활성화
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "저장 중..." : "저장"}
        </Button>

      </Box>
    </Layout>
  );
};

export default SettingsPage;