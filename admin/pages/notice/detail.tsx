import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../../components/common/layout";
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
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    axios.get<Notice>(`/api/notices/${id}`).then((res) => setNotice(res.data));
  }, [id]);

  const handleUpdate = async () => {
    if (!notice) return;
    await axios.put(`/api/notices/${notice.id}`, {
      type: notice.type,
      title: notice.title,
      content: notice.content,
    });
    alert("수정 완료");
  };

  const handleDelete = async () => {
    if (!notice) return;
    if (confirm("삭제하시겠습니까?")) {
      await axios.delete(`/api/notices/${notice.id}`);
      navigate("/notice");
    }
  };

  if (!notice) return <div>Loading...</div>;

  return (
    <Layout>
      <Typography variant="h5" mb={2}>
        공지사항 상세 
      </Typography>
      <Stack spacing={2}>
        <Select
          value={notice.type}
          onChange={(e) =>
            setNotice((prev) =>
              prev ? { ...prev, type: e.target.value as "공지" | "이벤트" } : prev
            )
          }
        >
          <MenuItem value="공지">공지</MenuItem>
          <MenuItem value="이벤트">이벤트</MenuItem>
        </Select>
        <TextField
          label="제목"
          value={notice.title}
          onChange={(e) =>
            setNotice((prev) => (prev ? { ...prev, title: e.target.value } : prev))
          }
        />
        <TextField
          label="내용"
          value={notice.content}
          onChange={(e) =>
            setNotice((prev) => (prev ? { ...prev, content: e.target.value } : prev))
          }
          multiline
          rows={6}
        />
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
