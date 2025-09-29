import { db } from '../firebaseConfig';
import { ScheduleEvent } from '@shared/types/schedule';
import { v4 as uuidv4 } from 'uuid';

/**
 * 스케줄 생성
 */
export const createSchedule = async (data: Omit<ScheduleEvent, 'id'>): Promise<{ id: string }> => {
  const id = uuidv4();
  const schedule: ScheduleEvent = { id, ...data };
  await db.collection('schedules').doc(id).set(schedule);
  return { id };
};

/**
 * 모든 스케줄 조회
 */
export const getAllSchedules = async (): Promise<ScheduleEvent[]> => {
  const snap = await db.collection('schedules').get();
  return snap.docs.map(doc => doc.data() as ScheduleEvent);
};

/**
 * 스케줄 수정
 */
export const updateSchedule = async (id: string, data: Partial<ScheduleEvent>): Promise<void> => {
  await db.collection('schedules').doc(id).set(data, { merge: true });
};

/**
 * 스케줄 삭제
 */
export const deleteSchedule = async (id: string): Promise<void> => {
  await db.collection('schedules').doc(id).delete();
};
