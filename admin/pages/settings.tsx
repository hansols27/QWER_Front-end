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

const DEFAULT_SNS_IDS: SnsLink["id"][] = ["instagram", "youtube", "twitter", "cafe", "shop"];

const SettingsPage = () => {
  const [snsLinks, setSnsLinks] = useState<SnsLink[]>(DEFAULT_SNS_IDS.map(id => ({ id, url: "" })));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await axios.get<{ success: boolean; data: SettingsData }>("/api/settings");
        const data = res.data.data;
        setMainImageUrl(data.mainImage || "");
        setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      } catch (err) {
        console.error(err);
        setAlert("Failed to load settings");
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
    try {
      const formData = new FormData();
      if (imageFile) formData.append("image", imageFile);
      formData.append("snsLinks", JSON.stringify(snsLinks));

      const res = await axios.post<{ success: boolean; data: SettingsData }>("/api/settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data.data;
      setMainImageUrl(data.mainImage || "");
      setSnsLinks(DEFAULT_SNS_IDS.map(id => data.snsLinks.find(l => l.id === id) || { id, url: "" }));
      setAlert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      setAlert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2}>
          Settings Admin
        </Typography>

        {alert && <Alert severity="success" sx={{ mb: 2 }}>{alert}</Alert>}
        {loading && <CircularProgress sx={{ mb: 2 }} />}

        {/* Main Image */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Main Image</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label">
                Upload Image
                <input type="file" hidden onChange={e => e.target.files && setImageFile(e.target.files[0])} />
              </Button>
              {mainImageUrl && <img src={mainImageUrl} alt="main" width={100} />}
            </Stack>
          </CardContent>
        </Card>

        {/* SNS Links */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>SNS Links</Typography>
            <Stack spacing={2}>
              {snsLinks.map(link => (
                <TextField
                  key={link.id}
                  label={link.id}
                  value={link.url}
                  onChange={e => updateSnsLink(link.id, e.target.value)}
                  fullWidth
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Button variant="contained" onClick={saveSettings}>Save Settings</Button>
      </Box>
    </Layout>
  );
};

export default SettingsPage;
