import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import type { Notice } from "@shared/types/notice";

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<SmartEditorHandle>(null);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [type, setType] = useState<"공지" | "이벤트">("공지");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!id) return;
    axios.get<Notice>(`/api/notices/${id}`).then((res) => {
      setNotice(res.data);
      setType(res.data.type);
      setTitle(res.data.title);
      if (editorRef.current) {
        editorRef.current.setContent(res.data.content);
      }
    });
  }, [id]);

  const handleUpdate = async () => {
    if (!notice) return;
    const content = editorRef.current?.getContent() || "";

    try {
      await axios.put(`/api/notices/${notice.id}`, {
        type,
        title,
        content,
      });
      alert("수정 완료!");
      navigate("/notice");
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!notice) return;
    if (confirm("삭제하시겠습니까?")) {
      try {
        await axios.delete(`/api/notices/${notice.id}`);
        alert("삭제 완료!");
        navigate("/notice");
      } catch (err) {
        console.error(err);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  if (!notice) return <div>Loading...</div>;

  return (
    <Layout>
      <Typography variant="h5" mb={2}>
        공지사항 상세
      </Typography>
      <Stack spacing={2}>
        {/* 구분 선택 */}
        <Select value={type} onChange={(e) => setType(e.target.value as "공지" | "이벤트")}>
          <MenuItem value="공지">공지</MenuItem>
          <MenuItem value="이벤트">이벤트</MenuItem>
        </Select>

        {/* 제목 입력 */}
        <TextField
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* SmartEditor2 */}
        <SmartEditor ref={editorRef} initialContent={notice.content} />

        {/* 버튼 */}
        <Box>
          <Button variant="contained" onClick={handleUpdate}>
            수정
          </Button>
          <Button color="error" sx={{ ml: 1 }} onClick={handleDelete}>
            삭제
          </Button>
          <Button sx={{ ml: 1 }} onClick={() => navigate("/notice")}>
            목록
          </Button>
        </Box>
      </Stack>
    </Layout>
  );
}
