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

const API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_API_URL_PROD
    : process.env.NEXT_PUBLIC_API_URL;

export function useSocialLinks(): SnsLink[] {
  const [socialLinks, setSocialLinks] = useState<SnsLink[]>(defaultLinks);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchLinks() {
      try {
        const res = await fetch(`${API_URL}/api/settings`, { signal: abortController.signal });
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
