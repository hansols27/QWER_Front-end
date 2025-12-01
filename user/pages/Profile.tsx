'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { api } from "@shared/services/axios";
import ImageSlider from "@front/components/common/ImageSlider";
import styles from '@front/styles/profile.module.css';

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

export type MemberType = {
  id: string;
  name: string;
  contents: { type: "text" | "image"; content: string | string[]; style?: React.CSSProperties }[];
  sns?: Record<string, string>;
};

export default function Profile() {
  const [members, setMembers] = useState<MemberType[]>([]);
  const [selectedId, setSelectedId] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: MemberType[] }>("/api/members");
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

  // 선택 멤버 기본값 설정
  const selectedMember = members.find((m) => m.id === selectedId) || members[0];

  if (loading) return <div className={styles.container}>로딩 중...</div>;
  if (!selectedMember) return <div className={styles.container}>멤버 데이터 없음</div>;

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

      {/* Main */}
      <div className={`${styles.cont} ${styles.profile}`}>
        {/* Member Selector */}
        <div className={styles.member_name}>
          {members.map((member) => (
            <p key={member.id}>
              <button
                onClick={() => setSelectedId(member.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {member.id === 'All' ? (
                  <>
                    <span className={styles.q}>Q</span>
                    <span className={styles.w}>W</span>
                    <span className={styles.e}>E</span>
                    <span className={styles.r}>R</span>
                  </>
                ) : (
                  member.name
                )}
              </button>
            </p>
          ))}
        </div>

        {/* Profile Info */}
        <div className={styles.pf_inner}>
          {/* 이미지 */}
          <div className={styles.profile_img}>
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
          <div className={styles.profile_txt}>
            <div className={styles.name_tt}>{selectedMember.name}</div>

            {selectedMember.contents
              .filter((item) => item.type === "text")
              .flatMap((item, idx) =>
                typeof item.content === "string"
                  ? item.content.split("\n").map((line, i) => <p key={`${idx}-${i}`}>{line}</p>)
                  : []
              )}

            {/* SNS */}
            {selectedMember.sns && (
              <div className={styles.sns_area}>
                {Object.entries(selectedMember.sns).map(([key, url]) =>
                  url && snsIcons[key as keyof typeof snsIcons] ? (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={snsIcons[key as keyof typeof snsIcons]}
                        alt={key}
                        width={24}
                        height={24}
                        className={styles["sns-icon"]}
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
