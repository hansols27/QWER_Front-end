"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "./api/axios"; // ✅ axios → api로 통일
import type { MemberState, MemberPayload, MemberSNS } from "@shared/types/member";
import Layout from "../components/common/layout";
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
} from "@mui/material";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ===========================
// 유틸리티 함수
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
  if (
    error &&
    error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    error.response.data.message
  ) {
    return error.response.data.message;
  }
  if (error && typeof error === "object" && error.message) {
    return error.message;
  }
  return defaultMsg;
};

// ===========================
// 멤버 ID 및 SNS 목록
// ===========================
const memberIds = ["All", "Chodan", "Majenta", "Hina", "Siyeon"] as const;
const snsOptions = ["instagram", "youtube", "twitter", "cafe", "tiktok", "weverse"] as const;

type LocalSnsLink = {
  id: (typeof snsOptions)[number];
  url: string;
};

// ===========================
// 초기 상태
// ===========================
const initialMemberState: MemberState = {
  text: ["프로필 텍스트를 입력하세요."],
  image: [""],
  sns: {},
};
const initialSnsFields: LocalSnsLink[] = [{ id: "instagram", url: "" }];

// ===========================
// MemberForm 컴포넌트
// ===========================
const MemberForm = ({ memberId }: { memberId: (typeof memberIds)[number] }) => {
  const [member, setMember] = useState<MemberState>({ ...initialMemberState });
  const [snsFields, setSnsFields] = useState<LocalSnsLink[]>(initialSnsFields);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  /**
   * [Read] 현재 멤버의 프로필 데이터를 백엔드에서 불러옵니다.
   */
  const fetchMemberData = useCallback(async () => {
    if (!API_BASE_URL) return;
    setLoading(true);
    setLoadError(false);
    setAlertMessage(null);

    try {
      // ✅ axios → api로 변경
      const res = await api.get<{ success: boolean; data: MemberPayload }>(`/api/members/${memberId}`);
      const data = res.data.data;

      const texts = data.contents.filter((c) => c.type === "text").map((c) => c.content);
      const images = data.contents.filter((c) => c.type === "image").map((c) => c.content);

      const fetchedSnsFields: LocalSnsLink[] = Object.entries(data.sns).map(([id, url]) => ({
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

  // ===========================
  // 필드 업데이트 함수
  // ===========================
  const addText = () => setMember({ ...member, text: [...member.text, ""] });
  const removeText = (idx: number) => setMember({ ...member, text: member.text.filter((_, i) => i !== idx) });
  const updateText = (idx: number, value: string) => {
    const newText = [...member.text];
    newText[idx] = value;
    setMember({ ...member, text: newText });
  };

  const addImage = () => setMember({ ...member, image: [...member.image, ""] });
  const removeImage = (idx: number) => setMember({ ...member, image: member.image.filter((_, i) => i !== idx) });
  const updateImage = (idx: number, file: File) => {
    const newImages = [...member.image];
    newImages[idx] = file;
    setMember({ ...member, image: newImages });
  };

  const addSnsField = () => setSnsFields([...snsFields, { id: "instagram", url: "" }]);
  const removeSnsField = (idx: number) => setSnsFields(snsFields.filter((_, i) => i !== idx));
  const updateSnsField = (idx: number, key: "id" | "url", value: string) => {
    const newFields = [...snsFields];
    if (key === "id") newFields[idx].id = value as (typeof snsOptions)[number];
    else newFields[idx].url = value;
    setSnsFields(newFields);
  };

  /**
   * [Create/Update] 멤버 데이터를 백엔드에 저장합니다.
   */
  const handleSave = async () => {
    if (!API_BASE_URL) return;
    setLoading(true);
    setAlertMessage(null);

    try {
      const formData = new FormData();

      const imageContentsPayload: { type: "image"; content: string }[] = [];
      const newImages: File[] = [];

      member.image.forEach((img) => {
        if (img instanceof File) {
          newImages.push(img);
          imageContentsPayload.push({ type: "image", content: "" });
        } else if (img) {
          imageContentsPayload.push({ type: "image", content: img });
        }
      });

      const contentsPayload: MemberPayload["contents"] = [
        ...member.text.map((t) => ({ type: "text" as const, content: t })),
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
      newImages.forEach((img) => {
        formData.append("images", img, img.name);
      });

      // ✅ axios.post → api.post
      await api.post(`/api/members`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchMemberData();
      setAlertMessage({ message: `${memberId} 데이터가 성공적으로 저장되었습니다!`, severity: "success" });
    } catch (err: any) {
      console.error("Save failed:", err);
      const errorMsg = extractErrorMessage(err, `${memberId} 데이터 저장에 실패했습니다. 백엔드 로그를 확인하세요.`);
      setAlertMessage({ message: errorMsg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // UI
  // ===========================
  return (
    <Box
      mb={4}
      p={2}
      border="1px solid #ccc"
      borderRadius={2}
      sx={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
    >
      <Typography variant="h5" sx={{ fontWeight: "bold" }}>
        {memberId} 프로필
      </Typography>

      {loading && <CircularProgress size={24} sx={{ my: 2 }} />}

      {alertMessage && (
        <Alert severity={alertMessage.severity} sx={{ mt: 2, mb: 2 }}>
          {alertMessage.message}
        </Alert>
      )}

      {/* 텍스트 필드 */}
      <Typography variant="subtitle1" mt={2} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
        텍스트 (설명)
      </Typography>
      {member.text.map((t, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={`text-${idx}`} mb={1}>
          <TextField label={`텍스트 ${idx + 1}`} value={t} onChange={(e) => updateText(idx, e.target.value)} fullWidth multiline rows={2} />
          {member.text.length > 1 && (
            <Button onClick={() => removeText(idx)} color="error" size="small" variant="outlined">
              삭제
            </Button>
          )}
        </Stack>
      ))}
      <Button onClick={addText} size="small" variant="outlined">
        추가
      </Button>

      {/* 이미지 필드 */}
      <Typography variant="subtitle1" mt={3} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
        이미지 (파일)
      </Typography>
      {member.image.map((img, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={`image-${idx}`} mb={1}>
          <input type="file" accept="image/*" onChange={(e) => e.target.files && updateImage(idx, e.target.files[0])} style={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {img instanceof File ? img.name : img ? `기존 파일: ${img.substring(img.lastIndexOf("/") + 1)}` : "선택된 파일 없음"}
          </Typography>
          {member.image.length > 1 && (
            <Button onClick={() => removeImage(idx)} color="error" size="small" variant="outlined">
              삭제
            </Button>
          )}
        </Stack>
      ))}
      <Button onClick={addImage} size="small" variant="outlined">
        이미지 추가
      </Button>

      {/* SNS 필드 */}
      <Typography variant="subtitle1" mt={3} mb={1} sx={{ color: "primary.main", fontWeight: "bold" }}>
        SNS 링크
      </Typography>
      {snsFields.map((field, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={`sns-${idx}`} mb={1}>
          <FormControl sx={{ minWidth: 120 }}>
            <Select value={field.id} onChange={(e) => updateSnsField(idx, "id", e.target.value)} displayEmpty>
              {snsOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="URL (전체 주소)" value={field.url} onChange={(e) => updateSnsField(idx, "url", e.target.value)} fullWidth />
          {snsFields.length > 1 && (
            <Button onClick={() => removeSnsField(idx)} color="error" size="small" variant="outlined">
              삭제
            </Button>
          )}
        </Stack>
      ))}
      <Button onClick={addSnsField} size="small" variant="outlined">
        추가
      </Button>

      <Box mt={4}>
        <Button
          variant="contained"
          color="success"
          onClick={handleSave}
          disabled={loading || loadError}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? "저장 중..." : `${memberId} 프로필 저장`}
        </Button>
      </Box>
    </Box>
  );
};

// ===========================
// Profile 페이지
// ===========================
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
          프로필
        </Typography>
        {memberIds.map((id) => (
          <MemberForm key={id} memberId={id} />
        ))}
      </Box>
    </Layout>
  );
}
