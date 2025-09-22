import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import type { SnsLink } from '@shared/types/settings';

const router = Router();

// 1️⃣ 파일 업로드 설정
const upload = multer({ dest: 'uploads/' });

// 2️⃣ 메인 이미지 업로드 API
router.post('/main-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const targetPath = path.join(__dirname, '../../front_end/src/assets/images/main.png');

  fs.rename(req.file.path, targetPath, (err) => {
    if (err) return res.status(500).json({ error: 'File save error' });
    res.json({ success: true, url: '/assets/images/main.png' });
  });
});

// 3️⃣ SNS 링크 저장 API
router.post('/sns-links', (req, res) => {
  const snsLinks: SnsLink[] = req.body; // req.body 타입 명시

  const filePath = path.join(__dirname, '../../front_end/src/constants/snsLinks.ts');

  // 기존 아이콘 import 유지, URL만 교체
  const fileContent = `
import instagramIcon from '@front/assets/icons/sns_instagram.png';
import twitterIcon from '@front/assets/icons/sns_twitter.png';
import youtubeIcon from '@front/assets/icons/sns_youtube.png';
import cafeIcon from '@front/assets/icons/sns_cafe.png';
import shopIcon from '@front/assets/icons/sns_shop.png';
import { SnsLink } from '@shared/types/settings';

export const socialLinks: SnsLink[] = [
  { id: 'instagram', url: '${snsLinks.find((l: SnsLink) => l.id==='instagram')?.url || ''}', icon: instagramIcon },
  { id: 'twitter', url: '${snsLinks.find((l: SnsLink) => l.id==='twitter')?.url || ''}', icon: twitterIcon },
  { id: 'youtube', url: '${snsLinks.find((l: SnsLink) => l.id==='youtube')?.url || ''}', icon: youtubeIcon },
  { id: 'cafe', url: '${snsLinks.find((l: SnsLink) => l.id==='cafe')?.url || ''}', icon: cafeIcon },
  { id: 'shop', url: '${snsLinks.find((l: SnsLink) => l.id==='shop')?.url || ''}', icon: shopIcon }
];
`;

  fs.writeFile(filePath, fileContent, (err) => {
    if (err) return res.status(500).json({ error: 'SNS link save error' });
    res.json({ success: true });
  });
});

export default router;
