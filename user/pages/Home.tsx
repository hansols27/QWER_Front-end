'use client';

import { useEffect, useState } from "react";
import { api } from "@services/axios";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

interface GetSettingsResponse {
    success: boolean;
    data: {
        mainImage: string; // 이미지 URL
    };
}

const getErrorMessage = (err: unknown): string => {
    // ... (이전과 동일한 에러 처리 함수)
    if (typeof err === 'object' && err !== null) {
        if (('isAxiosError' in err && (err as any).isAxiosError === true) || ('response' in err)) {
            const axiosError = err as any; 
            return axiosError.response?.data?.message ?? axiosError.message;
        }
        if (err instanceof Error) {
            return err.message;
        }
    }
    return "요청 처리 중 알 수 없는 오류가 발생했습니다.";
};


export default function Home() {
    const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMainImage = async () => {
            try {
                // API 호출을 통해 이미지 URL 가져오기
                const res = await api.get<GetSettingsResponse>(`/api/settings`); 
                
                if (res.data.success && res.data.data.mainImage) {
                    setMainImageUrl(res.data.data.mainImage);
                } else {
                    setMainImageUrl(null);
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to fetch main image URL:", err);
                setError(getErrorMessage(err));
            } finally {
                setIsLoading(false);
            }
        };

        fetchMainImage();
    }, []);

    // 1. 로딩 상태
    if (isLoading) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" width="100vw">
                <CircularProgress />
                <Typography mt={2}>메인 이미지 로드 중...</Typography>
            </Box>
        );
    }
    
    // 2. 에러 또는 이미지 URL 부재 상태
    if (error || !mainImageUrl) {
        return (
            <Box p={4} height="100vh" width="100vw" display="flex" justifyContent="center" alignItems="center">
                <Alert severity={error ? "error" : "info"}>
                    {error || "현재 등록된 메인 이미지가 없습니다."}
                </Alert>
            </Box>
        );
    }

    // 3. 이미지 표시 (페이지 전체)
    return (
        <div 
            id="wrap" 
            style={{ 
                // ✨ 뷰포트 전체를 고정된 위치에 채우는 핵심 스타일
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100vw', 
                height: '100vh', 
                zIndex: -1, // 다른 콘텐츠(헤더, 푸터 등) 아래에 위치하도록 설정
            }}
        >
            {mainImageUrl && (
                <div 
                    className="main_bgimg" 
                    style={{ 
                        backgroundImage: `url(${mainImageUrl})`,
                        // ✨ 배경 이미지가 요소를 꽉 채우도록 설정
                        width: '100%', 
                        height: '100%',
                        backgroundSize: 'cover', // 화면 비율 유지하며 요소 꽉 채우기
                        backgroundPosition: 'center', // 중앙 정렬
                        backgroundRepeat: 'no-repeat', // 반복 금지
                    }} 
                >
                </div>
            )}
        </div>
    );
}