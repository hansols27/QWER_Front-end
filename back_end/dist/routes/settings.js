"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const firebaseConfig_1 = require("../firebaseConfig");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// GET /api/settings
router.get("/", async (req, res) => {
    try {
        const docRef = firebaseConfig_1.db.doc("settings/main");
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
        res.json(docSnap.data());
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});
// POST /api/settings → 이미지 + SNS 링크
router.post("/", upload.single("image"), async (req, res) => {
    try {
        let snsLinks = [];
        try {
            snsLinks = JSON.parse(req.body.snsLinks || "[]");
        }
        catch {
            return res.status(400).json({ success: false, message: "Invalid SNS links" });
        }
        let mainImageUrl = "";
        if (req.file) {
            const file = firebaseConfig_1.bucket.file("images/main.png");
            await file.save(req.file.buffer, { contentType: req.file.mimetype, resumable: false });
            await file.makePublic();
            mainImageUrl = file.publicUrl();
        }
        const settingsData = { snsLinks, mainImage: mainImageUrl };
        await firebaseConfig_1.db.doc("settings/main").set(settingsData);
        res.json({ success: true, data: settingsData });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to save settings" });
    }
});
exports.default = router;
