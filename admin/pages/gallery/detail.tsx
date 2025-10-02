"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../components/common/layout";
import { 
    Box, 
    Button, 
    Stack, 
    Typography, 
    Alert, 
    CircularProgress,
    CardMedia, 
} from "@mui/material";
import type { GalleryItem } from "@shared/types/gallery"; 

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // ⭐️ 변수명 통일

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return defaultMsg;
};

// ⭐️ Alert severity 타입 통일
type AlertSeverity = "success" | "error" | "info";


export default function GalleryDetail() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [item, setItem] = useState<GalleryItem | null>(null);
    const [loading, setLoading] = useState(true); 
    const [isProcessing, setIsProcessing] = useState(false); // 처리 중 (삭제/교체) 상태
    const [newFile, setNewFile] = useState<File | null>(null); // 교체할 새 파일
    // ⭐️ Alert 타입에 AlertSeverity 사용
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // 1. 데이터 로드 (GET)
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        if (!API_BASE_URL) { // ⭐️ 변수명 통일
            setAlertMessage({ message: "환경 설정 오류: API 주소가 설정되지 않았습니다.", severity: "error" });
            setLoading(false);
            return;
        }

        const fetchGalleryItem = async () => {
            setLoading(true);
            setAlertMessage(null);
            try {
                // ⭐️ API_BASE_URL 사용
                const res = await axios.get<{ success: boolean; data: GalleryItem }>(`${API_BASE_URL}/api/gallery/${id}`);
                setItem(res.data.data);
            } catch (err: any) {
                console.error("갤러리 아이템 로드 실패:", err);
                const errorMsg = extractErrorMessage(err, "갤러리 정보를 불러오는 데 실패했습니다.");
                setAlertMessage({ message: errorMsg, severity: "error" });
            } finally {
                setLoading(false);
            }
        };
        fetchGalleryItem();
    }, [id]);
    
    // 2. 파일 변경 핸들러
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAlertMessage(null);
        if (e.target.files?.[0]) {
            setNewFile(e.target.files[0]);
            setAlertMessage({ message: "새 이미지가 선택되었습니다. '이미지 교체' 버튼을 눌러 적용하세요.", severity: "info" });
        } else {
            setNewFile(null);
        }
    };
    
    // 3. 이미지 교체/수정 (PUT) 핸들러
    const handleReplace = async () => {
        setAlertMessage(null);
        if (!item || !API_BASE_URL || !newFile) {
            setAlertMessage({ message: "교체할 새 이미지를 먼저 선택해주세요.", severity: "error" });
            return;
        }
        
        if (!window.confirm(`선택한 파일(${newFile.name})로 이 이미지를 교체하시겠습니까?`)) return;

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append("image", newFile); // 서버에서 'image' 필드로 받도록 가정
            
            // PUT 요청으로 기존 아이템을 업데이트합니다.
            await axios.put(`${API_BASE_URL}/api/gallery/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            setAlertMessage({ message: "이미지가 성공적으로 교체되었습니다! 목록으로 이동합니다.", severity: "success" });
            
            // 성공 후 목록 페이지로 이동
            setTimeout(() => router.push("/gallery"), 1000); 

        } catch (err: any) {
            console.error("이미지 교체 요청 실패:", err);
            const errorMsg = extractErrorMessage(err, "이미지 교체에 실패했습니다. 서버 연결을 확인하세요.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false);
        } 
    };
    
    // 4. 삭제 (DELETE) 핸들러
    const handleDelete = async () => {
        setAlertMessage(null);
        if (!id || !API_BASE_URL) return;
        
        if (!window.confirm("정말로 이 이미지를 갤러리에서 삭제하시겠습니까? (이 작업은 취소할 수 없습니다)")) return;

        setIsProcessing(true);

        try {
            // DELETE 요청
            await axios.delete(`${API_BASE_URL}/api/gallery/${id}`);
            
            setAlertMessage({ message: "이미지가 성공적으로 삭제되었습니다! 목록으로 이동합니다.", severity: "success" });
            
            // 삭제 성공 후 목록 페이지로 이동
            setTimeout(() => router.push("/gallery"), 1000); 

        } catch (err: any) {
            console.error("갤러리 삭제 요청 실패:", err);
            const errorMsg = extractErrorMessage(err, "이미지 삭제에 실패했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false);
        } 
    };


    if (!id) return <Layout><Box p={4}><Typography color="error">잘못된 접근입니다. 이미지 ID가 필요합니다.</Typography></Box></Layout>;
    
    if (loading) return (
        <Layout>
            {/* ⭐️ 로딩 컴포넌트 위치 변경: 중앙 정렬 */}
            <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                <CircularProgress />
                <Typography ml={2} mt={2}>갤러리 정보를 로딩 중...</Typography>
            </Box>
        </Layout>
    );

    if (!item) return (
        <Layout>
            <Box p={4}>
                <Alert severity="warning">요청한 ID의 갤러리 이미지를 찾을 수 없습니다.</Alert>
                <Button onClick={() => router.push("/gallery")} sx={{ mt: 2 }}>목록</Button>
            </Box>
        </Layout>
    );

    // 로딩 완료 후 렌더링
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={4} fontWeight="bold">갤러리 상세</Typography>
                
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}
                
                <Stack spacing={4}>
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight="bold">현재 이미지</Typography>
                        <CardMedia
                            component="img"
                            sx={{ maxHeight: 400, width: 'auto', borderRadius: 1, objectFit: 'contain', border: '1px solid #eee' }} 
                            // 새 파일이 선택되면 그것을 보여줍니다.
                            image={newFile ? URL.createObjectURL(newFile) : item.url || 'https://via.placeholder.com/400?text=No+Image'}
                            alt={`Gallery image ${item.id}`}
                        />
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                            {newFile ? `새 파일 미리보기: ${newFile.name}` : `기존 파일 (업로드 시각: ${new Date(item.createdAt).toLocaleString()})`}
                        </Typography>
                    </Box>
                    
                    {/* 이미지 교체 섹션 */}
                    <Box>
                        <Typography variant="h6" gutterBottom fontWeight="bold">이미지 교체</Typography>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            disabled={isProcessing}
                        />
                        
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleReplace} 
                            disabled={isProcessing || !newFile || !API_BASE_URL}
                            sx={{ mt: 2 }}
                            startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                        >
                            {isProcessing && newFile ? "교체 처리 중..." : "이미지 교체"}
                        </Button>
                    </Box>


                    {/* 삭제 버튼 섹션 */}
                    <Stack direction="row" spacing={2} justifyContent="flex-end" pt={4} borderTop="1px solid #eee">
                        <Button 
                            variant="text" 
                            onClick={() => router.push("/gallery")} 
                            disabled={isProcessing}
                        >
                            목록으로 돌아가기
                        </Button>
                        
                        <Button 
                            variant="contained" 
                            color="error" 
                            onClick={handleDelete} 
                            disabled={isProcessing || !API_BASE_URL}
                            startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                        >
                            {isProcessing ? "삭제 처리 중..." : "이미지 삭제"}
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Layout>
    );
}