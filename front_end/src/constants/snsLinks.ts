import { useEffect, useState } from "react";
import instagramIcon from "@front/assets/icons/sns_instagram.png";
import twitterIcon from "@front/assets/icons/sns_twitter.png";
import youtubeIcon from "@front/assets/icons/sns_youtube.png";
import cafeIcon from "@front/assets/icons/sns_cafe.png";
import shopIcon from "@front/assets/icons/sns_shop.png";
import type { SnsLink, SettingsData } from "@shared/types/settings";

const defaultLinks: SnsLink[] = [
  { id: "instagram", url: "", icon: instagramIcon },
  { id: "twitter", url: "", icon: twitterIcon },
  { id: "youtube", url: "", icon: youtubeIcon },
  { id: "cafe", url: "", icon: cafeIcon },
  { id: "shop", url: "", icon: shopIcon },
];

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL; 

// ⭐️ API URL이 설정되지 않았을 경우, 콘솔에 경고를 출력합니다.
if (!NEXT_PUBLIC_API_URL) {
  console.error("NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않아 API 호출이 실패할 수 있습니다.");
}

export function useSocialLinks(): SnsLink[] {
  const [socialLinks, setSocialLinks] = useState<SnsLink[]>(defaultLinks);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchLinks() {
      // ⭐️ 변경: API URL이 설정되지 않았으면 호출을 건너뛰도록 방어 로직 추가
      if (!NEXT_PUBLIC_API_URL) return;
      
      try {
        // ⭐️ 변경: NEXT_PUBLIC_API_URL 상수를 사용하여 fetch를 호출합니다.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`, { signal: abortController.signal });
        if (!res.ok) throw new Error("Failed to fetch settings");

        const data: SettingsData = await res.json();

        const mergedLinks: SnsLink[] = defaultLinks.map((link) => {
          const match = data.snsLinks.find((l) => l.id === link.id);
          return { ...link, url: match?.url ?? "" };
        });

        setSocialLinks(mergedLinks);
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        console.error("SNS 링크 불러오기 실패", err);
        setSocialLinks(defaultLinks);
      }
    }

    fetchLinks();
    return () => abortController.abort();
  }, []);

  return socialLinks;
}