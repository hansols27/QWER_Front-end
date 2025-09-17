// front_end/src/pages/settings.tsx
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
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import StorefrontIcon from "@mui/icons-material/Storefront";
import TiktokIcon from "../components/TiktokIcon";
import { saveSettings } from "../../front_end/src/services/settings";

const Settings = () => {
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [snsLinks, setSnsLinks] = useState({
    instagram: "",
    youtube: "",
    tiktok: "",
    cafe: "",
    shop: "",
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });

  // 이미지 미리보기 메모리 해제
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (preview) URL.revokeObjectURL(preview); // 이전 URL 해제
      setMainImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSnsLinks((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (mainImage) formData.append("mainImage", mainImage);
    Object.entries(snsLinks).forEach(([key, value]) => formData.append(key, value));
    try {
      await saveSettings(formData);
      setSnackbar({ open: true, message: "설정이 저장되었습니다.", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: "저장 중 오류가 발생했습니다.", severity: "error" });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Layout>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          기본 설정
        </Typography>
        <Card sx={{ maxWidth: { xs: "100%", sm: 600 }, mx: "auto" }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                {/* 이미지 업로드 */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    프론트 메인 이미지
                  </Typography>
                  <Button variant="contained" component="label">
                    이미지 업로드
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleImageChange}
                    />
                  </Button>
                  {preview && (
                    <Box mt={2}>
                      <img src={preview} alt="Preview" style={{ width: 250, borderRadius: 8 }} />
                    </Box>
                  )}
                </Box>

                {/* SNS 링크 */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    SNS 링크
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Instagram URL"
                      name="instagram"
                      value={snsLinks.instagram}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><InstagramIcon sx={{ color: "#E1306C" }} /></InputAdornment>
                      }}
                    />
                    <TextField
                      fullWidth
                      label="YouTube URL"
                      name="youtube"
                      value={snsLinks.youtube}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><YouTubeIcon sx={{ color: "#FF0000" }} /></InputAdornment>
                      }}
                    />
                    <TextField
                      fullWidth
                      label="TikTok URL"
                      name="tiktok"
                      value={snsLinks.tiktok}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><TiktokIcon sx={{ fontSize: 28, color: "#000" }} /></InputAdornment>
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Cafe URL"
                      name="cafe"
                      value={snsLinks.cafe}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><LocalCafeIcon sx={{ color: "#6F4E37" }} /></InputAdornment>
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Shop URL"
                      name="shop"
                      value={snsLinks.shop}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><StorefrontIcon sx={{ color: "#0078D7" }} /></InputAdornment>
                      }}
                    />
                  </Stack>
                </Box>

                {/* 저장 버튼 */}
                <Box textAlign="right">
                  <Button variant="contained" color="primary" type="submit">
                    저장하기
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* Snackbar 알림 */}
        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default Settings;
