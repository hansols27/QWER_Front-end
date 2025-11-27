import { useState, useEffect } from 'react';
import { api } from "@shared/services/axios";
import type { SettingsData } from "@shared/types/settings";

interface GetSettingsResponse {
    success: boolean;
    data: SettingsData;
}

export default function Home() {
  // 이미지 URL을 저장할 상태
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  // 로딩 상태 관리 (선택 사항이지만 권장됨)
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMainImage = async () => {
      try {
        setIsLoading(true);
        // 관리자 페이지와 동일한 API 엔드포인트 호출
        const res = await api.get<GetSettingsResponse>('/api/settings');      

        // 응답 데이터에서 mainImage URL 추출하여 상태 업데이트
        const fetchedUrl = res.data?.data?.mainImage || "";
        setMainImageUrl(fetchedUrl);
      } catch (error) {

        console.error("메인 이미지를 불러오는데 실패했습니다:", error);
        // 에러 발생 시 필요한 처리 (예: 기본 이미지 보여주기 또는 에러 메시지 표시)
      } finally {
        setIsLoading(false);
      }
    };

    fetchMainImage();
  }, []); // 빈 배열을 전달하여 컴포넌트 마운트 시 한 번만 실행  

  return (
    <div>
      {/* mainImageUrl이 값이 있을 때만 이미지를 렌더링합니다. */}
      {mainImageUrl && (
        <img 
          src={mainImageUrl} 
          alt="Main" 
          // 스타일은 필요에 따라 조정하세요
          style={{ width: '100%', height: 'auto' }} 
        />
      )}
    </div>
  );
}