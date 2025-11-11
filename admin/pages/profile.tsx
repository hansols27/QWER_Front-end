'use client';

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { api } from "@shared/services/axios";
import type { 
    TextItem, 
    ImageItem as APIImageItem, 
    SNSLinkItem, 
    MemberProfileState, 
    MemberProfilePayload 
} from "@shared/types/member/admin"; 
import Layout from "@components/common/layout";
import {
    Box,
    Button,
    TextField,
    Stack,
    Typography,
    MenuItem,
    Select,
    FormControl,
    Alert,
    CircularProgress,
    IconButton,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import DeleteIcon from "@mui/icons-material/Delete";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const memberIds = ["All", "Q", "W", "E", "R"] as const; 
const memberNames = ["QWER", "Chodan", "Majenta", "Hina", "Siyeon"] as const;
const snsOptions = ["instagram", "youtube", "twitter", "cafe", "tiktok", "weverse"] as const;

// --- 상수 및 타입 ---
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB 제한
const MAX_TEXT_FIELDS = 3; 
const MAX_IMAGE_FIELDS = 4; 

// 로컬 상태에서 File 객체를 포함하는 타입 정의
type LocalImageItem = {
    id: string;
    url: string; 
    file?: File; 
};

// LocalMemberProfileState 타입 정의: MemberProfileState를 확장하고 images 속성만 LocalImageItem[]으로 덮어씁니다.
type LocalMemberProfileState = MemberProfileState & {
    images: LocalImageItem[];
};


// MemberProfileState의 컨텐츠 필드 초기값
const initialContentState = {
    texts: [{ id: uuidv4(), content: "" }] as TextItem[],
    images: [{ id: uuidv4(), url: "", file: undefined }] as LocalImageItem[], 
    snslinks: [{ id: uuidv4(), type: "instagram", url: "" }] as SNSLinkItem[],
};


// ----------------------------
// 유틸
// ----------------------------
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// ----------------------------
// TextFields 컴포넌트
// ----------------------------
const TextFields = ({ texts, onAdd, onRemove, onUpdate }: { texts: TextItem[]; onAdd: () => void; onRemove: (id: string) => void; onUpdate: (id: string, value: string) => void; }) => (
    <>
        <Typography variant="subtitle1" mt={2} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
            내용 (최대 {MAX_TEXT_FIELDS}개)
        </Typography>
        {texts.map((item, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={item.id} mb={1}>
                <TextField
                    label={`텍스트 ${idx + 1}`}
                    value={item.content}
                    onChange={(e) => onUpdate(item.id, e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                />
                {texts.length > 1 && (
                    <IconButton onClick={() => onRemove(item.id)} color="error">
                        <DeleteIcon />
                    </IconButton>
                )}
            </Stack>
        ))}
        <Button onClick={onAdd} size="small" variant="outlined" disabled={texts.length >= MAX_TEXT_FIELDS}>
            추가
        </Button>
    </>
);


// ----------------------------
// ImageFields 컴포넌트 (수정됨)
// ----------------------------
const ImageFields = ({ images, onAdd, onRemove, onUpdate, }: { images: LocalImageItem[]; onAdd: () => void; onRemove: (id: string) => void; onUpdate: (id: string, file: File) => void; }) => {
    const [previews, setPreviews] = useState<Record<string, string | null>>({});

    useEffect(() => {
        const newPreviews: Record<string, string | null> = {};
        images.forEach((item) => {
            if (item.file) {
                newPreviews[item.id] = URL.createObjectURL(item.file);
            } else if (item.url) {
                newPreviews[item.id] = item.url;
            } else {
                newPreviews[item.id] = null;
            }
        });
        setPreviews(newPreviews);
        return () => {
            // Cleanup: 사용하지 않는 Blob URL 해제
            Object.values(newPreviews).forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [images]);

    const handleFileChange = (id: string, e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpdate(id, e.target.files[0]);
            e.target.value = ''; 
        }
    };

    return (
        <>
            <Typography variant="subtitle1" mt={3} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
                이미지 (최대 {MAX_IMAGE_FIELDS}개)
            </Typography>
            {images.map((item, idx) => {
                const previewUrl = previews[item.id];
                return (
                    <Stack direction="row" spacing={1} alignItems="center" key={item.id} mb={1}>
                        {/* 이미지가 있을 때만 프리뷰 영역 표시 */}
                        {previewUrl && (
                            <Box
                                component="img"
                                src={previewUrl || undefined}
                                alt={`preview-${idx}`}
                                sx={{ 
                                    width: 80, 
                                    height: 80, 
                                    objectFit: "cover", 
                                    borderRadius: 1, 
                                    border: "1px solid #ccc",
                                }}
                            />
                        )}
                        <Button variant="outlined" component="label">
                            {item.file || item.url.length > 0 ? "파일 변경" : "파일 선택"} 
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => handleFileChange(item.id, e)}
                            />
                        </Button>
                        <Typography
                            variant="body2"
                            sx={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                            {item.file 
                                ? `선택됨: ${item.file.name}` 
                                : item.url
                                ? `기존: ${item.url.substring(item.url.lastIndexOf("/") + 1)}` 
                                : "선택된 파일 없음"}
                        </Typography>
                        {images.length > 1 && (
                            <IconButton onClick={() => onRemove(item.id)} color="error">
                                <DeleteIcon />
                            </IconButton>
                        )}
                    </Stack>
                );
            })}
            <Button onClick={onAdd} size="small" variant="outlined" disabled={images.length >= MAX_IMAGE_FIELDS}>
                추가
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                * 최대 크기: {MAX_IMAGE_SIZE / 1024 / 1024}MB
            </Typography>
        </>
    );
};

// ----------------------------
// SNSFields 컴포넌트
// ----------------------------
const SNSFields = ({ fields, onAdd, onRemove, onUpdate, }: { fields: SNSLinkItem[]; onAdd: () => void; onRemove: (id: string) => void; onUpdate: (id: string, key: "type" | "url", value: string) => void; }) => (
    <>
        <Typography variant="subtitle1" mt={3} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
            SNS 링크 (최대 {snsOptions.length}개)
        </Typography>
        {fields.map((item, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={item.id} mb={1}>
                <FormControl sx={{ minWidth: 120 }}>
                    <Select 
                        value={item.type} 
                        onChange={(e) => onUpdate(item.id, "type", e.target.value)} 
                        displayEmpty
                    >
                        {snsOptions.map((opt) => (
                            <MenuItem 
                                key={opt} 
                                value={opt}
                                disabled={fields.some((f) => f.id !== item.id && f.type === opt)} 
                            >
                                {capitalize(opt)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField 
                    label="URL" 
                    value={item.url} 
                    onChange={(e) => onUpdate(item.id, "url", e.target.value)} 
                    fullWidth 
                    placeholder="https://를 포함한 전체 URL"
                    type="url"
                />
                {fields.length > 1 && (
                    <IconButton onClick={() => onRemove(item.id)} color="error">
                        <DeleteIcon />
                    </IconButton>
                )}
            </Stack>
        ))}
        <Button onClick={onAdd} size="small" variant="outlined" disabled={fields.length >= snsOptions.length}>
            추가
        </Button>
    </>
);

// ----------------------------
// MemberForm (수정됨)
// ----------------------------
const MemberForm = ({ memberId }: { memberId: (typeof memberIds)[number] }) => {
    
    const memberName = memberNames[memberIds.indexOf(memberId as (typeof memberIds)[number])] || memberId;
    
    const initialLocalState: LocalMemberProfileState = {
        id: memberId, 
        name: memberName,
        type: memberId,
        texts: initialContentState.texts,
        images: initialContentState.images,
        snslinks: initialContentState.snslinks,
    };
    
    const [member, setMember] = useState<LocalMemberProfileState>({ ...initialLocalState });
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

    const fetchMemberData = useCallback(async () => {
        if (!API_BASE_URL) return;
        setLoading(true);
        setLoadError(false);
        setAlertMessage(null);

        try {
            const res = await api.get<{ success: boolean; data: MemberProfileState }>(`/api/members/${memberId}`);
            const data = res.data.data;
            
            const loadedImages: LocalImageItem[] = data.images.map(img => ({ 
                id: img.id, 
                url: img.url, 
                file: undefined 
            }));

            setMember({
                id: data.id as (typeof memberIds)[number],
                name: data.name,
                type: data.type,
                texts: data.texts.length > 0 ? data.texts : initialContentState.texts,
                images: loadedImages.length > 0 ? loadedImages : initialContentState.images,
                snslinks: data.snslinks.length > 0 ? data.snslinks : initialContentState.snslinks,
            });

        } catch (err: any) {
            if (err?.response?.status === 404) {
                console.log(`Profile for ${memberId} not found, loading initial state.`);
                setMember({ ...initialLocalState }); 
                setLoadError(false);
                setAlertMessage(null);
            } else {
                console.error(`Failed to load ${memberId} profile:`, err);
                setLoadError(true);
                const errorMsg = extractErrorMessage(err, `${memberName} 프로필 로드에 실패했습니다.`);
                setAlertMessage({ message: errorMsg, severity: "error" });
            }
        } finally {
            setLoading(false);
        }
    }, [memberId, memberName]);

    useEffect(() => {
        fetchMemberData();
    }, [fetchMemberData]);

    // Field 업데이트 
    // --- Text ---
    const addText = () => {
        if (member.texts.length < MAX_TEXT_FIELDS) {
            setMember(prev => ({ ...prev, texts: [...prev.texts, { id: uuidv4(), content: "" }] }));
        }
    };
    const removeText = (id: string) => setMember(prev => ({ ...prev, texts: prev.texts.filter((t) => t.id !== id) }));
    const updateText = (id: string, value: string) => {
        setMember(prev => ({ 
            ...prev, 
            texts: prev.texts.map((t) => t.id === id ? { ...t, content: value } : t) 
        }));
    };

    // --- Image ---
    const addImage = () => {
        if (member.images.length < MAX_IMAGE_FIELDS) {
            setMember(prev => ({ ...prev, images: [...prev.images, { id: uuidv4(), url: "", file: undefined }] }));
        }
    };

    const removeImage = (id: string) => {
        const imageToRemove = member.images.find(img => img.id === id) as LocalImageItem | undefined;

        if (imageToRemove?.file) { 
             try {
                // Blob URL revoke 처리는 ImageFields 컴포넌트의 useEffect에서 처리합니다.
             } catch(e) { /* ignore */ }
        }
        setMember(prev => ({ ...prev, images: prev.images.filter((i) => i.id !== id) }));
    };
    
    const updateImage = (id: string, file: File) => {
        if (file.size > MAX_IMAGE_SIZE) {
            setAlertMessage({ 
                message: `파일 크기가 ${MAX_IMAGE_SIZE / 1024 / 1024}MB를 초과합니다.`, 
                severity: "error" 
            });
            return; 
        }
        if (!file.type.startsWith('image/')) {
            setAlertMessage({ message: "이미지 파일만 업로드할 수 있습니다.", severity: "error" });
            return; 
        }
        
        setAlertMessage(null);
        setMember(prev => ({ 
            ...prev, 
            images: prev.images.map((i) => {
                if (i.id === id) {
                    return { ...i, file: file, url: "" }; 
                }
                return i;
            }) 
        }));
    };

    // --- SNS ---
    const addSnsField = () => {
        const usedTypes = member.snslinks.map(f => f.type);
        const available = snsOptions.find((opt) => !usedTypes.includes(opt));
        if (available) {
            setMember(prev => ({ 
                ...prev, 
                snslinks: [...prev.snslinks, { id: uuidv4(), type: available as (typeof snsOptions)[number], url: "" }] 
            }));
        }
    };
    const removeSnsField = (id: string) => setMember(prev => ({ ...prev, snslinks: prev.snslinks.filter((f) => f.id !== id) }));
    const updateSnsField = (id: string, key: "type" | "url", value: string) => {
        setMember(prev => ({
            ...prev,
            snslinks: prev.snslinks.map((f) => {
                if (f.id === id) {
                    return { ...f, [key]: key === "type" ? value as (typeof snsOptions)[number] : value };
                }
                return f;
            }),
        }));
    };

    // 저장
    const handleSave = async () => {
        if (!API_BASE_URL) return;
        setLoading(true);
        setAlertMessage(null);

        const invalidLink = member.snslinks.find(
            (field) => field.url.trim() && !/^https?:\/\/.*/i.test(field.url.trim())
        );

        if (invalidLink) {
            setAlertMessage({ 
                message: `${capitalize(invalidLink.type)} 링크의 형식이 올바르지 않습니다. URL은 'http://' 또는 'https://'로 시작해야 합니다.`, 
                severity: "error" 
            });
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            const payloadImages: APIImageItem[] = []; 
            const newImageFiles: File[] = [];

            (member.images as LocalImageItem[]).forEach((item: LocalImageItem) => {
                const apiItem: APIImageItem = { id: item.id, url: item.url };

                if (item.file) {
                    newImageFiles.push(item.file);
                    payloadImages.push({ ...apiItem, url: "file_placeholder" }); 
                } else if (item.url) {
                    payloadImages.push(apiItem);
                }
            });

            const payload: MemberProfilePayload = {
                id: member.id as (typeof memberIds)[number], 
                name: member.name, 
                type: member.type, 
                
                texts: member.texts.filter(t => t.content.trim()),
                images: payloadImages,
                snslinks: member.snslinks.filter(f => f.url.trim()), 
            };

            formData.append("payload", JSON.stringify(payload));
            newImageFiles.forEach((file) => formData.append("images", file, file.name));

            await api.post(`/api/members/${memberId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

            await fetchMemberData(); 
            setAlertMessage({ message: `${memberName} 데이터가 성공적으로 저장되었습니다!`, severity: "success" });
        } catch (err: any) {
            console.error("Save failed:", err);
            const errorMsg = extractErrorMessage(err, `${memberName} 데이터 저장에 실패했습니다.`);
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            mb={4}
            p={2}
            border="1px solid #ccc"
            borderRadius={2}
            sx={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
        >
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                {/* ID 표시 제거 */}
                {memberName}
            </Typography>

            {loading && <CircularProgress size={24} sx={{ my: 2 }} />}
            {alertMessage && <Alert severity={alertMessage.severity} sx={{ mt: 2, mb: 2 }}>{alertMessage.message}</Alert>}

            <TextFields texts={member.texts} onAdd={addText} onRemove={removeText} onUpdate={updateText} />
            <ImageFields images={member.images} onAdd={addImage} onRemove={removeImage} onUpdate={updateImage} />
            <SNSFields fields={member.snslinks} onAdd={addSnsField} onRemove={removeSnsField} onUpdate={updateSnsField} />

            <Box mt={4}>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSave}
                    disabled={loading || loadError}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
                >
                    {loading ? "저장 중..." : "저장"}
                </Button>
            </Box>
        </Box>
    );
};

// ----------------------------
// Profile 페이지
// ----------------------------
export default function Profile() {
    if (!API_BASE_URL) {
        return (
            <Layout>
                <Box p={4}>
                    <Alert severity="error">
                        <Typography fontWeight="bold">환경 설정 오류:</Typography> .env 파일에 NEXT_PUBLIC_API_URL이 설정되어 있지 않습니다.
                    </Alert>
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box p={4}>
                <Typography variant="h3" mb={4} fontWeight="bold">
                    프로필 관리
                </Typography>
                {memberIds.map((id) => (
                    <MemberForm key={id} memberId={id} />
                ))}
            </Box>
        </Layout>
    );
}