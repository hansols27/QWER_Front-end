"use client";

import { useEffect, useState, ChangeEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../api/axios"; // ✅ axios 인스턴스 통일
import Layout from "../../components/common/layout";
import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  CardMedia,
} from "@mui/material";
import type { AlbumItem } from "@shared/types/album";

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return defaultMsg;
};

// Album 기본값
const INITIAL_ALBUM_STATE: AlbumItem = {
  id: "",
  title: "",
  date: "",
  description: "",
  tracks: [""],
  videoUrl: "",
  image: "",
};

export default function AlbumDetail() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [album, setAlbum] = useState<AlbumItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  /**
   * 1️⃣ 앨범 정보 불러오기
   */
  const fetchAlbum = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setAlertMessage(null);

    try {
      const res = await api.get<{ success: boolean; data: AlbumItem }>(
        `/api/albums/${id}`
      );
      const fetched = res.data.data;
      setAlbum({ ...fetched, tracks: fetched.tracks?.length ? fetched.tracks : [""] });
    } catch (err) {
      console.error("앨범 로드 실패:", err);
      setAlertMessage({
        message: extractErrorMessage(err, "앨범 정보를 불러오는 데 실패했습니다."),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchAlbum();
  }, [id, fetchAlbum]);

  /**
   * 2️⃣ 수정 (PUT)
   */
  const handleUpdate = async () => {
    if (!album) return;
    setIsSaving(true);
    setAlertMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", album.title);
      formData.append("date", album.date);
      formData.append("description", album.description ?? "");
      formData.append("videoUrl", album.videoUrl ?? "");
      formData.append("existingImage", album.image ?? "");
      if (coverFile) formData.append("coverFile", coverFile);

      (album.tracks ?? [])
        .filter((t) => t.trim() !== "")
        .forEach((track, i) => formData.append(`tracks[${i}]`, track));

      const res = await api.put<{ success: boolean; data?: AlbumItem }>(
        `/api/albums/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        setAlertMessage({
          message: "앨범 정보가 성공적으로 수정되었습니다!",
          severity: "success",
        });
        setCoverFile(null);
        if (res.data.data) setAlbum(res.data.data);
      } else {
        setAlertMessage({
          message: "수정 실패: 서버에서 오류가 발생했습니다.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("앨범 수정 실패:", err);
      setAlertMessage({
        message: extractErrorMessage(err, "앨범 수정 요청에 실패했습니다."),
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 3️⃣ 삭제 (DELETE)
   */
  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("정말로 이 앨범을 삭제하시겠습니까?")) return;

    setIsSaving(true);
    setAlertMessage(null);
    try {
      await api.delete(`/api/albums/${id}`);
      setAlertMessage({
        message: "앨범이 성공적으로 삭제되었습니다!",
        severity: "success",
      });
      router.push("/album");
    } catch (err) {
      console.error("앨범 삭제 실패:", err);
      setAlertMessage({
        message: extractErrorMessage(err, "앨범 삭제 요청에 실패했습니다."),
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 4️⃣ 트랙 관련 핸들러
   */
  const handleTrackChange = (index: number, value: string) => {
    if (!album) return;
    const newTracks = [...(album.tracks ?? [])];
    newTracks[index] = value;
    setAlbum({ ...album, tracks: newTracks });
  };

  const addTrack = () => album && setAlbum({ ...album, tracks: [...(album.tracks ?? []), ""] });
  const removeTrack = (index: number) =>
    album &&
    setAlbum({ ...album, tracks: (album.tracks ?? []).filter((_, i) => i !== index) });

  /**
   * 5️⃣ 파일 변경 핸들러
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
  };

  // 로딩 중
  if (!id)
    return (
      <Layout>
        <Box p={4}>
          <Typography color="error">잘못된 접근입니다. 앨범 ID가 필요합니다.</Typography>
        </Box>
      </Layout>
    );

  if (loading || !album)
    return (
      <Layout>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
          <Typography ml={2} sx={{ alignSelf: "center" }}>
            앨범 로딩 중...
          </Typography>
        </Box>
      </Layout>
    );

  // 렌더링
  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h4" mb={2} fontWeight="bold">
          앨범 "{album.title}" 수정
        </Typography>

        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}

        <Stack spacing={3}>
          <TextField
            label="타이틀"
            value={album.title}
            onChange={(e) => setAlbum({ ...album, title: e.target.value })}
            disabled={isSaving}
            required
          />
          <TextField
            label="발매일"
            type="date"
            value={album.date}
            onChange={(e) => setAlbum({ ...album, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            disabled={isSaving}
            required
          />
          <TextField
            label="설명"
            multiline
            minRows={3}
            value={album.description ?? ""}
            onChange={(e) => setAlbum({ ...album, description: e.target.value })}
            disabled={isSaving}
          />
          <TextField
            label="유튜브 링크"
            value={album.videoUrl ?? ""}
            onChange={(e) => setAlbum({ ...album, videoUrl: e.target.value })}
            disabled={isSaving}
          />

          {/* 커버 이미지 */}
          <Typography variant="h6" mt={2} fontWeight="bold">
            커버 이미지
          </Typography>
          {(coverFile || album.image) && (
            <Box mb={2}>
              <CardMedia
                component="img"
                height="150"
                image={
                  coverFile
                    ? URL.createObjectURL(coverFile)
                    : album.image || "https://via.placeholder.com/150?text=No+Image"
                }
                alt={`${album.title} Cover`}
                sx={{ width: 150, objectFit: "cover", borderRadius: 1 }}
              />
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", mt: 1 }}
              >
                {coverFile
                  ? `새 파일: ${coverFile.name}`
                  : album.image
                  ? `기존 파일 사용 중`
                  : `이미지 없음`}
              </Typography>
            </Box>
          )}

          <input type="file" accept="image/*" onChange={handleFileChange} disabled={isSaving} />
          <Typography variant="body2" color="primary">
            새 이미지를 선택하면 기존 이미지를 대체합니다.
          </Typography>

          {/* 트랙 목록 */}
          <Typography variant="h6" mt={2} fontWeight="bold">
            트랙 목록
          </Typography>
          {(album.tracks ?? []).map((track, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={idx}>
              <TextField
                label={`트랙 ${idx + 1}`}
                value={track ?? ""}
                onChange={(e) => handleTrackChange(idx, e.target.value)}
                fullWidth
                disabled={isSaving}
              />
              {(album.tracks?.length ?? 0) > 1 && (
                <Button onClick={() => removeTrack(idx)} color="error" disabled={isSaving}>
                  삭제
                </Button>
              )}
            </Stack>
          ))}
          <Button onClick={addTrack} variant="outlined" disabled={isSaving}>
            트랙 추가
          </Button>

          {/* 저장/삭제 */}
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdate}
              disabled={isSaving || !album.title || !album.date}
              startIcon={isSaving && <CircularProgress size={20} color="inherit" />}
            >
              {isSaving ? "저장 중..." : "수정 내용 저장"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={isSaving}
            >
              삭제
            </Button>
          </Box>

          <Button variant="text" onClick={() => router.push("/album")}>
            목록
          </Button>
        </Stack>
      </Box>
    </Layout>
  );
}
