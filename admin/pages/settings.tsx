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

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL_PROD
    : process.env.NEXT_PUBLIC_API_URL;

type SnsLinks = {
  instagram: string;
  youtube: string;
  twitter: string;
  cafe: string;
  shop: string;
};

const Settings = () => {
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [snsLinks, setSnsLinks] = useState<SnsLinks>({
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
        const res = await fetch(`${API_URL}/api/settings`);
        if (!res.ok) throw new Error("설정 불러오기 실패");
        const data = await res.json();

        // Firestore에서 불러온 snsLinks 배열 → 객체로 변환
        const snsObj: Partial<SnsLinks> = {};
        data.snsLinks?.forEach((l: { id: keyof SnsLinks; url: string }) => {
          snsObj[l.id] = l.url;
        });
        setSnsLinks((prev) => ({ ...prev, ...snsObj }));

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

    // 입력된 SNS 링크만 배열로 변환
    const snsArray = (Object.entries(snsLinks) as [keyof SnsLinks, string][])
      .filter(([_, url]) => url)
      .map(([id, url]) => ({ id, url }));

    formData.append("snsLinks", JSON.stringify(snsArray));

    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        body: formData,
      });
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
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleImageChange}
                    />
                  </Button>
                  {preview && (
                    <Box mt={2}>
                      <img
                        src={preview}
                        alt="Preview"
                        style={{ width: 250, borderRadius: 8 }}
                      />
                    </Box>
                  )}
                </Box>

                {/* SNS 링크 */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    SNS 링크 (선택 입력)
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
                            <img
                              src="/instagram.png"
                              alt="Instagram"
                              style={{ width: 28, height: 28 }}
                            />
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
                            <img
                              src="/youtube.png"
                              alt="YouTube"
                              style={{ width: 28, height: 28 }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Twitter URL"
                      name="twitter"
                      value={snsLinks.twitter}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <img
                              src="/twitter.png"
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
                            <img
                              src="/cafe.png"
                              alt="Cafe"
                              style={{ width: 28, height: 28 }}
                            />
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
                            <img
                              src="/shop.png"
                              alt="Shop"
                              style={{ width: 28, height: 28 }}
                            />
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
