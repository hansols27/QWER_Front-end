import { Router } from "express";
import multer from "multer";
import { bucket, db } from "../firebaseConfig";
import type { MemberPayload } from "@shared/types/member";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/member
router.post("/", upload.array("images"), async (req, res) => {
  try {
    const data = JSON.parse(req.body.payload) as MemberPayload;
    const files = req.files as Express.Multer.File[];

    // 이미지 업로드
    const uploadedImages: string[] = [];
    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${data.id}${String(i + 1).padStart(2, "0")}.png`;
        const fileRef = bucket.file(`images/members/${fileName}`);
        await fileRef.save(file.buffer, { contentType: file.mimetype });
        await fileRef.makePublic();
        uploadedImages.push(fileRef.publicUrl());
      }
    }

    // 이미지 URL을 contents에 반영
    const contentsWithImages = data.contents.map((c) =>
      c.type === "image" ? { ...c, content: uploadedImages.shift() || "" } : c
    );

    // Firestore 저장
    await db.doc(`members/${data.id}`).set({
      ...data,
      contents: contentsWithImages,
    });

    res.json({ success: true, data: { ...data, contents: contentsWithImages } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save member" });
  }
});

export default router;
