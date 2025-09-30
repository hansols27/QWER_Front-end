'use client';

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function NoticeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const editorRef = useRef<SmartEditorHandle>(null);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"공지" | "이벤트">("공지");

  // 공지사항 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    axios.get<Notice>(`/api/notices/${id}`) // ✅ axios 제네릭 타입 지정
      .then(res => {
        const data = res.data;
        setNotice(data);
        setTitle(data.title);
        setType(data.type);
        editorRef.current?.setContent(data.content);
        editorRef.current?.setReadOnly(true);
      })
      .catch(err => {
        console.error(err);
        alert("공지사항을 불러오는데 실패했습니다.");
      });
  }, [id]);

  // 편집 모드 토글 시 SmartEditor 읽기/쓰기
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setReadOnly(!isEdit);
    }
  }, [isEdit]);

  const handleSave = async () => {
    if (!id || !notice) return;
    const content = editorRef.current?.getContent() || "";

    try {
      await axios.put(`/api/notices/${id}`, { title, type, content });
      alert("수정 완료!");
      setIsEdit(false);
      setNotice({ ...notice, title, type, content }); // Notice 타입 유지
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  if (!notice) return <Layout>로딩 중...</Layout>;

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
            <Typography variant="h5">{notice.title}</Typography>
            <Typography variant="subtitle2">{notice.type}</Typography>
          </>
        )}

        {/* SmartEditor 영역 */}
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
