'use client';

import { useEffect, useState } from "react";
import Image from "next/image"; // Image 컴포넌트 사용
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
            // 응답 메시지가 있으면 사용, 없으면 axios 기본 메시지 사용
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
                    setError(null); // 데이터는 성공적으로 가져왔지만 이미지가 없을 경우 에러 초기화
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
        // 컨테이너: 뷰포트 전체 크기 (100vh, 100vw)를 차지하도록 설정
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}> 
            
            <Image
                src={mainImageUrl}
                alt="Main Banner Background"
                priority // 메인 이미지이므로 우선 로드
                fill // 부모 컨테이너(div)를 꽉 채우도록 설정
                // 클래스 없이 인라인 스타일만 사용: 비율을 유지하며 컨테이너를 꽉 채웁니다.
                style={{ objectFit: 'cover' }} 
            />

        </div>
    );
}