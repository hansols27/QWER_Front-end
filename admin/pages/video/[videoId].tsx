'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import { 
    Box, 
    Button, 
    TextField, 
    Typography, 
    Alert, 
    CircularProgress, 
    Stack, 
    Paper, 
    Card, // Card 컴포넌트 추가
    Divider, // Divider 컴포넌트 추가
    // 삭제 확인 모달을 위한 Dialog 컴포넌트 추가
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from "@mui/material"; 
import { VideoItem } from "@shared/types/video";

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// 유튜브 썸네일 URL을 가져오는 헬퍼 함수
const getThumbnail = (url: string) => {
    let videoId = "";
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regExp);
    if (match) videoId = match[1];
    else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0] ?? "";
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};

export default function VideoDetail() {
    const params = useParams();
    const id = params?.videoId as string;
    const router = useRouter();

    const [video, setVideo] = useState<VideoItem | null>(null);
    const [title, setTitle] = useState("");
    const [src, setSrc] = useState("");
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" | "info"; } | null>(null);
    // [New] 삭제 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false); 

    const fetchVideo = useCallback(async () => {
        if (!id) { setLoading(false); return; }
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.get<{ success: boolean; data: VideoItem }>(`/api/video/${id}`); 
            const data = res.data.data;
            
            // 💡 데이터 로딩 후, state에 저장하여 즉시 수정 가능하도록 준비
            setVideo(data);
            setTitle(data.title);
            setSrc(data.src);
        } catch (err: any) {
            console.error(err);
            setAlertMessage({ message: extractErrorMessage(err, "영상 로드 실패"), severity: "error" });
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { 
        // 환경 변수 검사 로직은 유지 (API 호출 제어)
        if (process.env.NEXT_PUBLIC_API_URL) {
            fetchVideo(); 
        } else {
            setLoading(false);
            setAlertMessage({ message: "API 주소가 설정되지 않았습니다.", severity: "error" });
        }
    }, [fetchVideo]);

    // 💡 수정 (저장) 핸들러
    const handleSave = async () => {
        if (!video) return;
        setIsProcessing(true);
        setAlertMessage(null);

        const trimmedTitle = title.trim();
        const trimmedSrc = src.trim();

        if (!trimmedTitle || !trimmedSrc) {
            setAlertMessage({ message: "제목과 유튜브 링크를 모두 입력해야 합니다.", severity: "error" });
            setIsProcessing(false);
            return;
        }

        try {
            // PUT API 호출 (수정)
            await api.put(`/api/video/${video.id}`, { title: trimmedTitle, src: trimmedSrc }); 
            
            // 성공 시 로컬 상태 업데이트
            setVideo(prev => prev ? {...prev, title: trimmedTitle, src: trimmedSrc} : null);
            setTitle(trimmedTitle);
            setSrc(trimmedSrc);
            
            setAlertMessage({ message: "영상이 성공적으로 저장(수정)되었습니다.", severity: "success" });
        } catch (err: any) {
            setAlertMessage({ message: extractErrorMessage(err, "영상 수정 실패"), severity: "error" });
        } finally { setIsProcessing(false); }
    };
    
    // [New] 삭제 모달 닫기 핸들러
    const handleCloseDeleteModal = () => {
        setIsModalOpen(false);
    };

    // [New] 실제 삭제 실행 핸들러 (API 호출)
    const handleConfirmDelete = async () => {
        if (!video) return;
        
        handleCloseDeleteModal(); // 모달 닫기

        setIsProcessing(true);
        setAlertMessage({ message: "삭제 중...", severity: "info" });

        try {
            await api.delete(`/api/video/${video.id}`);
            
            setAlertMessage({ message: "삭제 완료! 목록으로 이동합니다.", severity: "success" });
            
            setTimeout(() => router.push("/video"), 1500); // 1.5초 후 목록으로 이동
        } catch (err: any) {
            setAlertMessage({ message: extractErrorMessage(err, "삭제 실패"), severity: "error" });
            setIsProcessing(false);
        }
    };

    // 💡 삭제 핸들러 (모달 열기) - 기존 window.confirm 로직 대체
    const handleDelete = () => {
        if (!video) return;
        setIsModalOpen(true);
    };

    // 💡 목록 이동 핸들러
    const handleListMove = () => {
        router.push("/video");
    };

    // 로딩 상태
    if (loading) return (
        <Layout>
            <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                <CircularProgress /><Typography mt={2}>로딩 중...</Typography>
            </Box>
        </Layout>
    );

    // 데이터를 찾지 못한 경우
    if (!video) return (
        <Layout>
            <Box p={4}>
                <Alert severity="warning">영상을 찾을 수 없거나 로드에 실패했습니다.</Alert>
                <Button onClick={handleListMove} sx={{ mt: 2 }}>목록</Button>
            </Box>
        </Layout>
    );

    const thumbnailUrl = getThumbnail(src);

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">영상 상세/수정</Typography>
                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}
                
                {/* Card 레이아웃 시작 */}
                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
                        
                        {/* 제목 필드 */}
                        <TextField 
                            label="제목" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            disabled={isProcessing} 
                            error={!title.trim() && !isProcessing} 
                            helperText={!title.trim() && !isProcessing ? "제목은 필수입니다." : undefined}
                        />
                        
                        {/* 유튜브 링크 필드 */}
                        <TextField 
                            label="유튜브 링크" 
                            value={src} 
                            onChange={e => setSrc(e.target.value)} 
                            disabled={isProcessing} 
                            error={!src.trim() && !isProcessing} 
                            helperText={!src.trim() && !isProcessing ? "유튜브 링크는 필수입니다." : undefined}
                        />
                        
                        {/* 썸네일 미리보기 */}
                        {thumbnailUrl ? (
                            <Paper elevation={1} sx={{ p: 2, display: 'inline-block', maxWidth: 400, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" mb={1} fontWeight="bold">썸네일</Typography>
                                <img 
                                    src={thumbnailUrl} 
                                    alt="썸네일" 
                                    style={{ borderRadius: 4, width: '100%', height: 'auto', display: 'block' }} 
                                />
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                    등록일: {new Date(video.createdAt).toLocaleDateString('ko-KR')}
                                </Typography>
                            </Paper>
                        ) : (
                            <Alert severity="info">유효한 유튜브 링크를 입력하시면 썸네일이 표시됩니다.</Alert>
                        )}
                        
                    </Stack>
                </Card>
                {/* Card 레이아웃 끝 */}

                {/* 액션 버튼 섹션: 저장, 목록, 삭제 */}
                <Divider sx={{ mt: 4, mb: 4 }}/>
                <Box>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        
                        {/* 저장 (수정) 버튼 */}
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            onClick={handleSave} 
                            // 제목 또는 링크가 유효하지 않으면 비활성화
                            disabled={isProcessing || !title.trim() || !src.trim()} 
                            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing ? "저장 중..." : "저장"}
                        </Button>
                        
                        {/* 목록 버튼 */}
                        <Button 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            onClick={handleListMove} 
                            disabled={isProcessing}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            목록
                        </Button>
                        
                        {/* 삭제 버튼 - 클릭 시 모달 열기 */}
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="large"
                            onClick={handleDelete} // 모달을 여는 함수 호출
                            disabled={isProcessing}
                            startIcon={isProcessing && alertMessage?.severity === "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing && alertMessage?.severity === "info" ? "삭제 중..." : "삭제"}
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* [New] 삭제 확인 다이얼로그 */}
            <Dialog
                open={isModalOpen}
                onClose={handleCloseDeleteModal}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"            >
                
                <DialogTitle id="album-delete-dialog-title">{"삭제 확인"}</DialogTitle>
                    <DialogContent>
                        <Typography>
                            삭제하시겠습니까?
                        </Typography>
                    </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteModal} color="primary" disabled={isProcessing}>
                        취소
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete} // 실제 삭제 로직 호출
                        color="error" 
                        variant="contained" 
                        autoFocus
                        disabled={isProcessing}
                        startIcon={isProcessing && alertMessage?.severity === "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                    >
                        확인
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}