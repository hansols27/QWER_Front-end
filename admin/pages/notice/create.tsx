'use client';

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import dynamic from "next/dynamic";
import { Box, Button, MenuItem, Select, TextField, Typography, Stack } from "@mui/material";
import type { SmartEditorHandle } from "../../components/common/SmartEditor";

const SmartEditor = dynamic(() => import("../../components/common/SmartEditor"), { ssr: false });

export default function NoticeCreate() {
  const [type, setType] = useState<"공지" | "이벤트">("공지");
  const [title, setTitle] = useState("");
  const editorRef = useRef<SmartEditorHandle>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    const content = editorRef.current?.getContent() || "";
    if (!title.trim()) return alert("제목을 입력해주세요.");

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
      <Typography variant="h5" mb={2}>공지사항 등록</Typography>
      <Stack spacing={2}>
        <Select value={type} onChange={(e) => setType(e.target.value as "공지" | "이벤트")}>
          <MenuItem value="공지">공지</MenuItem>
          <MenuItem value="이벤트">이벤트</MenuItem>
        </Select>

        <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />

        <Box>
          {/* SmartEditor에 원하는 높이 (예: 400px)를 명시적으로 전달 */}
          <SmartEditor ref={editorRef} height="400px" /> 
        </Box>

        {/* 버튼 Box에 상단 margin을 넉넉하게 주어 에디터와의 간격을 확보 */}
        <Box sx={{ mt: 3 }}> 
          <Button variant="contained" onClick={handleSubmit}>저장</Button>
          <Button sx={{ ml: 1 }} onClick={() => router.push("/notice")}>취소</Button>
        </Box>
      </Stack>
    </Layout>
  );
}