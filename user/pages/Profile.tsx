"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@shared/services/axios";
import ImageSlider from "@front/components/common/ImageSlider";
import '@front/styles/profile.module.css';

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

// All 멤버 포함
export type MemberType = {
  id: string;
  name: string;
  contents: { type: "text" | "image"; content: string | string[]; style?: React.CSSProperties }[];
  sns?: Record<string, string>;
};

export default function Profile() {
  const [members, setMembers] = useState<MemberType[]>([]);
  const [selectedId, setSelectedId] = useState("All");
  const [loading, setLoading] = useState(true);

  // API에서 멤버 데이터 불러오기
  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: MemberType[] }>("/api/members");
      // All 멤버를 기본 추가
      const allMember: MemberType = { id: "All", name: "QWER", contents: [], sns: {} };
      setMembers([allMember, ...res.data.data]);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (loading) return <div className="container">로딩 중...</div>;

  const selectedMember = members.find((m) => m.id === selectedId);
  if (!selectedMember) return null;

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
          {members.map((member) => (
            <p key={member.id}>
              <button
                onClick={() => setSelectedId(member.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  ...(member.id !== 'All' ? {} : {}),
                }}
              >
                {member.id === 'All' ? (
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
            {selectedMember.contents
              .filter((item) => item.type === "image")
              .map((item, idx) => {
                const images = Array.isArray(item.content) ? item.content : [item.content];
                return (
                  <ImageSlider
                    key={idx}
                    images={images}
                    style={item.style}
                    interval={3000}
                  />
                );
              })}
          </div>

          {/* 텍스트 + SNS */}
          <div className="profile_txt">
            <div className="name_tt">{selectedMember.name}</div>

            {selectedMember.contents
              .filter((item) => item.type === "text")
              .flatMap((item, idx) =>
                typeof item.content === "string"
                  ? item.content.split("\n").map((line, i) => <p key={`${idx}-${i}`}>{line}</p>)
                  : []
              )}

            {/* SNS */}
            {selectedMember.sns && (
              <div className="sns_area">
                {Object.entries(selectedMember.sns).map(([key, url]) =>
                  url ? (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={snsIcons[key as keyof typeof snsIcons]}
                        alt={key}
                        className="sns-icon"
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
