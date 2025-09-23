import { useEffect, useState } from "react";
import instagramIcon from '@front/assets/icons/sns_instagram.png';
import twitterIcon from '@front/assets/icons/sns_twitter.png';
import youtubeIcon from '@front/assets/icons/sns_youtube.png';
import cafeIcon from '@front/assets/icons/sns_cafe.png';
import shopIcon from '@front/assets/icons/sns_shop.png';
import type { SnsLink, SettingsData } from '@shared/types/settings';

// 기본 구조: 아이콘만 지정, URL은 나중에 API에서 가져옴
const defaultLinks: SnsLink[] = [
  { id: 'instagram', url: '', icon: instagramIcon },
  { id: 'twitter', url: '', icon: twitterIcon },
  { id: 'youtube', url: '', icon: youtubeIcon },
  { id: 'cafe', url: '', icon: cafeIcon },
  { id: 'shop', url: '', icon: shopIcon },
];

// 훅으로 동적 SNS 링크 가져오기
export function useSocialLinks() {
  const [socialLinks, setSocialLinks] = useState<SnsLink[]>(defaultLinks);

  useEffect(() => {
    async function fetchLinks() {
      try {
        const res = await fetch("http://localhost:4000/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data: SettingsData = await res.json();

        // admin에서 입력한 URL로 덮어쓰기
        const mergedLinks = defaultLinks.map(link => {
          const match = data.snsLinks.find(l => l.id === link.id);
          return { ...link, url: match?.url ?? '' };
        });

        setSocialLinks(mergedLinks);
      } catch (err) {
        console.error("SNS 링크 불러오기 실패", err);
        setSocialLinks(defaultLinks); // 실패 시 기본값 유지
      }
    }

    fetchLinks();
  }, []);

  return socialLinks;
}
