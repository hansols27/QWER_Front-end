export interface Album {
  id: string; // URL-safe slug
  title: string;
  date: string;
  image: string;
  description?: string; // 여러 줄 가능 (pre-line으로 렌더링)
  tracks?: string[];
  videoUrl?: string; // 유튜브 영상 URL
}
