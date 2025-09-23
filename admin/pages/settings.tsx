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
} from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import StorefrontIcon from "@mui/icons-material/Storefront";
import type { SettingsData } from "@shared/types/settings";

const API_URL = "http://localhost:4000/api/settings";

const Settings = () => {
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [snsLinks, setSnsLinks] = useState({
    instagram: "",
    youtube: "",
    twitter: "",
    cafe: "",
    shop: "",
  });

  // 기존 설정 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL);
        const data: SettingsData = await res.json();
        setSnsLinks(
          Object.fromEntries(
            data.snsLinks.map((l) => [l.id, l.url])
          ) as typeof snsLinks
        );
        setPreview(data.mainImage || null);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // 이미지 선택
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // SNS 입력
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSnsLinks((prev) => ({ ...prev, [name]: value }));
  };

  // 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (mainImage) formData.append("image", mainImage);
    formData.append(
      "snsLinks",
      JSON.stringify(Object.entries(snsLinks).map(([id, url]) => ({ id, url })))
    );

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error("저장 실패");
      alert("설정이 저장되었습니다.");
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Layout>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          기본 설정
        </Typography>
        <Card sx={{ maxWidth: 600 }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                {/* 메인 이미지 */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    메인 이미지
                  </Typography>
                  <Button variant="contained" component="label">
                    이미지 업로드
                    <input hidden accept="image/*" type="file" onChange={handleImageChange} />
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
                      label="Instagram URL"
                      name="instagram"
                      value={snsLinks.instagram}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <InstagramIcon sx={{ color: "#E1306C" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="YouTube URL"
                      name="youtube"
                      value={snsLinks.youtube}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <YouTubeIcon sx={{ color: "#FF0000" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Twitter URL"
                      name="twitter"
                      value={snsLinks.twitter}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <img
                              src="/twiter.png" // <- import 제거, public 경로 사용
                              alt="Twitter"
                              style={{ width: 28, height: 28 }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Cafe URL"
                      name="cafe"
                      value={snsLinks.cafe}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalCafeIcon sx={{ color: "#00eb5aff" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Shop URL"
                      name="shop"
                      value={snsLinks.shop}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <StorefrontIcon sx={{ color: "#000" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>
                </Box>

                <Box textAlign="right">
                  <Button variant="contained" color="primary" type="submit">
                    저장하기
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default Settings;
