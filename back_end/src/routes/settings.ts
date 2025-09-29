import { Router } from "express";
import multer from "multer";
import * as settingsController from "../controllers/settingsController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/settings
router.get("/", settingsController.getSettings);

// POST /api/settings → 이미지 + SNS 링크
router.post("/", upload.single("image"), settingsController.saveSettings);

export default router;
