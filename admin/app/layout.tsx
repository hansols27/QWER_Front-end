"use client"

import { ReactNode } from "react"
import { CssBaseline, Box } from "@mui/material"
import Sidebar from "@/app/Sidebar"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex" }}>
      {/* 전역 리셋 */}
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
  )
}
