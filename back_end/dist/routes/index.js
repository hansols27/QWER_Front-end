"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_1 = __importDefault(require("./settings"));
/*import profileRoutes from "./profile";
import discographyRoutes from "./discography";
import galleryRoutes from "./gallery";
import videoRoutes from "./video";
import noticeRoutes from "./notice";
import scheduleRoutes from "./schedule";
*/
const router = (0, express_1.Router)();
router.use("/settings", settings_1.default);
/*router.use("/profile", profileRoutes);
router.use("/discography", discographyRoutes);
router.use("/gallery", galleryRoutes);
router.use("/video", videoRoutes);
router.use("/notice", noticeRoutes);
router.use("/schedule", scheduleRoutes);
*/
exports.default = router;
