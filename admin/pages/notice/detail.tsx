'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Layout from "../../components/common/layout";
import type { SmartEditorHandle } from "../../components/common/SmartEditor";
import { 
    Box, 
    Button, 
    Typography, 
    Stack, 
    TextField, 
    Select, 
    MenuItem, 
    Alert, 
    CircularProgress 
} from "@mui/material";
import axios from "axios";

// 환경 변수를 사용하여 API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // ⭐️ 변수명 통일

// ===========================
// 유틸리티 함수
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


const SmartEditor = dynamic(() => import("../../components/common/SmartEditor"), { ssr: false });

interface Notice {
    id: number;
    type: "공지" | "이벤트";
    title: string;
    content: string;
}

export default function NoticeDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const editorRef = useRef<SmartEditorHandle>(null);

    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEdit, setIsEdit] = useState(false); // 수정 모드 여부
    
    // 수정 시 사용할 임시 상태
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [initialContent, setInitialContent] = useState(""); // 에디터 초기화용
    
    // ⭐️ AlertSeverity 타입 사용
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // 1. 데이터 로드 (GET) - ⭐️ useCallback 적용
    const fetchNotice = useCallback(async () => {
        if (!id || !API_BASE_URL) {
            setLoading(false);
            if (!API_BASE_URL) setAlertMessage({ message: "환경 설정 오류: API 주소가 설정되지 않았습니다.", severity: "error" });
            return;
        }
        
        setLoading(true);
        setAlertMessage(null);
        try {
            // ⭐️ API_BASE_URL 사용
            const res = await axios.get<Notice>(`${API_BASE_URL}/api/notice/${id}`);
            const data = res.data;
            
            setNotice(data);
            setTitle(data.title);
            setType(data.type);
            setInitialContent(data.content);
            
        } catch (err: any) { // ⭐️ 상세 오류 추출 적용
            console.error("공지사항 로드 실패:", err);
            const errorMsg = extractErrorMessage(err, "공지사항을 불러오는데 실패했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchNotice();
    }, [fetchNotice]);

    // 2. 에디터 ReadOnly 상태 관리 및 내용 설정 (isEdit 상태 변경 시)
    useEffect(() => {
        if (editorRef.current) {
            // SmartEditorHandle의 setReadOnly 메서드를 사용해 readOnly 상태를 제어
            editorRef.current.setReadOnly(!isEdit);
            
            // isEdit이 true가 될 때 (수정 시작) 현재 notice 내용을 에디터에 설정 (선택 사항이지만 안전성 확보)
            if (isEdit && notice) {
                editorRef.current.setContent(notice.content);
            }
        }
    }, [isEdit, initialContent, notice]); 
    // initialContent가 로드된 후에도 실행되어 에디터 초기값이 설정되도록 함

    // 3. 저장 핸들러 (PUT)
    const handleSave = async () => {
        if (!notice || !API_BASE_URL) return; // ⭐️ API_BASE_URL 사용
        const content = editorRef.current?.getContent() || "";

        setAlertMessage(null);
        if (!title.trim()) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }
        
        setIsProcessing(true);

        try {
            await axios.put(`${API_BASE_URL}/api/notice/${id}`, { title, type, content });
            
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            setIsEdit(false);
            
            // ⭐️ 상태 업데이트: notice와 initialContent를 최신 내용으로 동기화
            const updatedNotice = { ...notice, title, type, content };
            setNotice(updatedNotice); 
            setInitialContent(content); 

        } catch (err: any) { // ⭐️ 상세 오류 추출 적용
            console.error("공지사항 수정 실패:", err);
            const errorMsg = extractErrorMessage(err, "수정 중 오류가 발생했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setIsProcessing(false);
        }
    };
    
    // 4. 삭제 핸들러 (DELETE)
    const handleDelete = async () => {
        if (!notice || !API_BASE_URL) return; // ⭐️ API_BASE_URL 사용
        if (!window.confirm("정말로 삭제하시겠습니까?")) return;

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            await axios.delete(`${API_BASE_URL}/api/notice/${id}`);
            
            setAlertMessage({ message: "삭제 완료! 목록으로 이동합니다.", severity: "success" });
            setTimeout(() => router.push("/notice"), 1000); 

        } catch (err: any) { // ⭐️ 상세 오류 추출 적용
            console.error("공지사항 삭제 실패:", err);
            const errorMsg = extractErrorMessage(err, "삭제 중 오류가 발생했습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setIsProcessing(false);
        }
    };
    
    // ⭐️ 환경 설정 오류 조기 종료
    if (!API_BASE_URL === undefined) {
        return (
            <Layout>
                <Box p={4}><Alert severity="error">
                    <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                </Alert></Box>
            </Layout>
        );
    }

    // 로딩 중 표시
    if (loading) return (
        <Layout>
            <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                <CircularProgress />
                <Typography ml={2} mt={2}>공지사항 로딩 중...</Typography>
            </Box>
        </Layout>
    );
    
    // 데이터가 없거나 로드 실패 시
    if (!notice) return (
        <Layout>
            <Box p={4}>
                <Alert severity="warning">요청한 ID의 공지사항을 찾을 수 없습니다.</Alert>
                <Button onClick={() => router.push("/notice")} sx={{ mt: 2 }}>목록으로</Button>
            </Box>
        </Layout>
    );

    // 취소 시 원본 데이터로 롤백하는 함수
    const handleCancelEdit = () => {
        if (notice) {
            setIsEdit(false);
            // 취소 시 기존 데이터로 롤백
            setTitle(notice.title); 
            setType(notice.type);
            setAlertMessage(null);
            // 에디터 내용도 원본으로 되돌림 (useEffect에서 initialContent 변경 감지하여 에디터 상태 재설정)
            setInitialContent(notice.content);
        }
    }

    return (
        <Layout>
            <Box p={4}>
                {/* ⭐️ Typography 스타일 일관성 유지 */}
                <Typography variant="h4" mb={2} fontWeight="bold">공지사항 {isEdit ? "수정" : "상세"}</Typography>
                
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Stack spacing={2}>
                    {/* 제목/타입 영역 */}
                    {isEdit ? (
                        <Stack direction="row" spacing={2}>
                            <Select 
                                value={type} 
                                onChange={(e) => setType(e.target.value as "공지" | "이벤트")}
                                disabled={isProcessing}
                                sx={{ maxWidth: 150 }}
                            >
                                <MenuItem value="공지">공지</MenuItem>
                                <MenuItem value="이벤트">이벤트</MenuItem>
                            </Select>
                            <TextField 
                                label="제목" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                disabled={isProcessing}
                                fullWidth
                            />
                        </Stack>
                    ) : (
                        <Box sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                            <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                    mb: 0.5, 
                                    fontWeight: 'bold', 
                                    color: notice.type === '공지' ? '#1565c0' : '#e65100' // 색상 통일
                                }}
                            >
                                [{notice.type}]
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">{notice.title}</Typography>
                        </Box>
                    )}

                    <Box>
                        <SmartEditor 
                            ref={editorRef} 
                            height="400px" 
                            initialContent={initialContent}
                            // readOnly 상태는 useEffect의 setReadOnly() 메서드로 제어
                        />
                    </Box>

                    {/* 버튼 영역 */}
                    <Box sx={{ mt: 3 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {isEdit ? (
                                <>
                                    <Button 
                                        variant="contained" 
                                        onClick={handleSave}
                                        disabled={isProcessing || !title.trim()}
                                        startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                                    >
                                        {isProcessing ? "저장 중..." : "저장"}
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        onClick={handleCancelEdit}
                                        disabled={isProcessing}
                                    >
                                        취소
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        variant="contained" 
                                        onClick={() => setIsEdit(true)}
                                        disabled={isProcessing}
                                    >
                                        수정
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        color="error" 
                                        onClick={handleDelete}
                                        disabled={isProcessing}
                                    >
                                        삭제
                                    </Button>
                                </>
                            )}
                            
                            <Button 
                                variant="outlined" 
                                onClick={() => router.push("/notice")}
                                disabled={isProcessing}
                            >
                                목록
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Layout>
    );
}