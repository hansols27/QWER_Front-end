'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@services/axios";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

// SettingsPage에서 사용하는 응답 구조를 기반으로 정의
interface GetSettingsResponse {
    success: boolean;
    data: {
        mainImage: string; // 이미지 URL
    };
}

// 에러 객체에서 메시지를 추출하는 헬퍼 함수 (SettingsPage에서 가져옴)
const getErrorMessage = (err: unknown): string => {
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

    // --- 1. 초기 데이터 로드 (메인 이미지 URL 가져오기) ---
    useEffect(() => {
        const fetchMainImage = async () => {
            try {
                // SettingsPage에서 사용한 것과 동일한 API 엔드포인트를 가정합니다.
                const res = await api.get<GetSettingsResponse>(`/api/settings`); 
                
                if (res.data.success && res.data.data.mainImage) {
                    setMainImageUrl(res.data.data.mainImage);
                } else {
                    setMainImageUrl(null);
                    // 에러가 아닌, 이미지가 등록되지 않은 상태로 간주
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

    // --- 2. 로딩 상태 처리 ---
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" className="main_vd">
                <CircularProgress />
                <Typography mt={2}>메인 이미지 로드 중...</Typography>
            </Box>
        );
    }
    
    // --- 3. 에러 발생 또는 이미지가 없을 경우 처리 ---
    if (error || !mainImageUrl) {
        return (
            <Box p={4}>
                <Alert severity={error ? "error" : "info"}>
                    {error || "현재 등록된 메인 이미지가 없습니다."}
                </Alert>
            </Box>
        );
    }

    // --- 4. 이미지 렌더링 ---
    return (
        
        <div className="main_vd"> 
            
            <Image
                src={mainImageUrl}
                alt="Main Banner"
                priority 
                fill
                className="main_bgimg" 
                style={{ objectFit: 'cover' }} 
            />
        </div>
    );
}