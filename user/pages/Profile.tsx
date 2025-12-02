'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { api } from "@shared/services/axios";
import ImageSlider from "@front/components/common/ImageSlider";
import styles from '@front/styles/profile.module.css';

type TextItem = { id: string; content: string };
type APIImageItem = { id: string; url: string }; 
type SNSLinkItem = { id: string; type: string; url: string };

export type MemberProfileState = {
    id: 'All' | 'Q' | 'W' | 'E' | 'R';
    name: string;
    type: string;
    texts: TextItem[];
    images: APIImageItem[];
    snslinks: SNSLinkItem[];
};

// 등록 페이지의 상수를 그대로 사용
const memberIds = ["All", "Q", "W", "E", "R"] as const; 

const snsIcons = {
    youtube: require('@front/assets/icons/youtube.svg'),
    instagram: require('@front/assets/icons/instagram.svg'),
    twitter: require('@front/assets/icons/twitter.png'),
    weverse: require('@front/assets/icons/weverse.png'),
    tiktok: require('@front/assets/icons/tiktok.svg'),
    cafe: require('@front/assets/icons/cafe.svg'),
};
// SNS 아이콘 키의 타입 정의
type SNSType = keyof typeof snsIcons;

// ------------------------------------
// Profile 페이지
// ------------------------------------
export default function Profile() {
    // 모든 멤버의 데이터를 MemberProfileState[] 타입으로 저장
    const [members, setMembers] = useState<MemberProfileState[]>([]);
    const [selectedId, setSelectedId] = useState<MemberProfileState['id']>("All");
    const [loading, setLoading] = useState<boolean>(true);

    const fetchMembers = useCallback(async () => {
        try {
            // 백엔드 API가 모든 멤버의 데이터를 배열 형태로 반환한다고 가정합니다.
            // 등록 페이지의 API와는 다를 수 있으나, 데이터 구조를 MemberProfileState[]로 가정합니다.
            // /api/members (GET) 엔드포인트가 모든 멤버의 프로필 배열을 반환한다고 가정합니다.
            const res = await api.get<{ success: boolean; data: MemberProfileState[] }>("/api/members");
            
            // 등록 페이지의 memberIds 순서대로 정렬 (옵션)
            const sortedMembers = memberIds.map(id => res.data.data.find(m => m.id === id)).filter((m): m is MemberProfileState => !!m);
            
            setMembers(sortedMembers);
        } catch (err) {
            console.error("Failed to load members:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // 선택된 멤버 데이터
    const selectedMember = useMemo(() => {
        return members.find((m) => m.id === selectedId) || members[0];
    }, [members, selectedId]);
    
    // SNS 링크를 { type: url } 형태로 변환
    const snsMap = useMemo(() => {
        if (!selectedMember) return {};
        return selectedMember.snslinks.reduce((acc, link) => {
            acc[link.type] = link.url;
            return acc;
        }, {} as Record<string, string>);
    }, [selectedMember]);

    if (loading) return <div className={styles.container}>로딩 중...</div>;
    // memberIds 배열에 따라 'All'이 항상 첫 번째로 로드되어야 하지만, 혹시 데이터가 없으면 대기.
    if (!selectedMember) return <div className={styles.container}>멤버 데이터 없음</div>;

    // 이미지 배열 추출 (ImageSlider가 string[]을 받으므로 URL 목록을 추출)
    const imageUrls = selectedMember.images.map(img => img.url).filter(url => url);

    return (
        <div className={styles.container}>
            {/* Side */}
            <div id="side" className={styles.side}>
                <div className={styles.side2}>
                    01
                    <span className={styles.s_line}></span>
                    PROFILE
                </div>
            </div>

            {/* Main: .cont.profile 클래스 적용 */}
            <div className={`${styles.cont} ${styles.profile}`}>
                {/* Member Selector: .member_name 클래스 적용 */}
                <div className={styles.member_name}>
                    {members.map((member) => (
                        <p key={member.id}>
                            <button
                                onClick={() => setSelectedId(member.id)}
                                // 현재 선택된 멤버에 따라 스타일을 추가하여 활성화된 상태를 표시할 수 있습니다.
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: selectedId === member.id ? 'bold' : 'inherit',
                                    fontFamily: 'Montserrat',
                                    fontSize: 'inherit',
                                    letterSpacing: 'inherit',
                                }}
                            >
                                {member.id === 'All' ? 'QWER' : member.name}
                            </button>
                        </p>
                    ))}
                </div>

                {/* Profile Info: .pf_inner 클래스 적용 (이미지 + 텍스트를 감쌈) */}
                <div className={styles.pf_inner}>
                    
                    {/* 이미지: .profile_img 클래스 적용 */}
                    <div className={styles.profile_img}>
                        {/* 이미지 URL이 하나 이상 있을 때 ImageSlider를 표시 */}
                        {imageUrls.length > 0 && (
                            // 등록 페이지의 구조를 따르지 않고, ImageSlider에 모든 이미지를 전달합니다.
                            <div className={styles.artist_img}>
                                <ImageSlider
                                    images={imageUrls}
                                    interval={3000}
                                />
                            </div>
                        )}
                    </div>

                    {/* 텍스트 + SNS: .profile_txt 클래스 적용 */}
                    <div className={styles.profile_txt}>
                        {/* 이름 타이틀: .name_tt 클래스 적용 */}
                        <div className={styles.name_tt}>{selectedMember.name}</div>

                        {/* 텍스트 콘텐츠: selectedMember.texts 배열을 사용 */}
                        {selectedMember.texts
                            .filter(t => t.content.trim()) // 빈 텍스트는 제외
                            .flatMap((item, idx) =>
                                // 텍스트 아이템의 content를 줄바꿈 기준으로 p 태그로 분할
                                item.content.split("\n").map((line, i) => <p key={`${item.id}-${i}`}>{line}</p>)
                            )}

                        {/* SNS: .sns_area 클래스 적용 */}
                        {(selectedMember.snslinks.length > 0) && (
                            <div className={styles.sns_area}>
                                {selectedMember.snslinks
                                    .filter(link => link.url.trim()) // URL이 있는 링크만 표시
                                    .map((link) => {
                                        const key = link.type as SNSType;
                                        const iconSrc = snsIcons[key];
                                        
                                        if (link.url && iconSrc) {
                                            return (
                                                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                                                    <Image
                                                        src={iconSrc}
                                                        alt={link.type}
                                                        width={25}
                                                        height={25}
                                                        className={styles["sns-icon"]}
                                                    />
                                                </a>
                                            );
                                        }
                                        return null;
                                    })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}