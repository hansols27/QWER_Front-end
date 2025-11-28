import { useState, useEffect } from "react";
import { api } from "@services/axios";
import instagramIcon from "@front/assets/icons/sns_instagram.png"; 
import twitterIcon from "@front/assets/icons/sns_twitter.png";
import youtubeIcon from "@front/assets/icons/sns_youtube.png";
import cafeIcon from "@front/assets/icons/sns_cafe.png";
import shopIcon from "@front/assets/icons/sns_shop.png";
import type { SettingsData, SnsLink } from "@shared/types/settings"; 

// SNS ID와 아이콘 이미지 경로를 매핑
const SNS_ICON_MAP = {
    instagram: instagramIcon,
    twitter: twitterIcon,
    youtube: youtubeIcon,
    cafe: cafeIcon,
    shop: shopIcon,
};

// API 응답 타입 정의 (SettingsPage에서 가져옴)
interface GetSettingsResponse {
    success: boolean;
    data: SettingsData;
}

// 훅 반환 타입 정의 (추가: isLoading, error)
interface UseSocialLinksResult {
    socialLinks: SnsLink[];
    isLoading: boolean;
    error: Error | null;
}

/**
 * SNS 링크 설정 및 아이콘 데이터를 비동기로 불러오는 커스텀 훅
 * @returns {UseSocialLinksResult} 유효한 URL과 아이콘이 포함된 SNS 링크 배열, 로딩 상태, 에러 상태
 */
export function useSocialLinks(): UseSocialLinksResult {
    const [socialLinks, setSocialLinks] = useState<SnsLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchLinks = async () => {
            try {
                // 로딩 시작
                setIsLoading(true);
                setError(null);
                
                const res = await api.get<GetSettingsResponse>(`/api/settings`);
                const backendLinks = res.data.data.snsLinks;
                
                // 1. 유효한 URL을 가진 링크만 필터링
                const validLinks = backendLinks.filter(l => l.url && l.url.trim() !== '');

                // 2. 각 링크에 해당하는 아이콘 이미지 경로를 추가
                const linkedIcons = validLinks.map(link => {
                    const iconPathObject = SNS_ICON_MAP[link.id as keyof typeof SNS_ICON_MAP];
                    
                    // 🚨 수정: .src 속성만 사용하여 StaticImageData 타입 오류 해결
                    const actualIconPath = iconPathObject?.src; 
                    
                    return {
                        ...link,
                        // icon 속성에 문자열 경로만 저장됨
                        icon: actualIconPath || undefined, 
                    };
                }).filter(link => link.icon); // 아이콘 경로가 있는 링크만 최종 선택

                setSocialLinks(linkedIcons);
            } catch (err) {
                console.error("Failed to fetch social links:", err);
                setError(err as Error); // 에러 상태 업데이트
                setSocialLinks([]); // 에러 시 링크를 비움
            } finally {
                setIsLoading(false); // 로딩 종료
            }
        };

        fetchLinks();
    }, []);
    
    // 수정: 객체 형태로 반환
    return { socialLinks, isLoading, error };
}