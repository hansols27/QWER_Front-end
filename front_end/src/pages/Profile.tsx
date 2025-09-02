import React, { useState } from 'react';
import { members } from '@/data/members';
import '@/ui/profile.css';
import ImageSlider from '@/components/common/ImageSlider';

import youtubeIcon from '@/assets/icons/youtube.svg';
import instagramIcon from '@/assets/icons/instagram.svg';
import twitterIcon from '@/assets/icons/twitter.png';
import weverseIcon from '@/assets/icons/weverse.png';
import tiktokIcon from '@/assets/icons/tiktok.svg';
import cafeIcon from '@/assets/icons/cafe.svg';

const snsIcons = {
  youtube: youtubeIcon,
  instagram: instagramIcon,
  twitter: twitterIcon,
  weverse: weverseIcon,
  tiktok: tiktokIcon,
  cafe: cafeIcon,
};

export default function Profile() {
  const [selectedId, setSelectedId] = useState(members[0].id);
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
                  ...(member.id !== 'All' ? member.nameStyle || {} : {}),
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
              .filter((item) => item.type === 'image')
              .map((item, idx) => {
                const images = Array.isArray(item.content)
                  ? item.content
                  : [item.content];
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
              .filter((item) => item.type === 'text')
              .flatMap((item, idx) =>
                typeof item.content === 'string'
                  ? item.content
                      .split('\n')
                      .map((line, i) => <p key={`${idx}-${i}`}>{line}</p>)
                  : []
              )}

            {/* SNS */}
            {selectedMember.sns && (
              <div className="sns_area">
                {Object.entries(selectedMember.sns).map(([key, url]) =>
                  url ? (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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
