"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, Card, CardMedia, Typography, Grid } from "@mui/material";
import type { Album } from "@shared/types/album";

export default function AlbumList() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const router = useRouter();

  useEffect(() => {
    axios.get<Album[]>("/api/album").then((res) => setAlbums(res.data));
  }, []);

  return (
    <Layout>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">앨범 관리</Typography>
        <Button
          variant="contained"
          onClick={() => router.push("/album/create")}
        >
          등록
        </Button>
      </Box>

      <Grid container spacing={2} {...({} as any)}>
        {albums.map((album) => (
          <Grid item xs={6} sm={4} md={3} key={album.id} {...({} as any)}>
            <Card
              onClick={() => router.push(`/album/${album.id}`)}
              sx={{ cursor: "pointer" }}
            >
              <CardMedia
                component="img"
                height="200"
                image={album.image}
                alt={album.title}
              />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}
