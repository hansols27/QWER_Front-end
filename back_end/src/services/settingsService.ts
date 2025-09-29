import { db, bucket } from "../firebaseConfig";
import type { SettingsData, SnsLink } from "@shared/types/settings";

const DEFAULT_SNS_IDS: SnsLink["id"][] = ["instagram", "youtube", "twitter", "cafe", "shop"];

/**
 * 설정 조회
 */
export const getSettings = async (): Promise<SettingsData> => {
  const docSnap = await db.doc("settings/main").get();
  if (!docSnap.exists) {
    return { mainImage: "", snsLinks: DEFAULT_SNS_IDS.map(id => ({ id, url: "" })) };
  }

  const stored = docSnap.data() as SettingsData;
  return {
    mainImage: stored.mainImage || "",
    snsLinks: DEFAULT_SNS_IDS.map(id => stored.snsLinks.find(l => l.id === id) || { id, url: "" })
  };
};

/**
 * 설정 저장
 */
export const saveSettings = async (snsLinks: SnsLink[], file?: Express.Multer.File): Promise<SettingsData> => {
  // 누락된 SNS id 기본값 보장
  const finalSnsLinks = DEFAULT_SNS_IDS.map(id => snsLinks.find(l => l.id === id) || { id, url: "" });

  // 이미지 업로드 (덮어쓰기)
  let mainImage = "";
  if (file) {
    const storageFile = bucket.file("images/main.png"); // 항상 main.png 덮어쓰기
    await storageFile.save(file.buffer, { contentType: file.mimetype, resumable: false });
    await storageFile.makePublic();
    mainImage = storageFile.publicUrl();
  } else {
    const docSnap = await db.doc("settings/main").get();
    mainImage = docSnap.exists ? (docSnap.data() as SettingsData).mainImage || "" : "";
  }

  const settingsData: SettingsData = { snsLinks: finalSnsLinks, mainImage };
  await db.doc("settings/main").set(settingsData, { merge: true });

  return settingsData;
};
