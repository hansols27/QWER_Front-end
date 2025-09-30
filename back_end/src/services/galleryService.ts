import { db, bucket } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";

export interface GalleryItem {
  id: string;
  url: string;
  createdAt: string;
}

// 갤러리 목록 조회
export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  const snapshot = await db.collection("gallery").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { url: string; createdAt: string }),
  }));
};

// 이미지 업로드
export const uploadGalleryImages = async (files: Express.Multer.File[]): Promise<GalleryItem[]> => {
  const uploadedItems: GalleryItem[] = [];

  for (const file of files) {
    const fileName = `gallery/${uuidv4()}.png`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });

    await fileRef.makePublic();
    const url = fileRef.publicUrl();

    const docRef = await db.collection("gallery").add({
      url,
      createdAt: new Date().toISOString(),
    });

    uploadedItems.push({ id: docRef.id, url, createdAt: new Date().toISOString() });
  }

  return uploadedItems;
};

// 이미지 삭제
export const deleteGalleryImage = async (id: string) => {
  const docRef = db.collection("gallery").doc(id);
  const docSnap = await docRef.get();

  if (!docSnap.exists) throw new Error("Gallery item not found");

  const data = docSnap.data() as { url: string };
  const url = data.url;

  // Firebase Storage에서 파일 삭제
  const filePath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
  const fileRef = bucket.file(filePath);
  await fileRef.delete();

  // Firestore 문서 삭제
  await docRef.delete();
};
