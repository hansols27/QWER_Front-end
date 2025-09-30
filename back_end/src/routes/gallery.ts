import { Router } from "express";
import multer from "multer";
import * as galleryController from "../controllers/galleryController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", galleryController.getGallery);
router.post("/", upload.array("images"), galleryController.uploadGallery);
router.delete("/:id", galleryController.deleteGallery);

export default router;
