import express from "express";
import cors from "cors";
import path from "path";
import settingsRouter from "./routes/settings"; 

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // 이미지 접근용

// ✅ settings 라우터 등록
app.use("/api/settings", settingsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
