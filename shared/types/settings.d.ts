// 공통 타입
export interface SnsLink {
  id: "instagram" | "youtube" | "twiter" | "cafe" | "shop";
  url: string;
  icon?: string; // frontend에서만 사용
}

export interface SettingsData {
  mainImage?: string; // 메인 이미지 URL
  snsLinks: SnsLink[];
}
