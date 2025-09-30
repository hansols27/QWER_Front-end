'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

interface Notice {
  id: number;
  type: "공지" | "이벤트";
  title: string;
  createdAt?: string;
}

export default function NoticeList() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const router = useRouter();

  useEffect(() => {
    axios.get<Notice[]>("/api/notices")
      .then(res => setNotices(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <Layout>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">공지사항 관리</Typography>
        <Button variant="contained" onClick={() => router.push("/notice/create")}>등록</Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>구분</TableCell>
            <TableCell>제목</TableCell>
            <TableCell>작성일</TableCell>
            <TableCell>수정</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {notices.map((notice) => (
            <TableRow key={notice.id} hover>
              <TableCell onClick={() => router.push(`/notice/detail/${notice.id}`)} style={{ cursor: "pointer" }}>{notice.type}</TableCell>
              <TableCell onClick={() => router.push(`/notice/detail/${notice.id}`)} style={{ cursor: "pointer" }}>{notice.title}</TableCell>
              <TableCell onClick={() => router.push(`/notice/detail/${notice.id}`)} style={{ cursor: "pointer" }}>
                {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : "-"}
              </TableCell>
              <TableCell>
                <Button variant="outlined" size="small" onClick={() => router.push(`/notice/detail/${notice.id}`)}>수정</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Layout>
  );
}
