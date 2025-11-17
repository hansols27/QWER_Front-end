import { FC, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import Sidebar from "./Sidebar";
import Head from "next/head";

type LayoutProps = {
  children: ReactNode;
};

const Layout: FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 로그인 페이지는 Layout 적용 X
    if (router.pathname === "/login") {
      setLoading(false);
      return;
    }

    if (!token) {
      router.replace("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (    
    <>
    <Head>
        <title>QWER 관리자</title>
      </Head>
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: "grey.50", minHeight: "100vh" }}>
        {children}
      </Box>
    </Box>
    </>
  );
};

export default Layout;
