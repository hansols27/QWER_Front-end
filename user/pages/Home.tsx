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
          const img = res.data.data.mainImage;

          console.log("📌 API에서 받은 mainImage :", img);

          // 이미지가 상대경로라면 절대 URL로 자동 변환
          const fullUrl = img?.startsWith("http")
            ? img
            : `${process.env.NEXT_PUBLIC_API_URL}${img}`;

          console.log("👉 최종 mainImageUrl :", fullUrl);

          setMainImageUrl(fullUrl || "");
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
      }}
    >
    </div>
  );
}
