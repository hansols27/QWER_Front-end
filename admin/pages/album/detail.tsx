"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
} from "@mui/material";
import type { Album } from "@shared/types/album";

export default function AlbumDetail() {
  const { id } = useParams(); // 동적 세그먼트에서 id 가져오기
  const router = useRouter();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchAlbum = async () => {
      try {
        const res = await axios.get(`/api/albums/${id}`);
        setAlbum(res.data as Album);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  if (loading) return <Layout>로딩중...</Layout>;
  if (!album) return <Layout>앨범을 찾을 수 없습니다.</Layout>;

  return (
    <Layout>
      <Box mb={2}>
        <Typography variant="h5">앨범 상세 / 수정</Typography>
      </Box>

      <Stack spacing={2}>
        <TextField
          label="타이틀"
          value={album.title}
          onChange={(e) => setAlbum({ ...album, title: e.target.value })}
        />

        <TextField
          label="발매일"
          type="date"
          value={album.date}
          onChange={(e) => setAlbum({ ...album, date: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="설명"
          multiline
          rows={4}
          value={album.description || ""}
          onChange={(e) => setAlbum({ ...album, description: e.target.value })}
        />

        <TextField
          label="트랙 리스트 (쉼표로 구분)"
          value={album.tracks?.join(", ") || ""}
          onChange={(e) =>
            setAlbum({ ...album, tracks: e.target.value.split(",").map(t => t.trim()) })
          }
        />

        <TextField
          label="유튜브 영상 URL"
          value={album.videoUrl || ""}
          onChange={(e) => setAlbum({ ...album, videoUrl: e.target.value })}
        />

        <Button
          variant="contained"
          onClick={async () => {
            if (!album) return;
            try {
              await axios.put(`/api/albums/${id}`, album);
              router.push("/album"); // 목록으로 이동
            } catch (err) {
              console.error(err);
            }
          }}
        >
          저장
        </Button>
      </Stack>
    </Layout>
  );
}
