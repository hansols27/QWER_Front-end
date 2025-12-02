'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@services/axios";

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
          const url = res.data.data.mainImage?.trim() || "";
          setMainImageUrl(url);
        }
      } catch (err) {
        console.error("메인 이미지 불러오기 실패:", err);
      }
    };

    fetchMainImage();
  }, []);

  // 이미지가 아직 없으면 로딩 상태
  if (!mainImageUrl) return null;

  return (
    <div id="wrap" className="main_wrap" style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* global.css에서 정의한 main_bgimg 사용 */}
      <div className="main_bgimg">
        <Image
          src={mainImageUrl}
          alt="Main"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
    </div>
  );
}
