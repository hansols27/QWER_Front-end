'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Layout from "../../components/common/layout";
import type { SmartEditorHandle } from "../../components/common/SmartEditor";
import { Box, Button, Typography, Stack, TextField, Select, MenuItem } from "@mui/material";
import axios from "axios";

const SmartEditor = dynamic(
  () => import("../../components/common/SmartEditor"),
  { ssr: false }
);

interface Notice {
  id: number;
  type: "공지" | "이벤트";
  title: string;
  content: string;
}

interface NoticeDetailProps {
  notice: Notice;
}

export default function NoticeDetail({ notice }: NoticeDetailProps) {
  const editorRef = useRef<SmartEditorHandle>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [title, setTitle] = useState(notice.title);
  const [type, setType] = useState<"공지" | "이벤트">(notice.type);
  const router = useRouter();

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setContent(notice.content);
      editorRef.current.setReadOnly(!isEdit); // isEdit 상태에 따라 읽기/쓰기
    }
  }, [notice, isEdit]);

  const handleSave = async () => {
    const content = editorRef.current?.getContent() || "";
    try {
      await axios.put(`/api/notices/${notice.id}`, { title, type, content });
      alert("수정 완료!");
      setIsEdit(false);
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <Layout>
      <Stack spacing={2}>
        {isEdit ? (
          <>
            <Select value={type} onChange={(e) => setType(e.target.value as "공지" | "이벤트")}>
              <MenuItem value="공지">공지</MenuItem>
              <MenuItem value="이벤트">이벤트</MenuItem>
            </Select>
            <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
          </>
        ) : (
          <>
            <Typography variant="h5">{title}</Typography>
            <Typography variant="subtitle2">{type}</Typography>
          </>
        )}

        {/* SmartEditor */}
        <Box>
          <SmartEditor ref={editorRef} />
        </Box>

        <Box>
          {isEdit ? (
            <>
              <Button variant="contained" onClick={handleSave}>저장</Button>
              <Button sx={{ ml: 1 }} onClick={() => setIsEdit(false)}>취소</Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setIsEdit(true)}>수정</Button>
          )}
          <Button sx={{ ml: 1 }} onClick={() => router.push("/notice")}>목록</Button>
        </Box>
      </Stack>
    </Layout>
  );
}
