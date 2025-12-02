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
  const [isLoading, setIsLoading] = useState<boolean>(true); // 로딩 상태 추가

  useEffect(() => {
    const fetchMainImage = async () => {
      setIsLoading(true); // 로딩 시작
      try {
        const res = await api.get<SettingsResponse>("/api/settings");
        
        if (res.data.success && res.data.data.mainImage) {
          const url = res.data.data.mainImage.trim();
          setMainImageUrl(url);
          console.log("✅ 이미지 URL 설정 완료:", url); // 확인용 로그
        } else {
          console.error("❌ API 응답은 받았으나 URL이 유효하지 않습니다.");
        }
      } catch (err) {
        console.error("❌ 메인 이미지 불러오기 실패:", err);
      } finally {
        setIsLoading(false); // 로딩 종료
      }
    };

    fetchMainImage();
  }, []);

  // 1. API 로딩 중에는 다른 것을 렌더링합니다.
  if (isLoading) {
    return <div style={{ height: '100vh', color: 'white' }}>배경 이미지 로딩 중...</div>;
  }
  
  // 2. 로딩이 끝났는데도 URL이 없으면 null 대신 메시지를 렌더링합니다.
  if (!mainImageUrl) {
    return <div style={{ height: '100vh', color: 'red' }}>이미지 데이터를 찾을 수 없습니다.</div>;
  }

  // 3. 최종 렌더링
  return (
    <div 
      id="wrap" 
      className="main_wrap" 
      style={{ width: "100vw", height: "100vh", position: "relative" }}
    >
      <div 
        className="main_bgimg" 
        // CSS가 완벽하지 않더라도 안전하게 렌더링되도록 인라인 스타일을 유지합니다.
        style={{ width: "100%", height: "100%", position: "relative" }} 
      >
        <Image
          src={mainImageUrl}
          alt="Main"
          fill
          style={{ objectFit: "cover" }}
          priority
          sizes="100vw"
          // 이미지 로드 실패 시 디버깅
          onError={() => console.error("❌ Image 컴포넌트가 로드에 실패했습니다. (S3 접근 권한 확인 필요)")}
        />
      </div>
    </div>
  );
}