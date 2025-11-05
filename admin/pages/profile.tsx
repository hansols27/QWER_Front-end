'use client';

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { api } from "@shared/services/axios";
import type { MemberState, MemberPayload, MemberSNS } from "@shared/types/member";
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

const memberIds = ["All", "Chodan", "Majenta", "Hina", "Siyeon"] as const;
const snsOptions = ["instagram", "youtube", "twitter", "cafe", "tiktok", "weverse"] as const;

// --- 상수 및 타입 ---
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB 제한 (백엔드와 일치하도록 설정)

type LocalSnsLink = {
    key: string; // 고유 key
    id: (typeof snsOptions)[number];
    url: string;
};

const initialMemberState: MemberState = {
    text: ["텍스트를 입력하세요."],
    image: [""],
    sns: {},
};

const initialSnsFields: LocalSnsLink[] = [{ key: uuidv4(), id: "instagram", url: "" }];

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
// TextFields
// ----------------------------
const TextFields = ({
    texts,
    onAdd,
    onRemove,
    onUpdate,
}: {
    texts: string[];
    onAdd: () => void;
    onRemove: (idx: number) => void;
    onUpdate: (idx: number, value: string) => void;
}) => (
    <>
        <Typography variant="subtitle1" mt={2} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
            내용
        </Typography>
        {texts.map((t, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={`text-${idx}`} mb={1}>
                <TextField
                    label={`텍스트 ${idx + 1}`}
                    value={t}
                    onChange={(e) => onUpdate(idx, e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                />
                {texts.length > 1 && (
                    <IconButton onClick={() => onRemove(idx)} color="error">
                        <DeleteIcon />
                    </IconButton>
                )}
            </Stack>
        ))}
        <Button onClick={onAdd} size="small" variant="outlined">
            추가
        </Button>
    </>
);

// ----------------------------
// ImageFields with preview + memory cleanup
// ----------------------------
const ImageFields = ({
    images,
    onAdd,
    onRemove,
    onUpdate,
}: {
    images: (string | File)[];
    onAdd: () => void;
    onRemove: (idx: number) => void;
    // onUpdate는 File 객체를 받도록 명시
    onUpdate: (idx: number, file: File) => void; 
}) => {
    const [previews, setPreviews] = useState<(string | null)[]>([]);

    useEffect(() => {
        const newPreviews = images.map((img) => (img instanceof File ? URL.createObjectURL(img) : img || null));
        setPreviews(newPreviews);

        // 메모리 해제
        return () => {
            newPreviews.forEach((url, idx) => {
                if (images[idx] instanceof File && url) URL.revokeObjectURL(url);
            });
        };
    }, [images]);

    const handleFileChange = (idx: number, e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpdate(idx, e.target.files[0]);
            // 파일 선택 후 input 값 초기화 (같은 파일 재선택 가능하도록)
            e.target.value = ''; 
        }
    };

    return (
        <>
            <Typography variant="subtitle1" mt={3} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
                이미지
            </Typography>
            {images.map((img, idx) => (
                <Stack direction="row" spacing={1} alignItems="center" key={`image-${idx}`} mb={1}>
                    <Box
                        component="img"
                        src={previews[idx] || undefined}
                        alt={`preview-${idx}`}
                        sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1, border: "1px solid #ccc" }}
                    />
                    <Button variant="outlined" component="label">
                        {/* 이미 파일이 선택된 경우와 아닌 경우 텍스트 구분 */}
                        {img instanceof File ? "파일 변경" : "파일 선택"} 
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => handleFileChange(idx, e)}
                        />
                    </Button>
                    <Typography
                        variant="body2"
                        sx={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                        {img instanceof File 
                            ? `선택됨: ${img.name}` 
                            : img 
                            ? `기존: ${img.substring(img.lastIndexOf("/") + 1)}` 
                            : "선택된 파일 없음"}
                    </Typography>
                    {images.length > 1 && (
                        <IconButton onClick={() => onRemove(idx)} color="error">
                            <DeleteIcon />
                        </IconButton>
                    )}
                </Stack>
            ))}
            <Button onClick={onAdd} size="small" variant="outlined">
                추가
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                * 최대 크기: {MAX_IMAGE_SIZE / 1024 / 1024}MB
            </Typography>
        </>
    );
};

// ----------------------------
// SNSFields
// ----------------------------
const SNSFields = ({
    fields,
    onAdd,
    onRemove,
    onUpdate,
}: {
    fields: LocalSnsLink[];
    onAdd: () => void;
    onRemove: (idx: number) => void;
    onUpdate: (idx: number, key: "id" | "url", value: string) => void;
}) => (
    <>
        <Typography variant="subtitle1" mt={3} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
            SNS 링크
        </Typography>
        {fields.map((field, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={field.key} mb={1}>
                <FormControl sx={{ minWidth: 120 }}>
                    <Select value={field.id} onChange={(e) => onUpdate(idx, "id", e.target.value)} displayEmpty>
                        {snsOptions.map((opt) => (
                            <MenuItem 
                                key={opt} 
                                value={opt}
                                // 이미 사용 중인 SNS 옵션은 비활성화 (단, 현재 필드의 ID는 제외)
                                disabled={fields.some((f, i) => i !== idx && f.id === opt)} 
                            >
                                {capitalize(opt)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField 
                    label="URL" 
                    value={field.url} 
                    onChange={(e) => onUpdate(idx, "url", e.target.value)} 
                    fullWidth 
                    placeholder="https://를 포함한 전체 URL"
                    type="url"
                />
                {fields.length > 1 && (
                    <IconButton onClick={() => onRemove(idx)} color="error">
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
// MemberForm
// ----------------------------
const MemberForm = ({ memberId }: { memberId: (typeof memberIds)[number] }) => {
    const [member, setMember] = useState<MemberState>({ ...initialMemberState });
    const [snsFields, setSnsFields] = useState<LocalSnsLink[]>(initialSnsFields);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

    const fetchMemberData = useCallback(async () => {
        if (!API_BASE_URL) return;
        setLoading(true);
        setLoadError(false);
        setAlertMessage(null);

        try {
            const res = await api.get<{ success: boolean; data: MemberPayload }>(`/api/members/${memberId}`);
            const data = res.data.data;

            const texts = data.contents.filter((c) => c.type === "text").map((c) => c.content);
            const images = data.contents.filter((c) => c.type === "image").map((c) => c.content);

            const fetchedSnsFields: LocalSnsLink[] = Object.entries(data.sns).map(([id, url]) => ({
                key: uuidv4(),
                id: id as (typeof snsOptions)[number],
                url: url || "",
            }));

            setMember({
                text: texts.length > 0 ? texts : initialMemberState.text,
                image: images.length > 0 ? images : initialMemberState.image,
                sns: data.sns,
            });
            setSnsFields(fetchedSnsFields.length > 0 ? fetchedSnsFields : initialSnsFields);
        } catch (err: any) {
            console.error(`Failed to load ${memberId} profile:`, err);
            setLoadError(true);
            const errorMsg = extractErrorMessage(err, `${memberId} 프로필 로드에 실패했습니다.`);
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [memberId]);

    useEffect(() => {
        fetchMemberData();
    }, [fetchMemberData]);

    // Field 업데이트
    const addText = () => setMember({ ...member, text: [...member.text, ""] });
    const removeText = (idx: number) => setMember({ ...member, text: member.text.filter((_, i) => i !== idx) });
    const updateText = (idx: number, value: string) => {
        const newText = [...member.text];
        newText[idx] = value;
        setMember({ ...member, text: newText });
    };

    const addImage = () => setMember({ ...member, image: [...member.image, ""] });
    const removeImage = (idx: number) => {
        // 제거 시 혹시 모를 메모리 해제 처리 (ImageFields의 useEffect에서 이미 처리되지만 안전을 위해)
        const imageToRemove = member.image[idx];
        if (imageToRemove instanceof File) {
            const url = URL.createObjectURL(imageToRemove);
            URL.revokeObjectURL(url);
        }
        setMember({ ...member, image: member.image.filter((_, i) => i !== idx) });
    };
    
    // --- 🚨 개선: 파일 유효성 검사 추가 ---
    const updateImage = (idx: number, file: File) => {
        // 1. 파일 크기 검사
        if (file.size > MAX_IMAGE_SIZE) {
            setAlertMessage({ 
                message: `파일 크기가 ${MAX_IMAGE_SIZE / 1024 / 1024}MB를 초과합니다.`, 
                severity: "error" 
            });
            return; 
        }
        // 2. 파일 타입 검사
        if (!file.type.startsWith('image/')) {
            setAlertMessage({ message: "이미지 파일만 업로드할 수 있습니다.", severity: "error" });
            return; 
        }
        
        // 유효성 통과 시
        setAlertMessage(null);
        const newImages = [...member.image];
        // 기존에 File 객체가 있었다면 메모리 해제
        const oldImage = newImages[idx];
        if (oldImage instanceof File) {
             const url = URL.createObjectURL(oldImage);
             URL.revokeObjectURL(url);
        }
        newImages[idx] = file; // 새 File 객체 저장
        setMember({ ...member, image: newImages });
    };

    const addSnsField = () => {
        const available = snsOptions.find((opt) => !snsFields.some((f) => f.id === opt));
        if (available) setSnsFields([...snsFields, { key: uuidv4(), id: available, url: "" }]);
    };
    const removeSnsField = (idx: number) => setSnsFields(snsFields.filter((_, i) => i !== idx));
    const updateSnsField = (idx: number, key: "id" | "url", value: string) => {
        const newFields = [...snsFields];
        if (key === "id") newFields[idx].id = value as (typeof snsOptions)[number];
        else newFields[idx].url = value;
        setSnsFields(newFields);
    };

    // 저장
    const handleSave = async () => {
        if (!API_BASE_URL) return;
        setLoading(true);
        setAlertMessage(null);

        // --- 🚨 개선: SNS URL 유효성 검사 ---
        const invalidLink = snsFields.find(
            (field) => field.url.trim() && !/^https?:\/\/.*/i.test(field.url.trim())
        );

        if (invalidLink) {
            setAlertMessage({ 
                message: `${capitalize(invalidLink.id)} 링크의 형식이 올바르지 않습니다. URL은 'http://' 또는 'https://'로 시작해야 합니다.`, 
                severity: "error" 
            });
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            const imageContentsPayload: { type: "image"; content: string }[] = [];
            const newImages: File[] = [];

            member.image.forEach((img) => {
                if (img instanceof File) {
                    newImages.push(img);
                    // 파일은 'images' 필드로 별도 전송하고, content는 빈 문자열로 대체
                    imageContentsPayload.push({ type: "image", content: "" }); 
                } else if (img) imageContentsPayload.push({ type: "image", content: img });
            });

            const contentsPayload: MemberPayload["contents"] = [
                ...member.text.filter(t => t.trim()).map((t) => ({ type: "text" as const, content: t })), // 빈 텍스트 필드 제외
                ...imageContentsPayload,
            ];

            const payload: MemberPayload = {
                id: memberId,
                name: memberId,
                contents: contentsPayload,
                sns: snsFields
                    .filter((f) => f.url.trim())
                    .reduce((acc, cur) => ({ ...acc, [cur.id]: cur.url }), {} as MemberSNS),
            };

            formData.append("payload", JSON.stringify(payload));
            newImages.forEach((img) => formData.append("images", img, img.name));

            await api.post(`/api/members`, formData, { headers: { "Content-Type": "multipart/form-data" } });

            // 저장 성공 후, 최신 데이터 다시 로드
            await fetchMemberData(); 
            setAlertMessage({ message: `${memberId} 데이터가 성공적으로 저장되었습니다!`, severity: "success" });
        } catch (err: any) {
            console.error("Save failed:", err);
            const errorMsg = extractErrorMessage(err, `${memberId} 데이터 저장에 실패했습니다.`);
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
                {memberId}
            </Typography>

            {loading && <CircularProgress size={24} sx={{ my: 2 }} />}
            {alertMessage && <Alert severity={alertMessage.severity} sx={{ mt: 2, mb: 2 }}>{alertMessage.message}</Alert>}

            <TextFields texts={member.text} onAdd={addText} onRemove={removeText} onUpdate={updateText} />
            <ImageFields images={member.image} onAdd={addImage} onRemove={removeImage} onUpdate={updateImage} />
            <SNSFields fields={snsFields} onAdd={addSnsField} onRemove={removeSnsField} onUpdate={updateSnsField} />

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