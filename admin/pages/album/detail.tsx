"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, TextField, Stack, Typography } from "@mui/material";
import type { Album } from "@shared/types/album";

export default function AlbumDetail() {
  const params = useParams();
  const id = params?.id; // 안전하게 optional chaining
  const router = useRouter();

  const [album, setAlbum] = useState<Album | null>(null);

  useEffect(() => {
    if (!id) return;

    axios.get(`/api/albums/${id}`).then((res) => {
      setAlbum(res.data as Album);
    });
  }, [id]);

  if (!id) return <Layout>잘못된 접근입니다.</Layout>;
  if (!album) return <Layout>로딩중...</Layout>;

  return (
    <Layout>
      <Typography variant="h5">앨범 상세 / 수정</Typography>
      <Stack spacing={2}>
        <TextField
          label="타이틀"
          value={album.title}
          onChange={(e) => setAlbum({ ...album, title: e.target.value })}
        />
        {/* 나머지 입력 필드 */}
        <Button
          onClick={() => {
            axios.put(`/api/albums/${id}`, album).then(() => {
              router.push("/album");
            });
          }}
        >
          저장
        </Button>
      </Stack>
    </Layout>
  );
}
