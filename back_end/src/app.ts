import express from "express";
import cors from "cors";
import mainRouter from "./routes/index"; // ⭐️ 중앙 라우터를 임포트

const app = express();

app.use(cors({
  origin: [
    "https://qwer-fansite-admin.vercel.app", // admin 페이지의 실제 URL
    "https://qwer-fansite-front.vercel.app" // front_end 페이지의 실제 URL 
  ]
}));
app.use(express.json());

// ⭐️ 모든 API 요청을 '/api'로 묶고, 상세 경로는 index.ts 라우터에 위임
app.use("/api", mainRouter); 

export default app;
