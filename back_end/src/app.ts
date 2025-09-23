import express from "express";
import cors from "cors";
import settingsRouter from "./routes/settings";

const app = express();

// ✅ CORS (admin, user front 둘 다 허용)
app.use(cors({
  origin: [
    "https://qwer-fansite-admin.vercel.app/", // 관리자
    "https://qwer-fansite-front.vercel.app/"        // 사용자 사이트
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// ✅ 라우트 등록
app.use("/api/settings", settingsRouter);

export default app;
