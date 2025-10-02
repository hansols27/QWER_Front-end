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

//NEXT_PUBLIC_API_URL 변수를 API_URL 상수로 가져옵니다.
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL; 

// API URL이 설정되지 않았을 경우, 콘솔에 경고를 출력합니다.
if (!NEXT_PUBLIC_API_URL) {
  console.error("NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않아 API 호출이 실패할 수 있습니다.");
}

export function useSocialLinks(): SnsLink[] {
  const [socialLinks, setSocialLinks] = useState<SnsLink[]>(defaultLinks);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchLinks() {
      // API_URL 상수가 정의되지 않았다면 호출을 건너뜁니다.
      if (!NEXT_PUBLIC_API_URL) return;
      
      try {
        //API_URL 상수를 사용하여 fetch를 호출합니다.
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/settings`, { signal: abortController.signal });
        if (!res.ok) throw new Error("Failed to fetch settings");

        // 1. 전체 응답 JSON을 받습니다.
        const responseJson: { success: boolean; data: SettingsData } = await res.json();
        
        // 2. 'data' 필드에서 실제 SettingsData 객체를 추출합니다.
        const data: SettingsData = responseJson.data;

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
