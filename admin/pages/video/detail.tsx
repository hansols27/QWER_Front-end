"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, TextField, Typography } from "@mui/material";
import { VideoItem } from "@shared/types/video";

export default function VideoDetail() {
  const params = useParams();
  const router = useRouter();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [title, setTitle] = useState("");
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (params?.id) {
      axios.get<VideoItem>(`/api/video/${params.id}`).then((res) => {
        setVideo(res.data);
        setTitle(res.data.title);
        setSrc(res.data.src);
      });
    }
  }, [params?.id]);

  const handleUpdate = async () => {
    if (!video) return;
    await axios.put(`/api/video/${video.id}`, { title, src });
    router.push("/video");
  };

  const handleDelete = async () => {
    if (!video) return;
    await axios.delete(`/api/video/${video.id}`);
    router.push("/video");
  };

  const getThumbnail = (url: string) => {
    const id = url.split("v=")[1]?.split("&")[0];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  };

  if (!video) return <Layout><Typography>Loading...</Typography></Layout>;

  return (
    <Layout>
      <Typography variant="h5" mb={2}>영상 상세/수정</Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="유튜브 링크" value={src} onChange={(e) => setSrc(e.target.value)} />
        {src && (
          <Box mt={2}>
            <img src={getThumbnail(src)} alt="썸네일 미리보기" width="320" />
          </Box>
        )}
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={handleUpdate}>수정</Button>
          <Button variant="outlined" color="error" onClick={handleDelete}>삭제</Button>
        </Box>
      </Box>
    </Layout>
  );
}
