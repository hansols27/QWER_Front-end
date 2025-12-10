'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { api } from "@shared/services/axios";
import ImageSlider from "@front/components/common/ImageSlider";
import styles from '@front/styles/profile.module.css';

// --- 타입 정의 및 상수 ---
type TextItem = { id: string; content: string };
type APIImageItem = { id: string; url: string };
type SNSLinkItem = { id: string; type: string; url: string };

// 등록 페이지와 동일한 멤버 이름 배열을 정의합니다.
const memberNames = ["QWER", "Chodan", "Majenta", "Hina", "Siyeon"] as const;

// 기존 ID 상수
const memberIds = ["All", "Q", "W", "E", "R"] as const;
type MemberIdType = typeof memberIds[number];

export type MemberProfileState = {
    id: MemberIdType;
    name: string;
    type: string;
    texts: TextItem[];
    images: APIImageItem[];
    snslinks: SNSLinkItem[];
};

// memberIds의 순서와 memberNames의 순서 매핑합니다.
const memberMap: Record<MemberIdType, string> = memberIds.reduce((acc, id, index) => {
    acc[id] = memberNames[index];
    return acc;
}, {} as Record<MemberIdType, string>);


// SNS 아이콘 매핑
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
    // 현재 선택된 멤버 데이터만 저장합니다.
    const [selectedMember, setSelectedMember] = useState<MemberProfileState | null>(null);
    // 기본값은 'All'로 설정합니다.
    const [selectedId, setSelectedId] = useState<MemberIdType>("All");
    const [loading, setLoading] = useState<boolean>(true);

    const getDynamicShadowStyle = (memberId: MemberIdType) => {
        switch (memberId) {
            case 'Q': // Chodan (Q)
                return { boxShadow: '15px 15px 20px 0 #ffffffff' }; 
            case 'W': // Majenta (W)
                return { boxShadow: '15px 15px 20px 0 #ff4edb' }; 
            case 'E': // Hina (E)
                return { boxShadow: '15px 15px 20px 0 #00a8ff' }; 
            case 'R': // Siyeon (R)
                return { boxShadow: '15px 15px 20px 0 #00c853' }; 
            case 'All': // QWER (All)
                return { boxShadow: '15px 15px 20px 0 #000000ff' }; 
            default:
                return {}; // 그림자 없음
        }
    };

    // 개별 멤버 데이터를 불러오는 함수로 변경합니다.
    const fetchMemberData = useCallback(async (memberId: MemberIdType) => {
        setLoading(true);
        setSelectedMember(null); // 로드 시작 시 데이터 초기화

        try {
            // 멤버 ID를 사용하여 개별 조회 경로를 호출합니다.
            const res = await api.get<{ success: boolean; data: MemberProfileState | null }>(`/api/members/${memberId}`);

            if (res.data.success && res.data.data) {
                setSelectedMember(res.data.data);
            } else {
                setSelectedMember(null);
                console.warn(`No data found for member ID: ${memberId}`);
            }

        } catch (err) {
            console.error(`Failed to load member ${memberId}:`, err);
            setSelectedMember(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // selectedId가 변경될 때마다 데이터를 다시 불러옵니다.
    useEffect(() => {
        fetchMemberData(selectedId);
    }, [selectedId, fetchMemberData]);

    // 선택된 멤버의 이미지 URL 배열을 추출합니다.
    const imageUrls = selectedMember
        ? selectedMember.images.map(img => img.url).filter(url => url)
        : [];

    // 로딩 중이거나 데이터가 없을 때 처리
    if (loading) {
        return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>데이터 로드 중...</div>;
    }

    if (!selectedMember) {
        return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>선택된 ID({selectedId})의 프로필 데이터가 없습니다.</div>;
    }

    // ----------------------------
    // 렌더링
    // ----------------------------
    return (
        <div className="container">
            <div id="side">
                <div className="side2">
                    01
                    <span className="s_line"></span>
                    PROFILE
                </div>
            </div>

            {/* Main */}
            <div className={`${styles.pfCont} ${styles.profile}`}>
                {/* Member Selector */}
                <div className={styles.member_name}>
                    {/* 버튼은 memberIds 상수 배열을 순회하며 렌더링합니다. */}
                    {memberIds.map((id) => (
                        <p key={id}>
                            <button
                                onClick={() => setSelectedId(id)}
                                className={`
                                    ${selectedId === id ? styles.active : ''}
                                    ${id !== 'All' ? id.toLowerCase() : ''}
                                `.trim()}
                            >                                
                                {id === 'All' ? (
                                    <>
                                        <span className="q">Q</span>
                                        <span className="w">W</span>
                                        <span className="e">E</span>
                                        <span className="r">R</span>
                                    </>
                                ) : (
                                    memberMap[id] 
                                )}
                            </button>
                        </p>
                    ))}
                </div>

                {/* Profile Info */}
                <div className={styles.pf_inner}>
                    {/* 이미지: 이미지 슬라이더 컴포넌트 사용 */}
                    <div className={styles.profile_img} >
                        <div className={styles.artist_img}
                            style={getDynamicShadowStyle(selectedMember.id)}
                            >                            
                            <ImageSlider
                                images={imageUrls}
                                interval={3000}
                            />
                        </div>
                    </div>

                    {/* 텍스트 + SNS */}
                    <div className={styles.profile_txt}>
                        <div className={styles.name_tt}>{selectedMember.name}</div>

                        {/* 텍스트 내용 출력: 빈 줄을 제거하고 줄바꿈(\n)에 따라 <p> 태그를 분리합니다. */}
                        {selectedMember.texts
                            .filter(t => t.content.trim())
                            .flatMap((item, idx) =>
                                item.content.split("\n").map((line, i) =>
                                    <p key={`${item.id}-${i}`}>{line}</p>
                                )
                            )}

                        {/* SNS 링크 출력: URL이 있는 경우에만 아이콘 표시 */}
                        {(selectedMember.snslinks.filter(link => link.url.trim()).length > 0) && (
                            <div className={styles.sns_area}>
                                {selectedMember.snslinks
                                    .filter(link => link.url.trim())
                                    .map((link) => {
                                        const key = link.type as SNSType;
                                        const iconSrc = snsIcons[key];

                                        if (iconSrc) { // URL과 아이콘이 모두 있을 경우
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