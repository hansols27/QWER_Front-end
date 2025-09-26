import { useState, useEffect } from "react";
import Layout from "../components/common/layout";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import type { MemberSNS, MemberState, MemberPayload } from "@shared/types/member";

const MEMBER_IDS = ["All", "Chodan", "Majenta", "Hina", "Siyeon"];
const SNS_KEYS = ["youtube", "instagram", "twitter", "tiktok", "weverse", "cafe"];
const MAX_IMAGES = 4;
const MAX_SNS = 6;

export default function ProfilePage() {
  const [members, setMembers] = useState<Record<string, MemberState>>(
    Object.fromEntries(MEMBER_IDS.map((id) => [id, { text: [""], image: [], sns: {} }])) as Record<string, MemberState>
  );
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ----------------------
  // 데이터 불러오기
  // ----------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("데이터 불러오기 실패");
        const data = await res.json();

        const formatted: Record<string, MemberState> = {} as Record<string, MemberState>;
        MEMBER_IDS.forEach((id) => {
          const member = data.find((m: any) => m.id === id);
          formatted[id] = {
            text: member ? member.contents.filter((c: any) => c.type === "text").map((c: any) => c.content) : [""],
            image: member ? member.contents.filter((c: any) => c.type === "image").map((c: any) => c.content) : [],
            sns: member?.sns || {},
          };
        });
        setMembers(formatted);
      } catch (err) {
        console.error(err);
        setAlert({ type: "error", message: "데이터 로드 실패" });
      }
    };
    fetchData();
  }, []);

  // ----------------------
  // 핸들러
  // ----------------------
  const handleTextChange = (id: string, index: number, value: string) => {
    setMembers((prev) => ({
      ...prev,
      [id]: { ...prev[id], text: prev[id].text.map((t, i) => (i === index ? value : t)) },
    }));
  };
  const handleAddText = (id: string) =>
    setMembers((prev) => ({ ...prev, [id]: { ...prev[id], text: [...prev[id].text, ""] } }));
  const handleRemoveText = (id: string, index: number) =>
    setMembers((prev) => ({
      ...prev,
      [id]: { ...prev[id], text: prev[id].text.filter((_, i) => i !== index) },
    }));

  const handleImageChange = (id: string, files: FileList | null) => {
    if (!files) return;
    setMembers((prev) => {
      const newImages = [...prev[id].image, ...Array.from(files)];
      return { ...prev, [id]: { ...prev[id], image: newImages.slice(0, MAX_IMAGES) } };
    });
  };
  const handleRemoveImage = (id: string, index: number) =>
    setMembers((prev) => ({
      ...prev,
      [id]: { ...prev[id], image: prev[id].image.filter((_, i) => i !== index) },
    }));

  const handleSNSChange = (id: string, key: string, value: string) =>
    setMembers((prev) => ({ ...prev, [id]: { ...prev[id], sns: { ...prev[id].sns, [key]: value } } }));

  // ----------------------
  // 저장 핸들러 (백엔드 유효성 검사 활용)
  // ----------------------
  const handleSave = async () => {
    try {
      setLoading(true);

      // payload 생성 (File 제외 → string URL만)
      const payload: MemberPayload[] = MEMBER_IDS.map((id) => {
        const memberSNS = Object.fromEntries(
          Object.entries(members[id].sns)
            .filter(([_, v]) => typeof v === "string" && v.trim() !== "")
            .slice(0, MAX_SNS)
        ) as MemberSNS;

        return {
          id,
          name: id,
          contents: [
            // 텍스트
            ...members[id].text.filter((t) => t.trim() !== "").map((t) => ({ type: "text" as const, content: t })),
            // 이미지: string URL만
            ...members[id].image
              .filter((img): img is string => typeof img === "string")
              .map((url) => ({ type: "image" as const, content: url })),
          ],
          sns: memberSNS,
        };
      });

      // FormData 준비
      const formData = new FormData();
      formData.append("data", JSON.stringify({ members: payload }));

      // File만 FormData에 추가
      Object.entries(members).forEach(([id, state]) =>
        state.image.forEach((img, idx) => {
          if (img instanceof File) {
            formData.append("images", img, `${id}_${idx}.${img.name.split(".").pop()}`);
          }
        })
      );

      const res = await fetch("/api/members/save", { method: "POST", body: formData });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "저장 실패");

      setAlert({ type: "success", message: "저장 완료!" });
    } catch (err: any) {
      console.error(err);
      setAlert({ type: "error", message: err.message || "저장 중 오류 발생" });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // 렌더
  // ----------------------
  return (
    <Layout>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Member Profile 
        </Typography>

        {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.message}</Alert>}

        <Stack spacing={3}>
          {MEMBER_IDS.map((id) => (
            <Card key={id}>
              <CardContent>
                <Typography variant="h6">{id}</Typography>

                {/* 텍스트 */}
                <Typography variant="subtitle1">Text</Typography>
                {members[id]?.text.map((t, idx) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center" mb={1}>
                    <TextField fullWidth value={t} onChange={(e) => handleTextChange(id, idx, e.target.value)} />
                    <IconButton onClick={() => handleRemoveText(id, idx)}><Delete /></IconButton>
                  </Stack>
                ))}
                <Button startIcon={<Add />} onClick={() => handleAddText(id)}>텍스트 추가</Button>

                {/* 이미지 */}
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Images (최대 4개)</Typography>
                <Button variant="contained" component="label" sx={{ mb: 1 }}>
                  업로드
                  <input type="file" hidden multiple accept="image/*" onChange={(e) => handleImageChange(id, e.target.files)} />
                </Button>
                <Stack spacing={1}>
                  {members[id]?.image.map((img, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                      {typeof img === "string" ? <img src={img} width={80} /> : <Typography>{img.name}</Typography>}
                      <IconButton onClick={() => handleRemoveImage(id, idx)}><Delete /></IconButton>
                    </Stack>
                  ))}
                </Stack>

                {/* SNS */}
                <Typography variant="subtitle1" sx={{ mt: 2 }}>SNS (최대 6개)</Typography>
                <Stack spacing={1}>
                  {SNS_KEYS.map((key) => (
                    <TextField
                      key={key}
                      label={key}
                      fullWidth
                      value={members[id]?.sns[key] || ""}
                      onChange={(e) => handleSNSChange(id, key, e.target.value)}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Box mt={3}>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "저장"}
          </Button>
        </Box>
      </Box>
    </Layout>
  );
}
