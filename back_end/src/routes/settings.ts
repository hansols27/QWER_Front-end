import { Router } from "express";
import multer from "multer";
import { db, bucket } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import type { SettingsData, SnsLink } from "@shared/types/settings";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    const docRef = db.doc("settings/main");
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.json({
        mainImage: "",
        snsLinks: [
          { id: "instagram", url: "" },
          { id: "youtube", url: "" },
          { id: "twitter", url: "" },
          { id: "cafe", url: "" },
          { id: "shop", url: "" },
        ],
      });
    }

    const data = docSnap.data() as SettingsData;

    const defaultIds: SnsLink["id"][] = ["instagram", "youtube", "twitter", "cafe", "shop"];
    const snsLinks: SnsLink[] = defaultIds.map((id) => {
      const link = data.snsLinks.find((l) => l.id === id);
      return link || { id, url: "" };
    });

    res.json({ ...data, snsLinks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// POST /api/settings → 이미지 + SNS 링크
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // SNS 링크 파싱 및 타입 단언
    let snsLinks: SnsLink[] = [];
    try {
      snsLinks = JSON.parse(req.body.snsLinks || "[]") as SnsLink[];
      if (!Array.isArray(snsLinks) || !snsLinks.every(l => l.id && l.url)) {
        throw new Error("Invalid SNS link structure");
      }
    } catch {
      return res.status(400).json({ success: false, message: "Invalid SNS links" });
    }

    // 이미지 업로드
    let mainImageUrl = "";
    if (req.file) {
      const fileName = `images/main_${uuidv4()}.png`;
      const file = bucket.file(fileName);
      await file.save(req.file.buffer, { contentType: req.file.mimetype, resumable: false });
      await file.makePublic();
      mainImageUrl = file.publicUrl();
    }

    const settingsData: SettingsData = { snsLinks, mainImage: mainImageUrl };
    await db.doc("settings/main").set(settingsData, { merge: true });

    res.json({ success: true, data: settingsData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save settings" });
  }
});

export default router;
