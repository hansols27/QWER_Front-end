import { useState } from "react";
import axios from "axios";
import type { MemberState, MemberPayload } from "@shared/types/member";
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

// 환경 변수를 사용하여 API 기본 URL 설정
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!NEXT_PUBLIC_API_URL) {
  console.error("API_BASE_URL 환경 변수가 설정되지 않았습니다. API 호출이 실패할 수 있습니다.");
}

// ===========================
// 멤버 ID 목록
// ===========================
const memberIds = ["All", "Chodan", "Majenta", "Hina", "Siyeon"] as const;

// ===========================
// SNS 종류
// ===========================
const snsOptions = ["instagram", "youtube", "twitter", "cafe", "tiktok"] as const;

// ===========================
// 초기 상태
// ===========================
const initialMemberState: MemberState = {
  text: [""],
  image: [""],
  sns: {},
};

// ===========================
// MemberForm 컴포넌트
// ===========================
const MemberForm = ({ memberId }: { memberId: string }) => {
  const [member, setMember] = useState<MemberState>({ ...initialMemberState });
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: "success" | "error" } | null>(null);

  // 텍스트 필드
  const addText = () => setMember({ ...member, text: [...member.text, ""] });
  const removeText = (idx: number) =>
    setMember({ ...member, text: member.text.filter((_, i) => i !== idx) });
  const updateText = (idx: number, value: string) => {
    const newText = [...member.text];
    newText[idx] = value;
    setMember({ ...member, text: newText });
  };

  // 이미지 필드
  const addImage = () => setMember({ ...member, image: [...member.image, ""] });
  const removeImage = (idx: number) =>
    setMember({ ...member, image: member.image.filter((_, i) => i !== idx) });
  const updateImage = (idx: number, file: File) => {
    const newImages: (string | File)[] = [...member.image];
    newImages[idx] = file;
    setMember({ ...member, image: newImages });
  };

  // SNS 필드
  const [snsFields, setSnsFields] = useState<{ id: typeof snsOptions[number]; url: string }[]>([
    { id: "instagram", url: "" },
  ]);
  const addSnsField = () =>
    setSnsFields([...snsFields, { id: "instagram", url: "" }]);
  const removeSnsField = (idx: number) =>
    setSnsFields(snsFields.filter((_, i) => i !== idx));
  const updateSnsField = (idx: number, key: "id" | "url", value: string) => {
    const newFields = [...snsFields];
    if (key === "id") newFields[idx].id = value as typeof snsOptions[number];
    else newFields[idx].url = value;
    setSnsFields(newFields);
  };

  // 저장
  const handleSave = async () => {
    if (!NEXT_PUBLIC_API_URL) {
      setAlertMessage({ message: "API 주소가 설정되지 않아 저장할 수 없습니다.", severity: "error" });
      return;
    }
    setLoading(true);
    setAlertMessage(null);

    try {
      const formData = new FormData();

      // ⭐️ Contents 배열 생성 시 명시적인 타입 단언 추가
      const contents = [
          ...member.text.map((t) => ({ type: "text" as const, content: t })),
          ...member.image.map(() => ({ type: "image" as const, content: "" })),
      ];

      const payload: MemberPayload = {
        id: memberId,
        name: memberId,
        contents: contents, // 타입이 명시된 contents 배열 사용
        sns: snsFields.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.url }), {}),
      };

      formData.append("payload", JSON.stringify(payload));

      member.image.forEach((img) => {
        if (img instanceof File) formData.append("images", img, img.name);
      });

      // ⭐️ 절대 경로 사용
      await axios.post(`${NEXT_PUBLIC_API_URL}/api/members`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAlertMessage({ message: `${memberId} 데이터가 성공적으로 저장되었습니다!`, severity: "success" });
    } catch (err) {
      console.error(err);
      setAlertMessage({ message: `${memberId} 데이터 저장에 실패했습니다. 백엔드 로그를 확인하세요.`, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box mb={4} p={2} border="1px solid #ccc" borderRadius={2}>
      <Typography variant="h6">{memberId} 프로필 설정</Typography>
      
      {alertMessage && (
        <Alert severity={alertMessage.severity} sx={{ mt: 2, mb: 2 }}>
          {alertMessage.message}
        </Alert>
      )}

      {/* 텍스트 필드 */}
      <Typography variant="subtitle1" mt={2} mb={1}>텍스트 콘텐츠</Typography>
      {member.text.map((t, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={`text-${idx}`} mb={1}>
          <TextField
            label={`텍스트 ${idx + 1}`}
            value={t}
            onChange={(e) => updateText(idx, e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
          {member.text.length > 1 && (
            <Button onClick={() => removeText(idx)} color="error" size="small" variant="outlined">삭제</Button>
          )}
        </Stack>
      ))}
      <Button onClick={addText} size="small" variant="outlined">
        텍스트 필드 추가
      </Button>

      {/* 이미지 필드 */}
      <Typography variant="subtitle1" mt={3} mb={1}>이미지 콘텐츠</Typography>
      {member.image.map((img, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={`image-${idx}`} mb={1}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && updateImage(idx, e.target.files[0])}
            style={{ flexGrow: 1 }}
          />
          <Typography variant="body2" sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {img instanceof File ? img.name : '선택된 파일 없음'}
          </Typography>
          {member.image.length > 1 && (
            <Button onClick={() => removeImage(idx)} color="error" size="small" variant="outlined">삭제</Button>
          )}
        </Stack>
      ))}
      <Button onClick={addImage} size="small" variant="outlined">
        이미지 필드 추가
      </Button>

      {/* SNS 필드 */}
      <Typography variant="subtitle1" mt={3} mb={1}>SNS 링크</Typography>
      {snsFields.map((field, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={`sns-${idx}`} mb={1}>
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={field.id}
              onChange={(e) => updateSnsField(idx, "id", e.target.value)}
              displayEmpty
            >
              {snsOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="URL"
            value={field.url}
            onChange={(e) => updateSnsField(idx, "url", e.target.value)}
            fullWidth
          />
          {snsFields.length > 1 && (
            <Button onClick={() => removeSnsField(idx)} color="error" size="small" variant="outlined">삭제</Button>
          )}
        </Stack>
      ))}
      <Button onClick={addSnsField} size="small" variant="outlined">
        SNS 링크 추가
      </Button>

      <Box mt={4}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSave} 
          disabled={loading || !NEXT_PUBLIC_API_URL}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? "저장 중..." : "저장"}
        </Button>
      </Box>
    </Box>
  );
};

// ===========================
// Profile 페이지
// ===========================
export default function Profile() {
  return (
    <Layout>
      <Box p={4}>
        <Typography variant="h3" mb={4}>멤버 프로필 관리</Typography>
        {memberIds.map((id) => (
          <MemberForm key={id} memberId={id} />
        ))}
      </Box>
    </Layout>
  );
}