"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, Card, CardMedia, Typography, Grid } from "@mui/material";

interface GalleryItem {
  id: string;
  url: string;
  createdAt: string;
}

export default function GalleryList() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    axios.get("/api/gallery").then((res) => {
      setItems(res.data as GalleryItem[]);
    });
  }, []);

  return (
    <Layout>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">갤러리 관리</Typography>
        <Button
          variant="contained"
          onClick={() => router.push("/gallery/create")}
        >
          등록
        </Button>
      </Box>

      {/* Grid container: 타입 단언 추가 */}
      <Grid container spacing={2} {...({} as any)}>
        {items.map((item) => (
          <Grid item xs={6} sm={4} md={3} key={item.id} {...({} as any)}>
            <Card
              onClick={() => router.push(`/gallery/${item.id}`)}
              sx={{ cursor: "pointer" }}
            >
              <CardMedia
                component="img"
                height="200"
                image={item.url}
                alt="gallery"
              />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}
