'use client';

import { useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "../../components/common/layout";
import SmartEditor, { SmartEditorHandle } from "../../components/common/SmartEditor";
import {
  Box,
  Button,
  MenuItem,
  Select,
  TextField,
  Typography,
  Stack,
} from "@mui/material";

export default function NoticeCreate() {
  const [type, setType] = useState<"공지" | "이벤트">("공지");
  const [title, setTitle] = useState("");
  const editorRef = useRef<SmartEditorHandle>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    const content = editorRef.current?.getContent() || "";

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    try {
      await axios.post("/api/notices", { type, title, content });
      alert("등록 완료!");
      router.push("/notice");
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <Layout>
      <Typography variant="h5" mb={2}>
        공지사항 등록
      </Typography>
      <Stack spacing={2}>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value as "공지" | "이벤트")}
        >
          <MenuItem value="공지">공지</MenuItem>
          <MenuItem value="이벤트">이벤트</MenuItem>
        </Select>

        <TextField
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <SmartEditor ref={editorRef} />

        <Box>
          <Button variant="contained" onClick={handleSubmit}>
            저장
          </Button>
          <Button sx={{ ml: 1 }} onClick={() => router.push("/notice")}>
            취소
          </Button>
        </Box>
      </Stack>
    </Layout>
  );
}
