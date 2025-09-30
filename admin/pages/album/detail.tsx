"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, TextField, Typography } from "@mui/material";
import type { Album } from "@shared/types/album";

export default function AlbumDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (!id) return;
    axios.get<Album>(`/api/album/${id}`).then(res => {
      setAlbum(res.data);
      setTitle(res.data.title);
      setDate(res.data.date);
      setDescription(res.data.description || "");
      setTracks(res.data.tracks || []);
      setVideoUrl(res.data.videoUrl || "");
    });
  }, [id]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
  };

  const handleUpdate = async () => {
    if (!album) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("date", date);
    formData.append("description", description);
    formData.append("videoUrl", videoUrl);
    if (coverFile) formData.append("coverFile", coverFile);
    tracks.forEach((track, idx) => formData.append(`tracks[${idx}]`, track));

    try {
      const res = await axios.put<{ success: boolean; data?: Album }>(`/api/album/${album.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) router.push("/album");
    } catch (err) {
      console.error(err);
      alert("수정 실패");
    }
  };

  const handleDelete = async () => {
    if (!album) return;

    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await axios.delete<{ success: boolean }>(`/api/album/${album.id}`);
      if (res.data.success) router.push("/album");
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  if (!album) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <Typography variant="h5" mb={2}>앨범 수정</Typography>
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
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={handleUpdate}>수정</Button>
          <Button variant="outlined" color="error" onClick={handleDelete}>삭제</Button>
        </Box>
      </Box>
    </Layout>
  );
}
