import { Router } from "express";
import multer from "multer";
import path from "path";
import { SettingsData } from "../../shared/types/settings";

const router = Router();

// 파일 저장 위치와 이름 지정
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 메모리에 임시 데이터 저장 (DB 대체)
let settings: SettingsData = {
  mainImage: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  cafe: "",
  shop: "",
};

// GET - 설정 불러오기
router.get("/", (req, res) => {
  res.json(settings);
});

// POST - 설정 저장
router.post("/", upload.single("mainImage"), (req, res) => {
  const { instagram, youtube, tiktok, cafe, shop } = req.body;

  if (req.file) {
    settings.mainImage = `/uploads/${req.file.filename}`;
  }

  settings = {
    ...settings,
    instagram,
    youtube,
    tiktok,
    cafe,
    shop,
  };

  res.json(settings);
});

export default router;
