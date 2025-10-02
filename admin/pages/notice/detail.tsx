'use client';

import { useEffect, useRef, useState } from "react";
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
    const [isEdit, setIsEdit] = useState(false);
    
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"공지" | "이벤트">("공지");
    const [initialContent, setInitialContent] = useState("");
    
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

    // 1. 데이터 로드 (GET)
    useEffect(() => {
        if (!id || !API_BASE_URL) {
            setLoading(false);
            if (!API_BASE_URL) setAlertMessage({ message: "API 주소가 설정되지 않았습니다.", severity: "error" });
            return;
        }
        
        const fetchNotice = async () => {
            setLoading(true);
            setAlertMessage(null);
            try {
                const res = await axios.get<Notice>(`${API_BASE_URL}/api/notice/${id}`);
                const data = res.data;
                
                setNotice(data);
                setTitle(data.title);
                setType(data.type);
                setInitialContent(data.content);
                
            } catch (err) {
                console.error(err);
                setAlertMessage({ message: "공지사항을 불러오는데 실패했습니다.", severity: "error" });
            } finally {
                setLoading(false);
            }
        };
        fetchNotice();
    }, [id]);

    // 2. 에디터 ReadOnly 상태 관리 (isEdit 상태 변경 시)
    useEffect(() => {
        if (editorRef.current) {
            // ⭐️ SmartEditorHandle의 setReadOnly 메서드를 사용해 readOnly 상태를 제어
            editorRef.current.setReadOnly(!isEdit);
        }
    }, [isEdit, initialContent]); // initialContent가 로드된 후에도 한 번 더 실행되도록 설정 (로딩 후 에디터가 준비될 때)

    // 3. 저장 핸들러 (PUT)
    const handleSave = async () => {
        if (!notice || !API_BASE_URL) return;
        const content = editorRef.current?.getContent() || "";

        setAlertMessage(null);
        if (!title.trim()) {
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" });
            return;
        }
        
        setIsProcessing(true);

        try {
            await axios.put(`${API_BASE_URL}/api/notices/${id}`, { title, type, content });
            
            setAlertMessage({ message: "수정 완료!", severity: "success" });
            setIsEdit(false);
            
            setNotice({ ...notice, title, type, content }); 
            setInitialContent(content); 

        } catch (err) {
            console.error(err);
            setAlertMessage({ message: "수정 중 오류가 발생했습니다.", severity: "error" });
        } finally {
            setIsProcessing(false);
        }
    };
    
    // 4. 삭제 핸들러 (DELETE)
    const handleDelete = async () => {
        if (!notice || !API_BASE_URL) return;
        if (!window.confirm("정말로 삭제하시겠습니까?")) return;

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            await axios.delete(`${API_BASE_URL}/api/notices/${id}`);
            
            setAlertMessage({ message: "삭제 완료! 목록으로 이동합니다.", severity: "success" });
            setTimeout(() => router.push("/notice"), 1000); 

        } catch (err) {
            console.error(err);
            setAlertMessage({ message: "삭제 중 오류가 발생했습니다.", severity: "error" });
            setIsProcessing(false);
        }
    };

    if (loading) return (
        <Layout>
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /><Typography ml={2}>로딩 중...</Typography></Box>
        </Layout>
    );
    
    if (!notice) return <Layout><Box p={4}><Typography color="error">공지사항을 찾을 수 없습니다.</Typography></Box></Layout>;

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2}>공지사항 상세/수정</Typography>
                
                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                <Stack spacing={2}>
                    {/* 제목/타입 영역 */}
                    {isEdit ? (
                        <>
                            <Select 
                                value={type} 
                                onChange={(e) => setType(e.target.value as "공지" | "이벤트")}
                                disabled={isProcessing}
                            >
                                <MenuItem value="공지">공지</MenuItem>
                                <MenuItem value="이벤트">이벤트</MenuItem>
                            </Select>
                            <TextField 
                                label="제목" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                disabled={isProcessing}
                            />
                        </>
                    ) : (
                        <Box sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                                [{notice.type}]
                            </Typography>
                            <Typography variant="h5">{notice.title}</Typography>
                        </Box>
                    )}

                    <Box>
                        <SmartEditor 
                            ref={editorRef} 
                            height="400px" 
                            initialContent={initialContent}
                            // ⭐️ 'readOnly' 속성 제거: 이 기능은 useEffect에서 setReadOnly() 메서드로 처리합니다.
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
                                        onClick={() => {
                                            setIsEdit(false);
                                            // 취소 시 기존 데이터로 롤백
                                            setTitle(notice.title); 
                                            setType(notice.type);
                                            setAlertMessage(null);
                                        }}
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