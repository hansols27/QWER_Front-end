'use client';

import { useEffect, useState } from "react";
import { api } from "@services/axios";
import React from "react"; // React를 명시적으로 import

interface SettingsResponse {
  success: boolean;
  data: {
    mainImage: string;
  };
}

export default function Home() {
  const [mainImageUrl, setMainImageUrl] = useState<string>("");

  useEffect(() => {
    const fetchMainImage = async () => {
      try {
        const res = await api.get<SettingsResponse>("/api/settings");

        if (res.data.success) {
          // trim() 및 빈 문자열 처리
          const url = res.data.data.mainImage?.trim() || "";
          setMainImageUrl(url);
        }
      } catch (err) {
        console.error("메인 이미지 불러오기 실패:", err);
      }
    };

    fetchMainImage();
  }, []);

  // mainImageUrl이 있을 경우 background-image 스타일을 적용합니다.
  const backgroundStyle = mainImageUrl
    ? { backgroundImage: `url(${mainImageUrl})` }
    : {};

  return (
      <div className="main_bgimg" style={backgroundStyle}>
     
    </div>
  );
}