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

export interface SnsLinks {
  instagram: string;
  youtube: string;
  twitter: string;
  cafe: string;
  shop: string;
}

export interface SnsLink {
  id: "instagram" | "youtube" | "twitter" | "cafe" | "shop";
  url: string;
  icon?: string;
}

export interface SettingsData {
  mainImage?: string;
  snsLinks: SnsLink[];
}

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

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data: SettingsData = await res.json();

      const snsObj: Partial<SnsLinks> = {};
      (data.snsLinks as SnsLink[]).forEach((l) => {
        snsObj[l.id] = l.url;
      });
      setSnsLinks((prev) => ({ ...prev, ...snsObj }));
      setPreview(data.mainImage || null);
    } catch (err) {
      console.error(err);
      alert("설정 불러오기 실패");
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
    if (mainImage) formData.append("image", mainImage);

    const snsArray: SnsLink[] = (Object.entries(snsLinks) as [keyof SnsLinks, string][])
      .filter(([_, url]) => url)
      .map(([id, url]) => ({ id, url }));

    formData.append("snsLinks", JSON.stringify(snsArray));

    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save settings");

      const result: { success: boolean; data: SettingsData } = await res.json();

      if (result?.data) {
        const newObj: Partial<SnsLinks> = {};
        (result.data.snsLinks as SnsLink[]).forEach((l) => {
          newObj[l.id] = l.url;
        });
        setSnsLinks((prev) => ({ ...prev, ...newObj }));
        setPreview(result.data.mainImage || null);
      }

      alert("설정이 저장되었습니다.");
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const snsKeys: (keyof SnsLinks)[] = ["instagram", "youtube", "twitter", "cafe", "shop"];

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

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    SNS 링크
                  </Typography>
                  <Stack spacing={2}>
                    {snsKeys.map((key) => (
                      <TextField
                        key={key}
                        label={`${key.charAt(0).toUpperCase() + key.slice(1)} URL`}
                        name={key}
                        value={snsLinks[key]}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <img
                                src={`/${key}.png`}
                                alt={key}
                                style={{ width: 28, height: 28 }}
                              />
                            </InputAdornment>
                          ),
                        }}
                      />
                    ))}
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
