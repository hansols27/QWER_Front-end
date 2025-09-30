"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, TextField, Typography } from "@mui/material";
import type { Album } from "@shared/types/album";

export default function AlbumCreate() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [tracks, setTracks] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!coverFile) return alert("커버 이미지를 선택해주세요");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("date", date);
    formData.append("description", description);
    formData.append("videoUrl", videoUrl);
    formData.append("coverFile", coverFile);
    tracks.forEach((track, idx) => formData.append(`tracks[${idx}]`, track));

    try {
      const res = await axios.post<{ success: boolean; data?: Album }>("/api/album", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) router.push("/album");
    } catch (err) {
      console.error(err);
      alert("등록 실패");
    }
  };

  return (
    <Layout>
      <Typography variant="h5" mb={2}>앨범 등록</Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="타이틀" value={title} onChange={e => setTitle(e.target.value)} />
        <TextField label="발매일" type="date" value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="설명" multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} />
        <TextField label="유튜브 링크" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
        {tracks.map((track, idx) => (
          <TextField
            key={idx}
            label={`트랙 ${idx + 1}`}
            value={track}
            onChange={e => {
              const newTracks = [...tracks];
              newTracks[idx] = e.target.value;
              setTracks(newTracks);
            }}
          />
        ))}
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <Button variant="contained" onClick={handleSubmit}>등록</Button>
      </Box>
    </Layout>
  );
}
