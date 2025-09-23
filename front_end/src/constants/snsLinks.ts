import { useState, useEffect } from "react";
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

export function useSocialLinks() {
  const [socialLinks, setSocialLinks] = useState<SnsLink[]>(defaultLinks);
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  useEffect(() => {
    async function fetchLinks() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data: SettingsData = await res.json();

        const mergedLinks = defaultLinks.map(link => {
          const match = data.snsLinks.find(l => l.id === link.id);
          return { ...link, url: match?.url ?? '' };
        });

        setSocialLinks(mergedLinks);
      } catch (err) {
        console.error("SNS 링크 불러오기 실패", err);
        setSocialLinks(defaultLinks);
      }
    }

    fetchLinks();
  }, [API_URL]);

  return socialLinks;
}
