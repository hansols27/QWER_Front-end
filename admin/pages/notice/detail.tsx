'use client';

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Layout from "../../components/common/layout";
import type { SmartEditorHandle } from "../../components/common/SmartEditor";
import { Box, Button, Typography, Stack, TextField, Select, MenuItem } from "@mui/material";
import axios from "axios";

const SmartEditor = dynamic(() => import("../../components/common/SmartEditor"), { ssr: false });

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

  // initialContent 상태를 추가하여, 로드된 데이터를 에디터의 초기 값으로 사용합니다.
  const [initialContent, setInitialContent] = useState(""); 

  useEffect(() => {
    if (!id) return;

    axios.get<Notice>(`/api/notices/${id}`)
      .then(res => {
        const data = res.data;
        setNotice(data);
        setTitle(data.title);
        setType(data.type);
        setInitialContent(data.content); // 초기 내용 설정
      })
      .catch(err => {
        console.error(err);
        alert("공지사항을 불러오는데 실패했습니다.");
      });
  }, [id]);

  useEffect(() => {
    // initialContent가 설정된 후에 에디터가 마운트된다고 가정하고 readOnly 상태를 설정합니다.
    if (editorRef.current) {
        editorRef.current.setReadOnly(!isEdit);
    } else if (notice) {
        // 최초 로딩 시, notice가 있으면 (데이터 로딩 완료) readOnly 상태 설정
        // 이 로직은 SmartEditor 컴포넌트 내부에서 처리될 수도 있습니다.
    }
  }, [isEdit, notice]);

  const handleSave = async () => {
    if (!id || !notice) return;
    const content = editorRef.current?.getContent() || "";

    if (!title.trim()) return alert("제목을 입력해주세요.");

    try {
      await axios.put(`/api/notices/${id}`, { title, type, content });
      alert("수정 완료!");
      setIsEdit(false);
      // 저장 후 notice 객체를 업데이트하여 화면에 반영
      setNotice({ ...notice, title, type, content }); 
      // 에디터의 content도 업데이트된 값으로 설정
      editorRef.current?.setContent(content);
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };
  
  // 삭제 핸들러 추가 (스크린샷에 버튼은 없으나 기능상 필요)
  const handleDelete = async () => {
      if (!id) return;
      if (!window.confirm("정말로 삭제하시겠습니까?")) return;

      try {
          await axios.delete(`/api/notices/${id}`);
          alert("삭제 완료!");
          router.push("/notice");
      } catch (err) {
          console.error(err);
          alert("삭제 중 오류가 발생했습니다.");
      }
  };

  // 데이터 로딩이 완료된 후에 에디터를 렌더링하도록 조건부 처리
  if (!notice) return <Layout>로딩 중...</Layout>; 

  return (
    <Layout>
      <Stack spacing={2}>
        {/* 제목/타입 영역: isEdit 상태에 따라 텍스트 필드 또는 Typography 표시 */}
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

        <Box>
          {/* SmartEditor에 높이 prop과 초기 내용을 전달 */}
          <SmartEditor 
            ref={editorRef} 
            height="400px" 
            initialContent={initialContent}
          />
        </Box>

        {/* 버튼 영역: isEdit 상태와 삭제 버튼 추가 */}
        <Box sx={{ mt: 3 }}>
          {isEdit ? (
            <>
              <Button variant="contained" onClick={handleSave}>저장</Button>
              <Button sx={{ ml: 1 }} onClick={() => setIsEdit(false)}>취소</Button>
            </>
          ) : (
            <>
              <Button variant="contained" onClick={() => setIsEdit(true)}>수정</Button>
              <Button sx={{ ml: 1 }} variant="contained" color="error" onClick={handleDelete}>삭제</Button>
            </>
          )}
          <Button sx={{ ml: 1 }} onClick={() => router.push("/notice")}>목록</Button>
        </Box>
      </Stack>
    </Layout>
  );
}