import type { CSSProperties } from "react";
import type { MemberSNS } from "./member.common"; // 💡 공통 타입 임포트

/**
 * 멤버 프로필 콘텐츠의 개별 항목 (텍스트 또는 이미지)
 * - 사용자 페이지에서 데이터를 순회하며 렌더링할 때 사용됨
 */
export interface MemberContentItem {
  type: "text" | "image";
  // 프론트 페이지에서 Array.isArray로 체크하는 로직이 있으므로 string | string[] 유지
  content: string | string[]; 
  // 이미지 슬라이더 등 스타일을 직접 지정할 때 사용
  style?: CSSProperties; 
}

/**
 * 사용자 페이지에 표시될 멤버 데이터의 최종 구조 (읽기 전용)
 * - @front/data/members 배열의 각 요소 타입
 */
export interface Member {
  id: string;
  name: string;
  nameStyle?: React.CSSProperties; 
  contents: MemberContentItem[];
  sns?: MemberSNS;
}