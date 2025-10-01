import { db } from "../firebaseConfig";
import { VideoItem } from "@shared/types/video";

const COLLECTION = "videos";

// 전체 조회
export async function getVideos(): Promise<VideoItem[]> {
  const snapshot = await db.collection(COLLECTION).orderBy("id", "desc").get();
  return snapshot.docs.map((doc) => doc.data() as VideoItem);
}

// 단일 조회
export async function getVideoById(id: string): Promise<VideoItem | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as VideoItem;
}

// 등록
export async function createVideo(data: Omit<VideoItem, "id">): Promise<VideoItem> {
  const docRef = await db.collection(COLLECTION).add(data);
  await docRef.update({ id: docRef.id });
  const doc = await docRef.get();
  return doc.data() as VideoItem;
}

// 수정
export async function updateVideo(id: string, data: Partial<VideoItem>): Promise<void> {
  await db.collection(COLLECTION).doc(id).update(data);
}

// 삭제
export async function deleteVideo(id: string): Promise<void> {
  await db.collection(COLLECTION).doc(id).delete();
}
