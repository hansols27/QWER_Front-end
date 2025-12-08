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

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" className="main_vd">
                <CircularProgress />
                <Typography mt={2}>메인 이미지 로드 중...</Typography>
            </Box>
        );
    }
    
    if (error || !mainImageUrl) {
        return (
            <Box p={4}>
                <Alert severity={error ? "error" : "info"}>
                    {error || "현재 등록된 메인 이미지가 없습니다."}
                </Alert>
            </Box>
        );
    }

    return (
        
        <div className="main_vd" style={{ position: 'relative' }}> 
            
            <Image
                src={mainImageUrl}
                alt="Main Banner Background"
                priority 
                fill // ⭐️ 부모 컨테이너(main_vd)를 채우도록 설정
                className="main_bgimg" // ⭐️ global.css에 정의된 스타일을 적용하여 배경처럼 만듭니다.
                style={{ objectFit: 'cover' }} 
            />

        </div>
    );
}