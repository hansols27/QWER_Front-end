'use client';

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Layout from "@components/common/layout"; 
import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    Card,
    CardContent,
    Alert,
    CircularProgress,
} from "@mui/material";
import { api } from "@services/axios"; 
import type { SettingsData, SnsLink } from "@shared/types/settings"; 

// --- 유효성 검사를 위한 상수 ---
const DEFAULT_SNS_IDS: SnsLink["id"][] = ["instagram", "youtube", "twitter", "cafe", "shop"];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB 제한 (운영 환경에 맞게 조정 필요)

/**
 * 에러 객체에서 메시지를 추출하고 타입 안전성을 높인 함수
 */
const getErrorMessage = (err: unknown): string => {
    if (typeof err === 'object' && err !== null) {
        
        // 1. Axios Error 처리 (isAxiosError 대신 속성으로 임시 처리)
        if (('isAxiosError' in err && (err as any).isAxiosError === true) || ('response' in err)) {
            const axiosError = err as any; 
            // response.data.message (백엔드 에러) 또는 기본 axios 메시지 반환
            return axiosError.response?.data?.message ?? axiosError.message;
        }

        // 2. 일반 Error 객체 확인
        if (err instanceof Error) {
            return err.message;
        }
    }
    return "요청 처리 중 알 수 없는 오류가 발생했습니다.";
};

interface GetSettingsResponse {
    success: boolean;
    data: SettingsData;
}

interface SaveSettingsResponse {
    success: boolean;
    data: SettingsData;
}

const SettingsPage = () => {
    const [snsLinks, setSnsLinks] = useState<SnsLink[]>(DEFAULT_SNS_IDS.map(id => ({ id, url: "" })));
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [mainImageUrl, setMainImageUrl] = useState("");
    
    const [isFetching, setIsFetching] = useState(true); // 초기 데이터 로드 상태
    const [isSaving, setIsSaving] = useState(false);   // 저장 상태
    
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 백엔드 데이터를 SNS ID 기준으로 매핑하는 헬퍼 함수
    const mapSnsLinks = (backendLinks: SnsLink[]): SnsLink[] => {
        const linkMap = new Map(backendLinks.map(l => [l.id, l]));
        return DEFAULT_SNS_IDS.map(id => linkMap.get(id) || { id, url: "" });
    };

    // 이미지 미리보기 메모리 관리
    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setPreviewUrl(url);
            // 컴포넌트 언마운트 또는 imageFile 변경 시 메모리 해제
            return () => URL.revokeObjectURL(url); 
        } else {
            setPreviewUrl("");
        }
    }, [imageFile]);

    // 초기 데이터 로드 
    useEffect(() => {
        const fetchSettings = async () => {
            setIsFetching(true);
            setAlertMessage(null);
            try {
                const res = await api.get<GetSettingsResponse>(`/api/settings`); 
                const data = res.data.data;
                setMainImageUrl(data.mainImage || "");
                setSnsLinks(mapSnsLinks(data.snsLinks)); 
            } catch (err) {
                console.error("Failed to load settings:", err);
                setAlertMessage({ message: getErrorMessage(err), severity: "error" });
            } finally {
                setIsFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const updateSnsLink = (id: SnsLink["id"], url: string) => {
        setSnsLinks(prev => prev.map(l => (l.id === id ? { ...l, url } : l)));
    };
    
    /**
     * 파일 변경 및 유효성 검사 핸들러
     */
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // 1. 파일 크기 검사
            if (file.size > MAX_IMAGE_SIZE) {
                setAlertMessage({ 
                    message: `업로드할 수 있는 최대 파일 크기는 ${MAX_IMAGE_SIZE / 1024 / 1024}MB입니다.`, 
                    severity: "error" 
                });
                // input 필드 초기화 (필수)
                if (fileInputRef.current) fileInputRef.current.value = "";
                setImageFile(null);
                return;
            }

            // 2. 파일 타입 검사 (image/*)
            if (!file.type.startsWith('image/')) {
                setAlertMessage({ message: "이미지 파일(jpeg, png 등)만 업로드할 수 있습니다.", severity: "error" });
                if (fileInputRef.current) fileInputRef.current.value = "";
                setImageFile(null);
                return;
            }

            // 유효성 통과 시
            setAlertMessage(null); 
            setImageFile(file);
        } else {
            // 파일 선택 취소 시
            setImageFile(null);
        }
    };

    // 저장 처리 
    const saveSettings = async () => {
        setIsSaving(true);
        setAlertMessage(null);
        
        // --- 1. SNS URL 유효성 검사 ---
        const invalidLink = snsLinks.find(link => 
            // URL이 입력되었지만, http:// 또는 https://로 시작하지 않는 경우
            link.url.trim() && !/^https?:\/\/.*/i.test(link.url.trim())
        );

        if (invalidLink) {
            setAlertMessage({ 
                message: `${invalidLink.id.toUpperCase()} 링크의 형식이 올바르지 않습니다. 반드시 'http://' 또는 'https://'로 시작해야 합니다.`, 
                severity: "error" 
            });
            setIsSaving(false);
            return;
        }
        
        const isMultipart = !!imageFile;
        
        try {
            let res;
            
            if (isMultipart) {
                // 이미지 파일이 있을 경우 (multipart/form-data)
                const formData = new FormData();
                formData.append("image", imageFile as File); 
                // 이미지 없이 SNS만 업데이트하는 경우를 위해, URL이 있는 링크만 전송
                formData.append("snsLinks", JSON.stringify(snsLinks.filter(l => l.url.trim())));
    
                res = await api.post<SaveSettingsResponse>(
                    `/api/settings`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
            } else {
                // 이미지 파일이 없을 경우 (application/json)
                const payload = {
                    // URL이 있는 링크만 전송
                    snsLinks: snsLinks.filter(l => l.url.trim()), 
                };
                
                res = await api.post<SaveSettingsResponse>(`/api/settings`, payload);
            }

            const data = res.data.data;
            setMainImageUrl(data.mainImage || "");
            setSnsLinks(mapSnsLinks(data.snsLinks));
            
            // 저장 성공 시 이미지 상태 및 input 초기화
            setImageFile(null); 
            if (fileInputRef.current) {
                 fileInputRef.current.value = ""; 
            }
            
            setAlertMessage({ message: "설정이 성공적으로 저장되었습니다!", severity: "success" });
        } catch (err) {
            console.error("Failed to save settings:", err);
            setAlertMessage({ message: getErrorMessage(err), severity: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    // 초기 로딩 중에는 스피너 표시
    if (isFetching) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                    <CircularProgress />
                    <Typography ml={2}>설정 데이터를 불러오는 중...</Typography>
                </Box>
            </Layout>
        );
    }
    
    return (
        <Layout>
            <Box p={4} width="100%" marginLeft={0}>
                <Typography variant="h4" mb={2} fontWeight="bold">기본 설정</Typography>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 3 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                {/* Main Image */}
                <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>메인 이미지</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
                            <Box>
                                <Button variant="contained" component="label" color="primary">
                                    이미지 업로드
                                    <input 
                                        type="file" 
                                        hidden 
                                        accept="image/*"
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                    />
                                </Button>
                                {imageFile && (
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        **{imageFile.name}** 파일이 선택되었습니다. 저장 버튼을 눌러야 업로드됩니다.
                                    </Typography>
                                )}
                                <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                                    * 최대 크기: {MAX_IMAGE_SIZE / 1024 / 1024}MB
                                </Typography>
                            </Box>
                            {(mainImageUrl || previewUrl) && (
                                <Box>
                                    <Typography variant="caption" display="block" mb={1}>미리보기</Typography>
                                    <img 
                                        src={previewUrl || mainImageUrl} 
                                        alt="Main Banner" 
                                        style={{ 
                                            width: '100px', 
                                            height: '100px', 
                                            objectFit: 'cover', 
                                            borderRadius: '8px',
                                            border: '1px solid #ddd'
                                        }} 
                                    />
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* SNS Links */}
                <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
                    <CardContent>
                        <Typography variant="h6" mb={2} borderBottom="1px solid #eee" pb={1}>SNS 링크 설정</Typography>
                        <Stack spacing={3}>
                            {snsLinks.map(link => (
                                <TextField
                                    key={link.id}
                                    // 첫 글자 대문자 처리
                                    label={link.id.charAt(0).toUpperCase() + link.id.slice(1)} 
                                    value={link.url}
                                    onChange={e => updateSnsLink(link.id, e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    type="url" 
                                    placeholder={`예: https://www.${link.id}.com/my_page`}
                                    helperText="전체 URL (https:// 포함)을 입력해주세요."
                                />
                            ))}
                        </Stack>
                    </CardContent>
                </Card>

                <Button 
                    variant="contained" 
                    color="success"
                    size="large"
                    onClick={saveSettings} 
                    disabled={isSaving} 
                    startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : undefined}
                    sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                >
                    {isSaving ? "저장 중..." : "저장"}
                </Button>
            </Box>
        </Layout>
    );
};

export default SettingsPage;