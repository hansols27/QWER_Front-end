"use client"

import { ReactNode } from "react"
import { ThemeProvider, CssBaseline } from "@mui/material"
import Sidebar from "./Sidebar"
import theme from "@/theme"
import "@/globals.css"

export const metadata = {
  title: "QWER",
  description: "QWER Admin",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6 bg-gray-50">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
