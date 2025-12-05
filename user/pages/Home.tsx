'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
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
        <div className="main_vd"> 
            
            <Image
                src={mainImageUrl}
                alt="Main Banner"
                priority 
                fill
                className="main_bgimg" 
                // ⭐️ 이 부분이 핵심입니다. z-index를 높게 설정하여 앞으로 렌더링되게 합니다.
                style={{ objectFit: 'cover', zIndex: 10 }} 
            />
        </div>
    );
}