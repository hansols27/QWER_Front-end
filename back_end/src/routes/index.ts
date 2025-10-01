import { Router } from "express";
import settingsRoutes from "./settings";
import profileRoutes from "./members";
import galleryRoutes from "./gallery";
import noticeRoutes from "./notice";
import scheduleRoutes from "./schedule";
import discographyRoutes from "./album";
import videoRoutes from "./video";

const router = Router();

router.use("/settings", settingsRoutes);
router.use("/members", profileRoutes);
router.use("/gallery", galleryRoutes);
router.use("/notice", noticeRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/album", discographyRoutes);
router.use("/video", videoRoutes);

export default router;
