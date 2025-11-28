'use client'; // 클라이언트 컴포넌트로 유지

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from "@shared/services/axios"; 
import type { 
    MemberProfileState, 
    SNSLinkItem,
    TextItem,
    ImageItem as APIImageItem, 
} from "@shared/types/member"; 
import '@front/ui/profile.module.css';
import ImageSlider from '@front/components/common/ImageSlider';
import { Box, CircularProgress, Typography, Alert } from '@mui/material'; // 로딩/에러 표시를 위해 MUI 컴포넌트 추가

// --- SNS 아이콘 임포트 ---
import youtubeIcon from '@front/assets/icons/youtube.svg';
import instagramIcon from '@front/assets/icons/instagram.svg';
import twitterIcon from '@front/assets/icons/twitter.png';
import weverseIcon from '@front/assets/icons/weverse.png';
import tiktokIcon from '@front/assets/icons/tiktok.svg';
import cafeIcon from '@front/assets/icons/cafe.svg';

const snsIcons = {
    youtube: youtubeIcon,
    instagram: instagramIcon,
    twitter: twitterIcon,
    weverse: weverseIcon,
    tiktok: tiktokIcon,
    cafe: cafeIcon,
};
// ------------------------------------

// 관리자 페이지와 동일한 상수 사용 (멤버 ID와 이름)
const memberIds = ["All", "Q", "W", "E", "R"] as const; 
const memberNames = ["QWER", "Chodan", "Majenta", "Hina", "Siyeon"] as const;

// API 응답 데이터 타입을 지정합니다.
type ProfileData = MemberProfileState; 

// 데이터가 로드되지 않았거나 존재하지 않을 경우를 대비한 초기 상태 (QWER 기본값)
const defaultProfileData: ProfileData = {
    id: "All", 
    name: "QWER",
    type: "All",
    texts: [{ id: 'default-text', content: "멤버 프로필 데이터를 불러오는 중입니다..." }],
    images: [{ id: 'default-image', url: '/default-placeholder.png' }], // 적절한 기본 이미지 URL로 대체
    snslinks: [],
};

// API 요청 경로
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 선택된 멤버 ID에 따라 API에서 데이터를 불러오는 훅
 */
const useProfileData = (id: (typeof memberIds)[number]) => {
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const memberName = useMemo(() => memberNames[memberIds.indexOf(id)] || id, [id]);

    const fetchData = useCallback(async () => {
        if (!API_BASE_URL) {
            setError(".env에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.");
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // API 경로를 '/api/members/[id]'로 가정하고 호출
            const res = await api.get<{ success: boolean; data: MemberProfileState | null }>(`/api/members/${id}`);
            const profileData = res.data.data;
            
            if (profileData === null) {
                // 데이터가 없을 경우 (404가 아닌 200 OK와 null 데이터가 온 경우)
                setData({
                    id: id,
                    name: memberName,
                    type: id,
                    texts: [{ id: 'no-data-text', content: `${memberName} 프로필 데이터가 없습니다.` }],
                    images: [],
                    snslinks: [],
                });
            } else {
                setData(profileData);
            }
        } catch (err: any) {
            console.error(`Failed to load ${id} profile:`, err);
            
            // API 오류 시 대체 데이터 설정
            const errorMessage = `프로필 로드에 실패했습니다: ${err.message || '알 수 없는 오류'}`;
            setError(errorMessage);
            setData({
                id: id,
                name: memberName,
                type: id,
                texts: [{ id: 'error-text', content: `[오류] 데이터 로드 실패: ${err.response?.status || ''}` }],
                images: [],
                snslinks: [],
            });
        } finally {
            setLoading(false);
        }
    }, [id, memberName]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 데이터가 로딩 중이거나 null일 때 defaultProfileData를 반환하여 QWER 기본 화면을 유지합니다.
    const finalData = useMemo(() => {
        return data || defaultProfileData;
    }, [data]);

    return { data: finalData, loading, error, memberIds };
}


export default function Profile() {
    // 초기 선택 ID를 "All"로 설정
    const [selectedId, setSelectedId] = useState<(typeof memberIds)[number]>(memberIds[0]);
    
    // API 훅을 사용하여 데이터 로드
    const { data: selectedMember, loading, error, memberIds: availableIds } = useProfileData(selectedId);
    
    // 멤버 선택 목록을 구성합니다.
    const allMembers = memberIds.map((id, index) => ({
        id,
        name: memberNames[index],
    }));

    // --- 렌더링 시 로딩/오류 처리 ---

    if (!API_BASE_URL) {
        return (
            <Box p={4}>
                <Alert severity="error">
                    <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                </Alert>
            </Box>
        );
    }

    // 초기 로딩 중 (selectedMember가 defaultData를 가지고 있어도 loading 상태를 표시)
    if (loading && selectedId === "All") {
          return (
            <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
                <CircularProgress />
                <Typography variant="h6" mt={2}>프로필 데이터 로딩 중...</Typography>
            </div>
        );
    }
    
    // 로딩이 끝났고 에러가 발생한 경우 (개별 멤버 선택 후 실패 포함)
    if (error && selectedMember.texts[0].content.includes("[오류]")) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
                <Alert severity="error">{error}</Alert>
                <p style={{ marginTop: '20px' }}>멤버를 다시 선택하거나 관리자 페이지를 확인해주세요.</p>
            </div>
        );
    }

    // 데이터가 로드되었거나, 기본 데이터가 설정된 경우 (항상 selectedMember 객체는 유효함)

    return (
        <div className="container">
            {/* Side */}
            <div id="side">
                <div className="side2">
                    01
                    <span className="s_line"></span>
                    PROFILE
                </div>
            </div>

            {/* Main */}
            <div className="cont profile">
                {/* Member Selector */}
                <div className="member_name">
                    {allMembers.map((member) => (
                        <p key={member.id}>
                            <button
                                onClick={() => setSelectedId(member.id)}
                                // 현재 선택된 멤버에 대한 스타일 추가
                                className={selectedId === member.id ? 'active' : ''} 
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {member.id === 'All' ? (
                                    // QWER 스타일은 CSS로 처리됨을 가정
                                    <>
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

                {/* Profile Info */}
                <div className="pf_inner">
                    {/* 이미지 */}
                    <div className="profile_img">
                        {/* API 응답 데이터 selectedMember.images를 사용합니다. */}
                        {selectedMember.images.length > 0 ? (
                            <ImageSlider
                                // APIImageItem[] 타입의 url 속성을 사용하여 이미지를 표시합니다.
                                images={selectedMember.images.map(img => img.url)}
                                style={{}} 
                                interval={3000}
                            />
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed #ccc' }}>
                                이미지 없음
                            </div>
                        )}
                    </div>

                    {/* 텍스트 + SNS */}
                    <div className="profile_txt">
                        <div className="name_tt">{selectedMember.name}</div>

                        {/* API 응답 데이터 selectedMember.texts를 사용합니다. */}
                        {selectedMember.texts.length > 0 ? (
                               selectedMember.texts.map((item) => (
                                 // 줄바꿈을 위해 whiteSpace: 'pre-wrap'을 사용합니다.
                                 <p key={item.id} style={{ whiteSpace: 'pre-wrap' }}>
                                     {item.content}
                                 </p>
                                ))
                        ) : (
                            <p>등록된 프로필 내용이 없습니다.</p>
                        )}

                        {/* SNS */}
                        {selectedMember.snslinks.length > 0 && (
                            <div className="sns_area">
                                {/* selectedMember.snslinks 배열을 사용합니다. */}
                                {selectedMember.snslinks.map((link) =>
                                    link.url ? (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <img
                                                // ✅ 수정된 부분: 이미지 객체의 .src 속성을 명시적으로 사용
                                                src={snsIcons[link.type as keyof typeof snsIcons].src}
                                                alt={link.type}
                                                className="sns-icon"
                                                width={32}
                                                height={32} // <img> 태그 사용 시 크기 지정
                                            />
                                        </a>
                                    ) : null
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}