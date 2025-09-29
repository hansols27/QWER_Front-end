import { Router } from "express";
import * as noticeController from "../controllers/noticeController";

const router = Router();

// /api/notices
router.get("/", noticeController.getNotices);
router.get("/:id", noticeController.getNotice);
router.post("/", noticeController.createNotice);
router.put("/:id", noticeController.updateNotice);
router.delete("/:id", noticeController.deleteNotice);

export default router;
