'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "../../components/common/layout";
import dynamic from "next/dynamic";
import {
  Box,
  Button,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import type { SmartEditorHandle } from "../../components/common/SmartEditor";

const SmartEditor = dynamic(() => import("../../components/common/SmartEditor"), { ssr: false });

interface Notice {
  id: number;
  type: "공지" | "이벤트";
  title: string;
  content: string;
}

export default function NoticeDetail({ params }: { params: { id: string } }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = params;
  const editorRef = useRef<SmartEditorHandle>(null);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await axios.get<Notice>(`/api/notices/${id}`);
        setNotice(res.data);
      } catch (err) {
        console.error(err);
        alert("공지사항을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, [id]);

  useEffect(() => {
    if (notice && editorRef.current) {
      editorRef.current.setContent(notice.content);
      editorRef.current.setReadOnly(true);
    }
  }, [notice]);

  if (loading) return <CircularProgress />;
  if (!notice) return <Typography>공지사항이 존재하지 않습니다.</Typography>;

  return (
    <Layout>
      <Stack spacing={2}>
        <Typography variant="h5">{notice.title}</Typography>
        <Typography variant="subtitle2">{notice.type}</Typography>

        <SmartEditor ref={editorRef} />

        <Box>
          <Button variant="contained" onClick={() => router.push("/notice")}>
            목록
          </Button>
        </Box>
      </Stack>
    </Layout>
  );
}
