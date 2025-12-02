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

  if (!mainImageUrl) return null;

  return (
    <div className="main_bgimg">
      <Image
        src={mainImageUrl}
        alt="Main"
        fill
        style={{ objectFit: "cover" }}
        priority
      />
    </div>
  );
}
