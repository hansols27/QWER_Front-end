import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import type { SettingsData, SnsLink } from "@shared/types/settings";

const router = Router();
const upload = multer({ dest: path.join(__dirname, "../../uploads/") });
const settingsFile = path.join(__dirname, "../../data/settings.json");

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

function loadSettings(): SettingsData {
  if (fs.existsSync(settingsFile)) {
    return JSON.parse(fs.readFileSync(settingsFile, "utf-8")) as SettingsData;
  }
  return defaultSettings;
}

function saveSettings(data: SettingsData) {
  if (!fs.existsSync(path.dirname(settingsFile))) {
    fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  }
  fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2), "utf-8");
}

// GET
router.get("/", (req, res) => {
  res.json(loadSettings());
});

// POST → 이미지 + SNS 링크
router.post("/", upload.single("image"), (req, res) => {
  const settings = loadSettings();
  let snsLinks: SnsLink[] = [];

  try {
    snsLinks = JSON.parse(req.body.snsLinks || "[]");
  } catch {
    return res.status(400).json({ success: false, message: "잘못된 SNS 링크 데이터" });
  }

  if (req.file) {
    try {
      const targetPath = path.join(
        __dirname,
        "../../front_end/src/assets/images/main.png"
      );
      fs.renameSync(req.file.path, targetPath);
      settings.mainImage = "/assets/images/main.png";
    } catch {
      return res.status(500).json({ success: false, message: "이미지 저장 실패" });
    }
  }

  settings.snsLinks = settings.snsLinks.map((link) => {
    const updated = snsLinks.find((l) => l.id === link.id);
    return updated ? { ...link, url: updated.url } : link;
  });

  try {
    saveSettings(settings);
  } catch {
    return res.status(500).json({ success: false, message: "설정 저장 실패" });
  }

  res.json({ success: true, data: settings });
});

export default router;
