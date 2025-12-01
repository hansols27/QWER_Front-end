'use client';

import { useState, useEffect } from "react";
import type { SnsLink, SettingsData } from "@shared/types/settings";
import instagramIcon from "@front/assets/icons/sns_instagram.png";
import twitterIcon from "@front/assets/icons/sns_twitter.png";
import youtubeIcon from "@front/assets/icons/sns_youtube.png";
import cafeIcon from "@front/assets/icons/sns_cafe.png";
import shopIcon from "@front/assets/icons/sns_shop.png";
import { api } from "@services/axios";

const ICON_MAP: Record<SnsLink["id"], typeof instagramIcon> = {
  instagram: instagramIcon,
  twitter: twitterIcon,
  youtube: youtubeIcon,
  cafe: cafeIcon,
  shop: shopIcon,
};

export function useSocialLinks(): {
  snsLinks: SnsLink[];
  isLoading: boolean;
  refreshLinks: () => Promise<void>;
} {
  const [snsLinks, setSnsLinks] = useState<SnsLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: SettingsData }>("/api/settings");
      const data = res.data.data;

      // 백엔드에서 내려준 SNS 링크와 아이콘 매핑
      const linksWithIcon = data.snsLinks.map(link => ({
        ...link,
        icon: ICON_MAP[link.id],
      }));

      setSnsLinks(linksWithIcon);
    } catch (err) {
      console.error("SNS 링크 불러오기 실패:", err);

      // 실패 시 기본값 표시
      const defaultLinks: SnsLink[] = Object.keys(ICON_MAP).map(id => ({
        id: id as SnsLink["id"],
        url: "",
        icon: ICON_MAP[id as SnsLink["id"]],
      }));
      setSnsLinks(defaultLinks);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  return {
    snsLinks,
    isLoading,
    refreshLinks: fetchLinks,
  };
}
