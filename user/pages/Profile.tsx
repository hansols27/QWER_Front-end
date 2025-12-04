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
            const res = await api.get<{ success: boolean; data: MemberProfileState[] }>("/api/members");
            
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

    const imageUrls = selectedMember.images.map(img => img.url).filter(url => url);

    return (
        <div className="container"> 
            <div id="side">
                <div className="side2"> 
                    01
                    <span className="s_line"></span> 
                    PROFILE
                </div>
            </div>
            
            <div className={`${styles.cont} ${styles.profile} wow fadeInUp`} data-wow-delay="0.2s">                 
                {/* Member Selector: 모듈 스타일만 사용 */}
                <div className={styles.member_name}>
                    {members.map((member) => (
                        <p key={member.id}>
                            <button
                                onClick={() => setSelectedId(member.id)}                                
                                className={`
                                    ${selectedId === member.id ? styles.active : ''} 
                                    ${member.id !== 'All' ? member.id.toLowerCase() : ''}
                                `.trim()} 
                            >
                                {member.id === 'All' ? (
                                    <>
                                        {/* global.css의 전역 클래스 사용 */}
                                        <span className="q">Q</span> 
                                        <span className="w">W</span>
                                        <span className="e">E</span>
                                        <span className="r">R</span>
                                    </>
                                ) : (
                                    member.name
                                )}
                            </button>
                        </p>
                    ))}
                </div>

                {/* Profile Info: 모듈 스타일만 사용 */}
                <div className={styles.pf_inner}>
                    
                    {/* 이미지: 모듈 스타일만 사용 */}
                    <div className={styles.profile_img}>
                        {imageUrls.length > 0 && (
                            <div className={styles.artist_img}>
                                <ImageSlider
                                    images={imageUrls}
                                    interval={3000}
                                />
                            </div>
                        )}
                    </div>

                    {/* 텍스트 + SNS: 모듈 스타일만 사용 */}
                    <div className={styles.profile_txt}>
                        <div className={styles.name_tt}>{selectedMember.name}</div>

                        {selectedMember.texts
                            .filter(t => t.content.trim())
                            .flatMap((item, idx) =>
                                item.content.split("\n").map((line, i) => <p key={`${item.id}-${i}`}>{line}</p>)
                            )}

                        {(selectedMember.snslinks.length > 0) && (
                            <div className={styles.sns_area}>
                                {selectedMember.snslinks
                                    .filter(link => link.url.trim())
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