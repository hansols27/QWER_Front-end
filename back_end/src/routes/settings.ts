import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import type { SettingsData, SnsLink } from "@shared/types/settings";

const router = Router();

// multer 설정 (이미지 업로드용)
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
    return JSON.parse(fs.readFileSync(settingsFile, "utf-8")) as SettingsData;
  }
  return defaultSettings;
}

// JSON 저장
function saveSettings(data: SettingsData) {
  if (!fs.existsSync(path.dirname(settingsFile))) {
    fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  }
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/settings
router.get("/", (req, res) => {
  const settings = loadSettings();
  res.json(settings);
});

// POST /api/settings → 이미지 + SNS 링크
router.post("/", upload.single("image"), (req, res) => {
  const settings = loadSettings();

  // SNS 링크 파싱
  let snsLinks: SnsLink[] = [];
  try {
    snsLinks = JSON.parse(req.body.snsLinks || "[]");
  } catch (err) {
    console.error("SNS 링크 파싱 실패:", err);
    return res.status(400).json({ success: false, message: "잘못된 SNS 링크 데이터" });
  }

  // 이미지 업로드 처리 (선택)
  if (req.file) {
    try {
      const targetPath = path.join(
        __dirname,
        "../../front_end/src/assets/images/main.png"
      );
      fs.renameSync(req.file.path, targetPath);
      settings.mainImage = "/assets/images/main.png";
    } catch (err) {
      console.error("이미지 저장 실패:", err);
      return res.status(500).json({ success: false, message: "이미지 저장 실패" });
    }
  }

  // SNS 링크 업데이트
  settings.snsLinks = settings.snsLinks.map((link) => {
    const updated = snsLinks.find((l) => l.id === link.id);
    return updated ? { ...link, url: updated.url } : link;
  });

  // JSON 저장
  try {
    saveSettings(settings);
  } catch (err) {
    console.error("설정 저장 실패:", err);
    return res.status(500).json({ success: false, message: "설정 저장 실패" });
  }

  res.json({ success: true, data: settings });
});

export default router;
