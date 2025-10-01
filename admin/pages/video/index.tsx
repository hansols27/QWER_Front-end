"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, Card, CardMedia, Typography, Grid } from "@mui/material";
import { VideoItem } from "@shared/types/video";

export default function VideoList() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    axios.get<VideoItem[]>("/api/video").then((res) => setItems(res.data));
  }, []);

  const getThumbnail = (url: string) => {
    const id = url.split("v=")[1]?.split("&")[0];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  };

  return (
    <Layout>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">영상 관리</Typography>
        <Button variant="contained" onClick={() => router.push("/video/create")}>
          등록
        </Button>
      </Box>

      <Grid container spacing={2} {...({} as any)}>
        {items.map((item) => (
          <Grid item xs={6} sm={4} md={3} key={item.id} {...({} as any)}>
            <Card
              onClick={() => router.push(`/video/${item.id}`)}
              sx={{ cursor: "pointer" }}
            >
              <CardMedia
                component="img"
                height="200"
                image={getThumbnail(item.src)}
                alt={item.title}
              />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}
