import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../components/common/layout";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Notice } from "@shared/types/notice";

export default function NoticeList() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get<Notice[]>("/api/notices").then((res) => setNotices(res.data));
  }, []);

  return (
    <Layout>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">공지사항 관리</Typography>
        <Button variant="contained" onClick={() => navigate("/notice/create")}>
          등록
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>구분</TableCell>
            <TableCell>제목</TableCell>
            <TableCell>작성일</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {notices.map((notice) => (
            <TableRow
              key={notice.id}
              hover
              onClick={() => navigate(`/notice/${notice.id}`)}
              style={{ cursor: "pointer" }}
            >
              <TableCell>{notice.type}</TableCell>
              <TableCell>{notice.title}</TableCell>
              <TableCell>
                {notice.createdAt
                  ? new Date(notice.createdAt).toLocaleDateString()
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Layout>
  );
}
