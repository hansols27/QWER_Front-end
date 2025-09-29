import { db } from "../firebaseConfig";

interface NoticeData {
  type: "공지" | "이벤트";
  title: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ 목록 조회
export async function getNotices() {
  const snapshot = await db.collection("notices").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ✅ 상세 조회
export async function getNotice(id: string) {
  const doc = await db.collection("notices").doc(id).get();
  if (!doc.exists) throw new Error("공지 없음");
  return { id: doc.id, ...doc.data() };
}

// ✅ 등록
export async function createNotice(data: NoticeData) {
  const ref = await db.collection("notices").add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id: ref.id };
}

// ✅ 수정
export async function updateNotice(id: string, data: Partial<NoticeData>) {
  await db.collection("notices").doc(id).update({
    ...data,
    updatedAt: new Date(),
  });
}

// ✅ 삭제
export async function deleteNotice(id: string) {
  await db.collection("notices").doc(id).delete();
}
