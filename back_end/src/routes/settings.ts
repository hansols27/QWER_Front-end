import { Router } from "express";
import multer from "multer";
import { db, bucket } from "../firebaseConfig";
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
    res.json(docSnap.data() as SettingsData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// POST /api/settings → 이미지 + SNS 링크
router.post("/", upload.single("image"), async (req, res) => {
  try {
    let snsLinks: SnsLink[] = [];
    try { snsLinks = JSON.parse(req.body.snsLinks || "[]"); } 
    catch { return res.status(400).json({ success: false, message: "Invalid SNS links" }); }

    let mainImageUrl = "";
    if (req.file) {
      const file = bucket.file("images/main.png");
      await file.save(req.file.buffer, { contentType: req.file.mimetype, resumable: false });
      await file.makePublic();
      mainImageUrl = file.publicUrl();
    }

    const settingsData: SettingsData = { snsLinks, mainImage: mainImageUrl };
    await db.doc("settings/main").set(settingsData);

    res.json({ success: true, data: settingsData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save settings" });
  }
});

export default router;
