import { Router } from "express";
import settingsRoutes from "./settings";
/*import profileRoutes from "./profile";
import discographyRoutes from "./discography";
import galleryRoutes from "./gallery";
import videoRoutes from "./video";
import noticeRoutes from "./notice";
import scheduleRoutes from "./schedule";
*/
const router = Router();

router.use("/settings", settingsRoutes);
/*router.use("/profile", profileRoutes);
router.use("/discography", discographyRoutes);
router.use("/gallery", galleryRoutes);
router.use("/video", videoRoutes);
router.use("/notice", noticeRoutes);
router.use("/schedule", scheduleRoutes);
*/
export default router;
