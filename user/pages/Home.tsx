'use client';

import { useEffect, useState } from "react";
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
        const res = await api.get<SettingsResponse>("/api/settings"); // 🔥 타입 추가

        if (res.data.success) {
          const url = res.data.data.mainImage?.trim() || "";
          console.log("Main Image URL:", url);
          setMainImageUrl(url);
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
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        backgroundImage: mainImageUrl ? `url("${mainImageUrl}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    ></div>
  );
}
