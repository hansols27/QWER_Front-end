'use client';

import { useEffect, useState } from "react";
import { api } from "@services/axios";

export default function Home() {
  const [mainImageUrl, setMainImageUrl] = useState<string>("");

  useEffect(() => {
    const fetchMainImage = async () => {
      try {
        const res = await api.get<{ success: boolean; data: { mainImage: string } }>("/api/settings");
        if (res.data.success) {
          setMainImageUrl(res.data.data.mainImage || "");
        }
      } catch (err) {
        console.error("메인 이미지 불러오기 실패:", err);
      }
    };

    fetchMainImage();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: mainImageUrl ? `url(${mainImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}    >
      
    </div>
  );
}
