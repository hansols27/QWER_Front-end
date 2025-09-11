import { ReactNode } from "react";
import { CssBaseline, Box } from "@mui/material";
import Sidebar from "./Sidebar"; // Sidebar는 별도 파일 유지

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <title>Admin Page</title>
      </head>
      <body>
        {/* 전체 레이아웃 */}
        <Box sx={{ display: "flex" }}>
          {/* 전역 스타일 리셋 */}
          <CssBaseline />

          {/* 사이드바 */}
          <Sidebar />

          {/* 본문 영역 */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              bgcolor: "grey.50",
              minHeight: "100vh",
            }}
          >
            {children}
          </Box>
        </Box>
      </body>
    </html>
  );
}
