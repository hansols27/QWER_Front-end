import type { CSSProperties } from 'react';

export interface MemberContentItem {
  type: 'text' | 'image';
  content: string | string[]; // 이미지 배열이나 텍스트
  style?: CSSProperties;
}

export interface MemberSNS {
  youtube?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  weverse?: string;
  cafe?: string;
  [key: string]: string | undefined;
}

export interface Member {
  id: string;
  name: string;
  nameStyle?: React.CSSProperties;
  contents: MemberContentItem[];
  sns?: MemberSNS;
}
