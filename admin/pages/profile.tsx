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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import type { MemberState, MemberPayload } from "@shared/types/member";

const MEMBER_IDS = ["All", "Chodan", "Majenta", "Hina", "Siyeon"];
const SNS_KEYS = ["youtube", "instagram", "twitter", "tiktok", "weverse", "cafe"];
const MAX_IMAGES = 4;
const MIN_IMAGES = 1;
const MAX_SNS = 6;
const MIN_SNS = 1;

type SNSField = { key: string; url: string };

export default function ProfilePage() {
  const [members, setMembers] = useState<Record<string, MemberState & { snsList: SNSField[] }>>(
    Object.fromEntries(
      MEMBER_IDS.map((id) => [
        id,
        { text: [""], image: [], sns: {}, snsList: [{ key: "youtube", url: "" }] },
      ])
    ) as Record<string, MemberState & { snsList: SNSField[] }>
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

        const formatted: Record<string, MemberState & { snsList: SNSField[] }> = {} as any;
        MEMBER_IDS.forEach((id) => {
          const member = data.find((m: any) => m.id === id);
          formatted[id] = {
            text: member
              ? member.contents.filter((c: any) => c.type === "text").map((c: any) => c.content)
              : [""],
            image: member
              ? member.contents.filter((c: any) => c.type === "image").map((c: any) => c.content)
              : [],
            sns: member?.sns || {},
            snsList: member?.sns
              ? Object.entries(member.sns).map(([key, url]) => ({
                  key,
                  url: typeof url === "string" ? url : "", // ✅ url을 string으로 보장
                }))
              : [{ key: "youtube", url: "" }],
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

  // 이미지
  const handleImageChange = (id: string, files: FileList | null) => {
    if (!files) return;
    setMembers((prev) => {
      const current = prev[id].image;
      const newImages = [...current, ...Array.from(files)];
      if (newImages.length > MAX_IMAGES) {
        setAlert({ type: "error", message: `이미지는 최대 ${MAX_IMAGES}개까지 업로드 가능합니다.` });
        return prev;
      }
      return { ...prev, [id]: { ...prev[id], image: newImages } };
    });
  };
  const handleRemoveImage = (id: string, index: number) =>
    setMembers((prev) => ({
      ...prev,
      [id]: { ...prev[id], image: prev[id].image.filter((_, i) => i !== index) },
    }));

  // SNS
  const handleSNSKeyChange = (id: string, idx: number, newKey: string) => {
    setMembers((prev) => {
      const snsList = [...prev[id].snsList];
      snsList[idx].key = newKey;
      return { ...prev, [id]: { ...prev[id], snsList } };
    });
  };
  const handleSNSUrlChange = (id: string, idx: number, url: string) => {
    setMembers((prev) => {
      const snsList = [...prev[id].snsList];
      snsList[idx].url = url;
      return { ...prev, [id]: { ...prev[id], snsList } };
    });
  };
  const handleAddSNS = (id: string) => {
    setMembers((prev) => {
      if (prev[id].snsList.length >= MAX_SNS) {
        setAlert({ type: "error", message: `SNS는 최대 ${MAX_SNS}개까지 등록 가능합니다.` });
        return prev;
      }
      return {
        ...prev,
        [id]: { ...prev[id], snsList: [...prev[id].snsList, { key: "youtube", url: "" }] },
      };
    });
  };
  const handleRemoveSNS = (id: string, idx: number) =>
    setMembers((prev) => ({
      ...prev,
      [id]: { ...prev[id], snsList: prev[id].snsList.filter((_, i) => i !== idx) },
    }));

  // ----------------------
  // 저장
  // ----------------------
  const handleSave = async () => {
    try {
      setLoading(true);

      const payload: MemberPayload[] = MEMBER_IDS.map((id) => {
        const snsObj = Object.fromEntries(
          members[id].snsList
            .filter((s) => s.url.trim() !== "")
            .map((s) => [s.key, s.url])
            .slice(0, MAX_SNS)
        );
        return {
          id,
          name: id,
          contents: [
            ...members[id].text.filter((t) => t.trim() !== "").map((t) => ({ type: "text" as const, content: t })),
            ...members[id].image
              .filter((img): img is string => typeof img === "string")
              .map((url) => ({ type: "image" as const, content: url })),
          ],
          sns: snsObj,
        };
      });

      const formData = new FormData();
      formData.append("members", JSON.stringify(payload));

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

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }}>
            {alert.message}
          </Alert>
        )}

        <Stack spacing={3}>
          {MEMBER_IDS.map((id) => (
            <Card key={id}>
              <CardContent>
                <Typography variant="h6">{id}</Typography>

                {/* 텍스트 */}
                <Typography variant="subtitle1"></Typography>
                {members[id]?.text.map((t, idx) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center" mb={1}>
                    <TextField fullWidth value={t} onChange={(e) => handleTextChange(id, idx, e.target.value)} />
                    <IconButton onClick={() => handleRemoveText(id, idx)}>
                      <Delete />
                    </IconButton>
                  </Stack>
                ))}
                <Button startIcon={<Add />} onClick={() => handleAddText(id)}>
                  추가
                </Button>

                {/* 이미지 */}
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  Images (1~{MAX_IMAGES}개)
                </Typography>
                <Button variant="contained" component="label" sx={{ mb: 1 }}>
                  업로드
                  <input type="file" hidden multiple accept="image/*" onChange={(e) => handleImageChange(id, e.target.files)} />
                </Button>
                <Stack spacing={1}>
                  {members[id]?.image.map((img, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                      {typeof img === "string" ? <img src={img} width={80} /> : <Typography>{img.name}</Typography>}
                      <IconButton onClick={() => handleRemoveImage(id, idx)}>
                        <Delete />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>

                {/* SNS */}
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  SNS (1~{MAX_SNS}개)
                </Typography>
                <Stack spacing={1}>
                  {members[id]?.snsList.map((sns, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>SNS</InputLabel>
                        <Select
                          value={sns.key}
                          label="SNS"
                          onChange={(e) => handleSNSKeyChange(id, idx, e.target.value)}
                        >
                          {SNS_KEYS.map((k) => (
                            <MenuItem key={k} value={k}>
                              {k}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        placeholder="URL 입력"
                        value={sns.url}
                        onChange={(e) => handleSNSUrlChange(id, idx, e.target.value)}
                      />
                      <IconButton onClick={() => handleRemoveSNS(id, idx)}>
                        <Delete />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
                <Button startIcon={<Add />} onClick={() => handleAddSNS(id)} sx={{ mt: 1 }}>
                  추가
                </Button>
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
