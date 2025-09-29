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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";
import type { MemberState, MemberPayload } from "@shared/types/member";

type MemberId = "All" | "Chodan" | "Majenta" | "Hina" | "Siyeon";

const initialState: MemberState = { text: [""], image: [""], sns: {} };

const ProfilePage = () => {
  const [memberId, setMemberId] = useState<MemberId>("All");
  const [state, setState] = useState<MemberState>(initialState);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get<{ success: boolean; data: MemberPayload }>(`/api/profile/${memberId}`);
        const data = res.data.data;
        if (data) {
          const texts = data.contents.filter(c => c.type === "text").map(c => c.content);
          const images = data.contents.filter(c => c.type === "image").map(c => c.content);
          setState({
            text: texts.length ? texts : [""],
            image: images.length ? images : [""],
            sns: data.sns || {},
          });
        } else {
          setState(initialState);
        }
      } catch (err) {
        console.error(err);
        setAlert("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [memberId]);

  // Text handlers
  const addText = () => setState(prev => ({ ...prev, text: [...prev.text, ""] }));
  const removeText = (i: number) => setState(prev => ({ ...prev, text: prev.text.filter((_, idx) => idx !== i) }));
  const updateText = (i: number, val: string) =>
    setState(prev => ({ ...prev, text: prev.text.map((t, idx) => (idx === i ? val : t)) }));

  // Image handlers
  const addImage = () => setState(prev => ({ ...prev, image: [...prev.image, ""] }));
  const removeImage = (i: number) => setState(prev => ({ ...prev, image: prev.image.filter((_, idx) => idx !== i) }));
  const updateImage = (i: number, file: File | string) =>
    setState(prev => ({ ...prev, image: prev.image.map((img, idx) => (idx === i ? file : img)) }));

  // SNS handlers
  const updateSns = (key: keyof typeof state.sns, val: string) =>
    setState(prev => ({ ...prev, sns: { ...prev.sns, [key]: val } }));

  // Save profile
  const saveProfile = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      const files = state.image.filter(i => i instanceof File) as File[];
      files.forEach(f => formData.append("images", f));
      formData.append("data", JSON.stringify({ text: state.text, sns: state.sns }));
      formData.append("name", memberId);

      await axios.post<{ success: boolean; data: MemberPayload }>(`/api/profile/${memberId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAlert("Profile saved successfully!");
    } catch (err) {
      console.error(err);
      setAlert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2}>
          Profile Admin
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Member</InputLabel>
          <Select value={memberId} label="Member" onChange={e => setMemberId(e.target.value as MemberId)}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Chodan">Chodan</MenuItem>
            <MenuItem value="Majenta">Majenta</MenuItem>
            <MenuItem value="Hina">Hina</MenuItem>
            <MenuItem value="Siyeon">Siyeon</MenuItem>
          </Select>
        </FormControl>

        {alert && <Alert severity="success" sx={{ mb: 2 }}>{alert}</Alert>}
        {loading && <CircularProgress sx={{ mb: 2 }} />}

        {/* Text Fields */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Texts</Typography>
            <Stack spacing={2}>
              {state.text.map((t, i) => (
                <Stack direction="row" spacing={1} key={i}>
                  <TextField fullWidth value={t} onChange={e => updateText(i, e.target.value)} />
                  <Button variant="outlined" color="error" onClick={() => removeText(i)}>Remove</Button>
                </Stack>
              ))}
              <Button variant="contained" onClick={addText}>Add Text</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Images */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Images</Typography>
            <Stack spacing={2}>
              {state.image.map((img, i) => (
                <Stack direction="row" spacing={1} key={i} alignItems="center">
                  <Button variant="outlined" component="label">
                    Upload
                    <input type="file" hidden onChange={e => e.target.files && updateImage(i, e.target.files[0])} />
                  </Button>
                  {typeof img === "string" && <img src={img} alt="preview" width={50} />}
                  <Button variant="outlined" color="error" onClick={() => removeImage(i)}>Remove</Button>
                </Stack>
              ))}
              <Button variant="contained" onClick={addImage}>Add Image</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* SNS Links */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>SNS Links</Typography>
            <Stack spacing={2}>
              {["instagram", "youtube", "twitter", "tiktok", "weverse", "cafe"].map(k => (
                <TextField
                  key={k}
                  label={k}
                  value={state.sns[k] || ""}
                  onChange={e => updateSns(k, e.target.value)}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Button variant="contained" onClick={saveProfile}>Save Profile</Button>
      </Box>
    </Layout>
  );
};

export default ProfilePage;
