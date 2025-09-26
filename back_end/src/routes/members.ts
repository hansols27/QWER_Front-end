import { Router } from "express";
import { db, bucket } from "../firebaseConfig";
import multer from "multer";
import path from "path";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const MEMBER_IDS = ["All", "Chodan", "Majenta", "Hina", "Siyeon"];
const MAX_IMAGES = 4;
const MIN_IMAGES = 1;
const MIN_TEXT = 1;
const MAX_SNS = 6;
const MIN_SNS = 1;

// ----------------------
// 멤버 저장 (이미지 + 기존 URL 유지 + SNSList 지원)
// ----------------------
router.post("/save", upload.array("images"), async (req, res) => {
  try {
    const { members } = JSON.parse(req.body.members);

    // 유효성 체크
    for (const id of MEMBER_IDS) {
      const member = members.find((m: any) => m.id === id);
      if (!member) throw new Error(`${id} 데이터가 없습니다.`);

      const textCount = member.contents.filter(
        (c: any) => c.type === "text" && typeof c.content === "string" && c.content.trim() !== ""
      ).length;

      const imageCount = member.contents.filter((c: any) => c.type === "image").length;

      // snsList 사용 시 우선 적용
      const snsCount = Array.isArray(member.snsList)
        ? member.snsList.filter((s: any) => typeof s.url === "string" && s.url.trim() !== "").length
        : Object.values(member.sns || {}).filter((v): v is string => typeof v === "string" && v.trim() !== "").length;

      if (textCount < MIN_TEXT) throw new Error(`${id} 내용을 입력해 주세요.`);
      if (imageCount < MIN_IMAGES || imageCount > MAX_IMAGES)
        throw new Error(`${id} 이미지는 최소 ${MIN_IMAGES}개, 최대 ${MAX_IMAGES}개 필요합니다.`);
      if (snsCount < MIN_SNS || snsCount > MAX_SNS)
        throw new Error(`${id} SNS는 최소 ${MIN_SNS}개, 최대 ${MAX_SNS}개 필요합니다.`);
    }

    // ----------------------
    // 이미지 업로드 처리
    // ----------------------
    const uploadedUrls: Record<string, string[]> = {};
    for (const file of req.files as Express.Multer.File[]) {
      const [memberId, indexStr] = file.originalname.split("_");
      const ext = path.extname(file.originalname);
      const fileName = `member/${memberId}/${memberId}_${indexStr}${ext}`;
      const fileRef = bucket.file(fileName);

      await fileRef.save(file.buffer, {
        contentType: file.mimetype,
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      if (!uploadedUrls[memberId]) uploadedUrls[memberId] = [];
      uploadedUrls[memberId].push(publicUrl);
    }

    // ----------------------
    // Firestore 저장 (이미지 URL 매핑 + SNSList → sns 변환)
    // ----------------------
    for (const member of members) {
      const imagesFromUpload = uploadedUrls[member.id] || [];

      const contentsWithImages = member.contents
        .map((c: any) => {
          if (c.type === "image" && typeof c.content !== "string") {
            const url = imagesFromUpload.shift();
            return url ? { ...c, content: url } : null;
          }
          return c;
        })
        .filter(Boolean); // null 제거

      // SNS 변환: snsList → sns 객체
      const snsObj: Record<string, string> = {};
      if (Array.isArray(member.snsList)) {
        member.snsList.forEach((s: any) => {
          if (typeof s.url === "string" && s.url.trim() !== "") {
            snsObj[s.key] = s.url.trim();
          }
        });
      } else if (member.sns) {
        Object.entries(member.sns).forEach(([k, v]) => {
          if (typeof v === "string" && v.trim() !== "") snsObj[k] = v.trim();
        });
      }

      await db.collection("members").doc(member.id).set({
        id: member.id,
        name: member.name || member.id,
        contents: contentsWithImages,
        sns: snsObj,
        updatedAt: new Date(),
      });
    }

    res.json({ success: true, uploadedUrls });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------
// 멤버 불러오기
// ----------------------
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("members").get();
    const members = snapshot.docs.map((doc) => doc.data());
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "멤버 불러오기 실패" });
  }
});

export default router;
