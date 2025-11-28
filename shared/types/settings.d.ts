export interface SnsLink {
  id: "instagram" | "youtube" | "twitter" | "cafe" | "shop";
  url: string;
  icon?: StaticImageData;
}

export interface SettingsData {
  mainImage?: string;
  snsLinks: SnsLink[]; // 백엔드에서 URL 데이터만 저장/로드
}