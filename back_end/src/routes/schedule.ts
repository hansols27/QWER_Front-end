import { Router } from "express";
import { db } from "../firebaseConfig";
import { ScheduleEvent } from "@shared/types/schedule";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const COLLECTION = "schedules";

// 일정 조회
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).get();
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      start: doc.data().start.toDate(),
      end: doc.data().end.toDate(),
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
});

// 일정 추가
router.post("/", async (req, res) => {
  try {
    const id = uuidv4();
    const { start, end, type, title, allDay } = req.body as ScheduleEvent;
    await db.collection(COLLECTION).doc(id).set({
      start: new Date(start),
      end: new Date(end),
      type,
      title,
      allDay,
    });
    res.json({ id, start, end, type, title, allDay });
  } catch (err) {
    res.status(500).json({ error: "Failed to add schedule" });
  }
});

// 일정 수정
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, type, title, allDay } = req.body as ScheduleEvent;
    await db.collection(COLLECTION).doc(id).update({
      start: new Date(start),
      end: new Date(end),
      type,
      title,
      allDay,
    });
    res.json({ id, start, end, type, title, allDay });
  } catch (err) {
    res.status(500).json({ error: "Failed to update schedule" });
  }
});

// 일정 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(COLLECTION).doc(id).delete();
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

export default router;
