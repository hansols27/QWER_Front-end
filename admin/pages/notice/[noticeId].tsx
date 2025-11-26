import * as React from 'react';
import {
    Box,
    Button,
    Typography,
    Stack,
    Select,
    MenuItem,
    TextField,
    Alert,
    CircularProgress,
    Card, 
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";

// ==========================================================
// 1. Mock Types (외부 타입 정의 대체)
// ==========================================================
type NoticeType = "공지" | "이벤트";
interface Notice {
    id: string;
    title: string;
    type: NoticeType;
    content: string;
    createdAt: string;
}
// SmartEditorHandle: 에디터의 Ref 타입 정의
interface SmartEditorHandle {
    // 실제 SmartEditor에 구현된 함수가 있다면 여기에 정의
    getContent: () => string; 
}
type AlertSeverity = "success" | "error" | "info" | "warning"; 

// ==========================================================
// 2. Mock Data & API (API 및 데이터 대체)
// ==========================================================
const MOCK_NOTICE_DATA: Notice = {
    id: "12345",
    title: "새로운 공지사항 제목입니다",
    type: "공지",
    content: "<p>여기에 <b>공지사항의 초기 내용</b>이 로드됩니다.</p>",
    createdAt: new Date().toISOString(),
};

// Mock API 함수: 데이터 로드 및 저장/삭제 시뮬레이션
const mockApi = {
    get: (url: string): Promise<{ data: { data: Notice } }> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Mock GET: ${url}`);
                resolve({ data: { data: MOCK_NOTICE_DATA } });
            }, 500);
        });
    },
    put: (url: string, data: any): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Mock PUT: ${url}`, data);
                // MOCK_NOTICE_DATA.title = data.title; // 실제 상태는 React state가 업데이트
                resolve();
            }, 800);
        });
    },
    delete: (url: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Mock DELETE: ${url}`);
                resolve();
            }, 800);
        });
    },
};

// ==========================================================
// 3. Mock Components & Hooks (외부 의존성 대체)
// ==========================================================

// Layout Mock: 간단한 중앙 정렬 컨테이너로 대체
const Layout: React.FC<any> = ({ children }) => (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', p: { xs: 1, md: 4 } }}>
        {children}
    </Box>
);

// SmartEditor Mock: <textarea> 기반으로 동작을 시뮬레이션
const SmartEditor = React.forwardRef<SmartEditorHandle, {
    height: string;
    initialContent: string;
    disabled: boolean;
    onReady: () => void;
    onChange: (content: string) => void;
}>(({ initialContent, disabled, onReady, onChange }, ref) => {
    
    // 컴포넌트 마운트 시 onReady 호출 시뮬레이션
    React.useEffect(() => {
        const timer = setTimeout(onReady, 50); // 약간의 딜레이 후 준비 완료 시뮬레이션
        return () => clearTimeout(timer);
    }, [onReady]);

    // Ref API 목업 (필요하면 추가)
    React.useImperativeHandle(ref, () => ({
        getContent: () => initialContent, // onChange로 상태를 관리하므로 이 함수는 사용되지 않을 수 있음
    }));

    // 실제 에디터 대신 텍스트 영역 사용
    return (
        <TextField
            fullWidth
            multiline
            rows={15}
            defaultValue={initialContent}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="에디터가 로드되면 여기에 초기 내용이 표시됩니다. (현재는 Mock Textarea)"
            variant="outlined"
            sx={{
                '& .MuiInputBase-root': {
                    padding: 0,
                    height: '100%',
                    '& textarea': { padding: '12px' }
                }
            }}
        />
    );
});
SmartEditor.displayName = 'SmartEditor';


// Mock Hooks: Next.js 라우팅 대체
const useMockParams = () => ({ noticeId: MOCK_NOTICE_DATA.id }); // ID를 목업 데이터의 ID로 설정

const useMockRouter = () => ({
    push: (path: string) => {
        console.log(`Mock Navigation: Redirecting to ${path}`);
        alert(`[Mock] 목록으로 이동: ${path}`);
    }
});


// ==========================================================
// 4. Main Component (원본 로직 유지)
// ==========================================================
// 헬퍼: 에러 메시지 추출 (Mock API에서는 단순화)
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    return error?.message || defaultMsg;
};

// 헬퍼 함수: 내용이 비어있는지 확인
const isContentEmpty = (htmlContent: string): boolean => {
    const textContent = htmlContent.replace(/<[^>]*>?/gm, '').trim();
    // Quill 에디터의 빈 내용 태그를 포함하여 검사
    const isQuillEmpty = htmlContent === '<p><br></p>' || htmlContent === '';

    // Mock Editor는 textarea이므로, 텍스트가 없으면 비어있는 것으로 간주
    return textContent.length === 0 || isQuillEmpty;
};

export default function NoticeDetail() {
    // Next.js 의존성 제거 및 Mock Hooks 사용
    const params = useMockParams(); 
    const id = params?.noticeId as string | undefined; 
    const router = useMockRouter();
    
    const editorRef = React.useRef<SmartEditorHandle>(null); 

    const [notice, setNotice] = React.useState<Notice | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isProcessing, setIsProcessing] = React.useState(false); 
    const [title, setTitle] = React.useState("");
    const [type, setType] = React.useState<NoticeType>("공지"); 
    const [initialContent, setInitialContent] = React.useState(""); 
    const [isEditorReady, setIsEditorReady] = React.useState(false); 
    const [alertMessage, setAlertMessage] = React.useState<{ message: string; severity: AlertSeverity } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    // 핵심: SmartEditor의 onChange를 통해 실시간 업데이트되는 내용을 담을 상태
    const [content, setContent] = React.useState(""); 

    // 데이터 로딩 함수 (Mock API 사용)
    const fetchNotice = React.useCallback(async () => {
        if (!id) {
            setLoading(false);
            return; 
        }

        setLoading(true);
        setAlertMessage(null);
        try {
            // Mock API 호출로 대체
            const res = await mockApi.get(`/api/notice/${id}`); 
            const data = res.data.data;

            setNotice(data);
            setTitle(data.title);
            setType(data.type);
            setInitialContent(data.content); 
            // content 상태 초기화
            setContent(data.content); 
            
        } catch (err: any) {
            console.error("공지사항 로드 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "공지사항 로드 실패"), severity: "error" });
            setNotice(null); 
        } finally {
            setLoading(false);
        }
    }, [id]);

    React.useEffect(() => { 
        fetchNotice(); 
    }, [fetchNotice]);

    // 에디터 준비 완료 핸들러
    const handleEditorReady = React.useCallback(() => {
        setIsEditorReady(true);
    }, []);


    // 저장 핸들러 (Mock API 사용)
    const handleSave = async () => {
        
        // 1. 필수 데이터 확인
        if (!id || !notice) {
            console.error("저장 실패: 공지 ID 또는 데이터가 누락되었습니다.");
            setAlertMessage({ message: "필수 데이터가 누락되었습니다. (Mock ID 없음)", severity: "error" });
            return;
        }
        
        // 2. 에디터 준비 상태 최종 확인 
        if (!isEditorReady) {
            console.error("저장 실패: SmartEditor가 아직 준비되지 않았습니다.");
            setAlertMessage({ message: "에디터 로딩 중입니다. 잠시 후 다시 시도해주세요.", severity: "warning" });
            return; 
        }

        const trimmedTitle = title.trim();
        const currentContent = content || ""; 
        
        // 3. 제목 유효성 검사
        if (!trimmedTitle) { 
            setAlertMessage({ message: "제목을 입력해주세요.", severity: "error" }); 
            return; 
        }
        
        // 4. 내용 유효성 검사
        if (isContentEmpty(currentContent)) {
            setAlertMessage({ message: "내용을 입력해주세요.", severity: "error" }); 
            return; 
        }

        setIsProcessing(true);
        setAlertMessage(null);

        try {
            // Mock API 호출로 대체
            await mockApi.put(`/api/notice/${id}`, { type, title: trimmedTitle, content: currentContent }); 
            
            setAlertMessage({ message: "수정 완료! (Mock API)", severity: "success" });
            // UI를 위해 상태 업데이트 (실제로는 서버 응답에 기반해야 함)
            setNotice(prev => prev ? { ...prev, title: trimmedTitle, type: type, content: currentContent } : null);

        } catch (err: any) {
            console.error("공지사항 수정 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "수정 실패 (Mock)"), severity: "error" });
        } finally { setIsProcessing(false); }
    };
    
    // 삭제 실행 함수 (Mock API 사용)
    const executeDelete = async () => {
        setShowDeleteConfirm(false); // 모달 닫기
        if (!id || isProcessing) return; 

        setIsProcessing(true);
        setAlertMessage({ message: "삭제 중... (Mock API)", severity: "info" });

        try {
            // Mock API 호출로 대체
            await mockApi.delete(`/api/notice/${id}`);
            
            setAlertMessage({ message: "삭제 완료! 목록으로 이동합니다. (Mock API)", severity: "success" });
            
            // Mock 라우터 사용
            setTimeout(() => router.push("/notice"), 1500); 
        } catch (err: any) {
            console.error("공지사항 삭제 실패:", err);
            setAlertMessage({ message: extractErrorMessage(err, "삭제 실패 (Mock)"), severity: "error" });
            setIsProcessing(false);
        }
    };

    // 삭제 버튼 클릭 시 모달 열기
    const handleDelete = () => {
        if (isProcessing) return;
        setShowDeleteConfirm(true); 
    };
    
    const handleListMove = () => {
        router.push("/notice");
    };

    // 로딩 UI
    if (loading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" py={8} flexDirection="column">
                    <CircularProgress />
                    <Typography mt={2}>데이터 로딩 중...</Typography>
                </Box>
            </Layout>
        );
    }

    // 에러/데이터 없음 UI
    if (!id || !notice) { 
        return (
            <Layout>
                <Box p={4}>
                    {!alertMessage && <Alert severity="warning">공지사항을 찾을 수 없거나 접근 경로가 잘못되었습니다.</Alert>}
                    {alertMessage && alertMessage.severity !== "success" && (
                        <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                            {alertMessage.message}
                        </Alert>
                    )}
                    <Button onClick={handleListMove} variant="contained" sx={{ mt: 2 }}>목록으로 이동</Button>
                </Box>
            </Layout>
        );
    }

    // 메인 상세/수정 UI
    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h4" mb={2} fontWeight="bold">
                    공지사항 상세/수정
                </Typography>

                {alertMessage && <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>{alertMessage.message}</Alert>}

                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Stack spacing={3}>
                        
                        {/* 제목/타입 영역 */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Select 
                                value={type} 
                                onChange={(e: SelectChangeEvent<NoticeType>) => setType(e.target.value as NoticeType)} 
                                disabled={isProcessing} 
                                sx={{ width: 150 }} 
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
                                error={!title.trim()}
                                helperText={!title.trim() ? "제목은 필수입니다." : undefined}
                            />
                        </Stack>

                        {/* 에디터 영역 */}
                        <Box sx={{ 
                            minHeight: '400px', 
                            border: '1px solid #ddd', 
                            borderRadius: 1, 
                            overflow: 'hidden',
                        }}> 
                            {/* isEditorReady가 false일 때 로딩 인디케이터 */}
                            {!isEditorReady && (
                                <Box display="flex" justifyContent="center" alignItems="center" height="400px" flexDirection="column">
                                    <CircularProgress />
                                    <Typography mt={2}>에디터 로딩 중...</Typography>
                                </Box>
                            )}
                            {/* 에디터 로드 후 표시 */}
                            <Box sx={{ display: isEditorReady ? 'block' : 'none', height: '100%' }}>
                                <SmartEditor 
                                    ref={editorRef} 
                                    height="400px" 
                                    initialContent={initialContent} 
                                    disabled={isProcessing} 
                                    onReady={handleEditorReady} 
                                    // 에디터 내용 변경 시 content 상태 업데이트
                                    onChange={setContent} 
                                />
                            </Box>
                        </Box>
                        
                        {/* 등록일시 정보 */}
                        <Typography variant="caption" color="textSecondary" alignSelf="flex-end">
                            등록일: {new Date(notice.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </Typography>

                    </Stack>
                </Card>

                {/* 액션 버튼 섹션 */}
                <Divider sx={{ mt: 4, mb: 4 }}/>
                <Box>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        
                        {/* 삭제 버튼 */}
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="large"
                            onClick={handleDelete} // 모달 열기
                            disabled={isProcessing}
                            startIcon={isProcessing && alertMessage?.severity === "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2, marginRight: 'auto' }} 
                        >
                            삭제
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
                        
                        {/* 저장 (수정) 버튼 */}
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="large"
                            onClick={handleSave} 
                            // 저장 버튼 disabled 조건
                            disabled={
                                isProcessing || 
                                !title.trim() || 
                                isContentEmpty(content) || 
                                !isEditorReady
                            } 
                            startIcon={isProcessing && alertMessage?.severity !== "info" ? <CircularProgress size={20} color="inherit" /> : undefined}
                            sx={{ py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {isProcessing && alertMessage?.severity !== "info" ? "저장 중..." : "저장"}
                        </Button>
                    </Stack>
                </Box>
            </Box>
            
            {/* 삭제 확인 커스텀 모달 */}
            <Dialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"삭제 확인"}</DialogTitle>
                <DialogContent>
                    <Typography>
                        삭제하시겠습니까?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteConfirm(false)} color="primary" disabled={isProcessing}>
                        취소
                    </Button>
                    <Button 
                        onClick={executeDelete} 
                        color="error" 
                        variant="contained" 
                        autoFocus
                        disabled={isProcessing}
                        startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
                    >
                        확인
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}