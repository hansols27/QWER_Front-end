import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SettingsData } from '@shared/types/settings';

const router = Router();

// 업로드 폴더 보장
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 데이터 저장 파일 경로
const settingsFile = path.join(__dirname, '../data/settings.json');
if (!fs.existsSync(path.dirname(settingsFile))) {
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
}

// 파일 저장 위치와 이름 지정
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// JSON 파일에서 데이터 불러오기
const loadSettings = (): SettingsData => {
  if (fs.existsSync(settingsFile)) {
    const raw = fs.readFileSync(settingsFile, 'utf-8');
    return JSON.parse(raw);
  }
  return {
    mainImage: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    cafe: '',
    shop: '',
  };
};

// JSON 파일에 데이터 저장
const saveSettingsToFile = (settings: SettingsData) => {
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
};

// 메모리 캐싱
let settings: SettingsData = loadSettings();

// GET - 설정 불러오기
router.get('/', (req, res) => {
  res.json(settings);
});

// POST - 설정 저장
router.post('/', upload.single('mainImage'), (req, res) => {
  const body = req.body as Partial<SettingsData>;

  if (req.file) {
    settings.mainImage = `/uploads/${req.file.filename}`;
  }

  settings = {
    ...settings,
    instagram: body.instagram || settings.instagram,
    youtube: body.youtube || settings.youtube,
    tiktok: body.tiktok || settings.tiktok,
    cafe: body.cafe || settings.cafe,
    shop: body.shop || settings.shop,
  };

  // 파일에 저장
  saveSettingsToFile(settings);

  res.json(settings);
});

export default router;
