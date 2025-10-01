"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, TextField, Typography } from "@mui/material";
import { VideoItem } from "@shared/types/video";

export default function VideoCreate() {
  const [title, setTitle] = useState("");
  const [src, setSrc] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    const res = await axios.post<VideoItem>("/api/video", { title, src });
    if (res.data.id) {
      router.push("/video");
    }
  };

  const getThumbnail = (url: string) => {
    const id = url.split("v=")[1]?.split("&")[0];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  };

  return (
    <Layout>
      <Typography variant="h5" mb={2}>영상 등록</Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="유튜브 링크" value={src} onChange={(e) => setSrc(e.target.value)} />
        {src && (
          <Box mt={2}>
            <img src={getThumbnail(src)} alt="썸네일 미리보기" width="320" />
          </Box>
        )}
        <Button variant="contained" onClick={handleSubmit}>등록</Button>
      </Box>
    </Layout>
  );
}
