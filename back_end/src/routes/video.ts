import { Router } from "express";
import * as videoController from "../controllers/videoController";

const router = Router();

router.get("/", videoController.getVideos);
router.get("/:id", videoController.getVideoById);
router.post("/", videoController.createVideo);
router.put("/:id", videoController.updateVideo);
router.delete("/:id", videoController.deleteVideo);

export default router;
