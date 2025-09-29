import { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController';

const router = Router();

// POST: 스케줄 생성
router.post('/schedule', scheduleController.createSchedule);

// GET: 모든 스케줄 조회
router.get('/schedules', scheduleController.getSchedules);

// PUT: 스케줄 수정
router.put('/schedule/:id', scheduleController.updateSchedule);

// DELETE: 스케줄 삭제
router.delete('/schedule/:id', scheduleController.deleteSchedule);

export default router;
