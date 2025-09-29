import { Router } from 'express';
import { multerMemory } from '../utils/upload';
import * as profileController from '../controllers/profileController';

const router = Router();

// POST: 프로필 생성/수정 (이미지 최대 4개)
router.post('/profile/:id', multerMemory.array('images', 4), profileController.createOrUpdateProfile);

// GET: 프로필 조회
router.get('/profile/:id', profileController.getProfile);

export default router;
