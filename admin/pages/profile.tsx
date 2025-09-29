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
} from "@mui/material";

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
    const newImages = [...member.image];
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
    try {
      const formData = new FormData();
      formData.append(
        "payload",
        JSON.stringify({
          id: memberId,
          name: memberId,
          contents: [
            ...member.text.map((t) => ({ type: "text", content: t })),
            ...member.image.map((img) => ({ type: "image", content: "" })),
          ],
          sns: snsFields.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.url }), {}),
        })
      );

      member.image.forEach((img) => {
        if (img instanceof File) formData.append("images", img);
      });

      await axios.post("/api/member", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("저장 완료!");
    } catch (err) {
      console.error(err);
      alert("저장 실패");
    }
  };

  return (
    <Box mb={4} p={2} border="1px solid #ccc" borderRadius={2}>
      <Typography variant="h6">{memberId}</Typography>

      {/* 텍스트 필드 */}
      {member.text.map((t, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={idx} mb={1}>
          <TextField
            label={`텍스트 ${idx + 1}`}
            value={t}
            onChange={(e) => updateText(idx, e.target.value)}
            fullWidth
          />
          {member.text.length > 1 && (
            <Button onClick={() => removeText(idx)}>삭제</Button>
          )}
        </Stack>
      ))}
      <Button onClick={addText} size="small">
        추가
      </Button>

      {/* 이미지 필드 */}
      {member.image.map((img, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={idx} mb={1}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && updateImage(idx, e.target.files[0])}
          />
          {member.image.length > 1 && (
            <Button onClick={() => removeImage(idx)}>삭제</Button>
          )}
        </Stack>
      ))}
      <Button onClick={addImage} size="small">
        추가
      </Button>

      {/* SNS 필드 */}
      {snsFields.map((field, idx) => (
        <Stack direction="row" spacing={1} alignItems="center" key={idx} mb={1}>
          <FormControl>
            <Select
              value={field.id}
              onChange={(e) => updateSnsField(idx, "id", e.target.value)}
            >
              {snsOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
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
            <Button onClick={() => removeSnsField(idx)}>삭제</Button>
          )}
        </Stack>
      ))}
      <Button onClick={addSnsField} size="small">
        추가
      </Button>

      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          저장
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
      {memberIds.map((id) => (
        <MemberForm key={id} memberId={id} />
      ))}
    </Layout>
  );
}
