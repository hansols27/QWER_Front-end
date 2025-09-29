import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function NoticeCreate() {
  const [type, setType] = useState<"공지" | "이벤트">("공지");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // 스마트에디터 적용 예정
  const navigate = useNavigate();

  const handleSubmit = async () => {
    await axios.post("/api/notices", { type, title, content });
    navigate("/notice");
  };

  return (
    <Layout>
      <Typography variant="h5" mb={2}>
        공지사항 등록
      </Typography>
      <Stack spacing={2}>
        <Select value={type} onChange={(e) => setType(e.target.value as "공지" | "이벤트")}>
          <MenuItem value="공지">공지</MenuItem>
          <MenuItem value="이벤트">이벤트</MenuItem>
        </Select>
        <TextField
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          rows={6}
        />
        <Box>
          <Button variant="contained" onClick={handleSubmit}>
            저장
          </Button>
          <Button sx={{ ml: 1 }} onClick={() => navigate("/notice")}>
            취소
          </Button>
        </Box>
      </Stack>
    </Layout>
  );
}
