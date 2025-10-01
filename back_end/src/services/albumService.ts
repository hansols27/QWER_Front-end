import { db, bucket } from "../firebaseConfig";
import type { AlbumItem } from "@shared/types/album";
import { v4 as uuidv4 } from "uuid";

export async function getAlbums(): Promise<AlbumItem[]> {
  const snapshot = await db.collection("albums").orderBy("date", "desc").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as AlbumItem;
    return { ...data, id: doc.id }; // id는 한 번만 포함
  });
}

export async function getAlbumById(id: string): Promise<AlbumItem | null> {
  const doc = await db.collection("albums").doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() as AlbumItem;
  return { ...data, id: doc.id };
}

export async function createAlbum(data: Partial<AlbumItem>, file?: Express.Multer.File): Promise<AlbumItem> {
  let imageUrl = "";
  if (file) {
    const fileRef = bucket.file(`albums/${uuidv4()}.png`);
    await fileRef.save(file.buffer, { contentType: file.mimetype, resumable: false });
    await fileRef.makePublic();
    imageUrl = fileRef.publicUrl();
  }

  const albumData: Omit<AlbumItem, "id"> = {
    title: data.title!,
    date: data.date!,
    description: data.description || "",
    tracks: data.tracks || [],
    videoUrl: data.videoUrl || "",
    image: imageUrl,
  };

  const docRef = await db.collection("albums").add(albumData);

  return { ...albumData, id: docRef.id }; // id는 여기서만 추가
}

export async function updateAlbum(id: string, data: Partial<AlbumItem>, file?: Express.Multer.File): Promise<AlbumItem | null> {
  const docRef = db.collection("albums").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  let imageUrl = doc.data()?.image || "";
  if (file) {
    const fileRef = bucket.file(`albums/${uuidv4()}.png`);
    await fileRef.save(file.buffer, { contentType: file.mimetype, resumable: false });
    await fileRef.makePublic();
    imageUrl = fileRef.publicUrl();
  }

  const updateData = { ...data, image: imageUrl };
  await docRef.update(updateData);

  const updatedDoc = await docRef.get();
  const updatedData = updatedDoc.data() as AlbumItem;
  return { ...updatedData, id: updatedDoc.id };
}

export async function deleteAlbum(id: string): Promise<void> {
  await db.collection("albums").doc(id).delete();
}
