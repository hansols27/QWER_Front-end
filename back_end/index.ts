import express from 'express';
import cors from 'cors';
import path from 'path';
import settingsRouter from './routes/settings';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 업로드 폴더 static 경로 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 라우트
app.use('/api/settings', settingsRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
