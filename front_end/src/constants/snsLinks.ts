// 이미지 import
import instagramIcon from '@front/assets/icons/sns_instagram.png';
import twitterIcon from '@front/assets/icons/sns_twitter.png';
import youtubeIcon from '@front/assets/icons/sns_youtube.png';
import cafeIcon from '@front/assets/icons/sns_cafe.png';
import shopIcon from '@/front/assets/icons/sns_shop.png';

export const socialLinks = [
  {
    id: 'instagram',
    url: 'https://www.instagram.com/qwerband_official/#',
    icon: instagramIcon,
  },
  { id: 'twitter', url: 'https://x.com/official_QWER', icon: twitterIcon },
  {
    id: 'youtube',
    url: 'https://www.youtube.com/channel/UCgD0APk2x9uBlLM0UsmhQjw',
    icon: youtubeIcon,
  },
  { id: 'cafe', url: 'https://cafe.naver.com/eggkim', icon: cafeIcon },
  {
    id: 'shop',
    url: 'https://qwershop.kr/index.html',
    icon: shopIcon,
    type: 'tp1',
  },
];
