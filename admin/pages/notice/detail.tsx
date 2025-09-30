import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import Layout from "../../components/common/layout";
import { useRef, useEffect } from "react";
import type { SmartEditorHandle } from "../../components/common/SmartEditor";
import { Box, Button, Typography, Stack } from "@mui/material";
import axios from "axios";

const SmartEditor = dynamic(() => import("../../components/common/SmartEditor"), { ssr: false });

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

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setContent(notice.content);
      editorRef.current.setReadOnly(true);
    }
  }, [notice]);

  return (
    <Layout>
      <Stack spacing={2}>
        <Typography variant="h5">{notice.title}</Typography>
        <Typography variant="subtitle2">{notice.type}</Typography>
        <SmartEditor ref={editorRef} />
        <Box>
          <Button variant="contained" href="/notice">
            목록
          </Button>
        </Box>
      </Stack>
    </Layout>
  );
}

// 서버사이드에서 동적 params 처리
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  try {
    const res = await axios.get(`https://qwer-fansite-admin.vercel.app/api/notices/${id}`);
    return { props: { notice: res.data } };
  } catch (err) {
    console.error(err);
    return { notFound: true };
  }
};
