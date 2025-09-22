export interface SnsLink {
  id: "instagram" | "tiktok" | "youtube" | "cafe" | "twitter" | "shop";
  url: string;
  icon: string; // 아이콘 파일 경로
}

export interface SettingsData {
  mainImageUrl: string;      // 예: "/assets/images/main.png"
  snsLinks: SnsLink[];
}
