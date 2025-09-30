"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, Card, CardMedia, Grid, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function GalleryCreate() {
  const [files, setFiles] = useState<File[]>([]);
  const router = useRouter();

  // 파일 선택
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // 선택 이미지 삭제
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 업로드
  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      await axios.post("/api/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push("/gallery"); // 등록 후 리스트 페이지로 이동
    } catch (err) {
      console.error(err);
      alert("업로드 실패");
    }
  };

  return (
    <Layout>
      <Box mb={2}>
        <Typography variant="h5">갤러리 이미지 등록</Typography>
      </Box>

      <Box mb={2}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
      </Box>

      {files.length > 0 && (
        <Grid container spacing={2} {...({} as any)}>
          {files.map((file, idx) => (
            <Grid item xs={6} sm={4} md={3} key={idx} {...({} as any)}>
              <Card sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={URL.createObjectURL(file)}
                  alt={`preview-${idx}`}
                />
                <IconButton
                  size="small"
                  color="error"
                  sx={{ position: "absolute", top: 5, right: 5 }}
                  onClick={() => handleRemoveFile(idx)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box mt={2}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={files.length === 0}
        >
          업로드
        </Button>
      </Box>
    </Layout>
  );
}
