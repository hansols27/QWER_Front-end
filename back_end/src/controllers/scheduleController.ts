import { Request, Response } from 'express';
import * as scheduleService from '../services/scheduleService';
import { ScheduleEvent } from '@shared/types/schedule';

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const data = req.body as Omit<ScheduleEvent, 'id'>;
    const result = await scheduleService.createSchedule(data);
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const schedules: ScheduleEvent[] = await scheduleService.getAllSchedules();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body as Partial<ScheduleEvent>;
    await scheduleService.updateSchedule(id, data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await scheduleService.deleteSchedule(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};
