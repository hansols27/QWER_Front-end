import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import type { SettingsData, SnsLink } from "@shared/types/settings";

const router = Router();

// 업로드 폴더와 multer 설정
const upload = multer({ dest: path.join(__dirname, "../../uploads/") });

// JSON 저장 경로
const settingsFile = path.join(__dirname, "../../data/settings.json");

// 기본 설정
const defaultSettings: SettingsData = {
  mainImage: "/assets/images/main.png",
  snsLinks: [
    { id: "instagram", url: "" },
    { id: "youtube", url: "" },
    { id: "twitter", url: "" },
    { id: "cafe", url: "" },
    { id: "shop", url: "" },
  ],
};

// JSON 불러오기
function loadSettings(): SettingsData {
  if (fs.existsSync(settingsFile)) {
    const raw = fs.readFileSync(settingsFile, "utf-8");
    return JSON.parse(raw) as SettingsData;
  }
  return defaultSettings;
}

// JSON 저장
function saveSettings(data: SettingsData) {
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/settings
router.get("/", (req, res) => {
  const settings = loadSettings();
  res.json(settings);
});

// POST /api/settings → 이미지 + SNS 링크
router.post("/", upload.single("image"), (req, res) => {
  const snsLinks: SnsLink[] = JSON.parse(req.body.snsLinks || "[]");
  const settings = loadSettings();

  // 이미지 업로드 처리
  if (req.file) {
    const ext = path.extname(req.file.originalname);
    const targetPath = path.join(
      __dirname,
      "../../front_end/src/assets/images/main.png"
    );
    fs.renameSync(req.file.path, targetPath);
    settings.mainImage = "/assets/images/main.png";
  }

  // SNS 링크 업데이트
  settings.snsLinks = settings.snsLinks.map((link) => {
    const updated = snsLinks.find((l) => l.id === link.id);
    return updated ? { ...link, url: updated.url } : link;
  });

  // JSON 파일에 저장
  saveSettings(settings);

  res.json({ success: true, data: settings });
});

export default router;
