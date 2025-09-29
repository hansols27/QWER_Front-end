import { Request, Response } from 'express';
import * as profileService from '../services/profileService';
import { MemberState } from '@shared/types/member';

export const createOrUpdateProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const name = req.body.name as string;
    const data: MemberState = JSON.parse(req.body.data || '{}');
    const files = req.files as Express.Multer.File[] | undefined;

    const result = await profileService.saveProfile(id, name, data, files);

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const profile = await profileService.getProfileById(id);
    res.json(profile || {});
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};
