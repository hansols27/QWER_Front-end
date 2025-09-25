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
import type { Member, MemberSNS } from "@shared/types/member";

const MEMBER_IDS = ["All", "Chodan", "Majenta", "Hina", "Siyeon"];
const SNS_KEYS = ["youtube", "instagram", "twitter", "tiktok", "weverse", "cafe"];

type MemberState = {
  text: string[];
  image: string[];
  sns: MemberSNS;
};

export default function AdminProfilePage() {
  const [members, setMembers] = useState<Record<string, MemberState>>(
    Object.fromEntries(MEMBER_IDS.map((id) => [id, { text: [""], image: [""], sns: {} }]))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedSNS, setSelectedSNS] = useState<string>(SNS_KEYS[0]);
  const [linkValue, setLinkValue] = useState<string>("");

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/members");
        const data: Member[] = await res.json();
        setMembers((prev) => {
          const newState = { ...prev };
          MEMBER_IDS.forEach((id) => {
            const member = data.find((m) => m.id.toLowerCase() === id.toLowerCase());
            if (!member) return;
            newState[id] = {
              text:
                member.contents
                  .filter((c) => c.type === "text")
                  .map((c) => (typeof c.content === "string" ? c.content : "")) || [""],
              image:
                member.contents
                  .filter((c) => c.type === "image")
                  .flatMap((c) => (Array.isArray(c.content) ? c.content : [c.content as string])) || [""],
              sns: member.sns || {},
            };
          });
          return newState;
        });
      } catch (e) {
        console.error(e);
        setError("데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 텍스트/이미지 변경
  const handleChange = (memberId: string, field: "text" | "image", index: number, value: string) => {
    setMembers((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: prev[memberId][field].map((v, i) => (i === index ? value : v)) },
    }));
  };

  const addField = (memberId: string, field: "text" | "image") => {
    setMembers((prev) => {
      const limits = { text: 99, image: 4 };
      if (prev[memberId][field].length >= limits[field]) return prev;
      return { ...prev, [memberId]: { ...prev[memberId], [field]: [...prev[memberId][field], ""] } };
    });
  };

  const removeField = (memberId: string, field: "text" | "image", index: number) => {
    setMembers((prev) => {
      const min = 1;
      if (prev[memberId][field].length <= min) return prev;
      return { ...prev, [memberId]: { ...prev[memberId], [field]: prev[memberId][field].filter((_, i) => i !== index) } };
    });
  };

  // 이미지 업로드
  const uploadImage = async (file: File, memberId: string, index: number) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("memberId", memberId);
    formData.append("index", String(index));
    const res = await fetch("/api/members/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url;
  };

  // SNS 추가/삭제
  const addSNS = (memberId: string) => {
    if (!selectedSNS || !linkValue) return;
    if (Object.keys(members[memberId].sns).length >= 6) {
      alert("SNS는 최대 6개까지 등록 가능합니다.");
      return;
    }
    setMembers((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], sns: { ...prev[memberId].sns, [selectedSNS]: linkValue } },
    }));
    setLinkValue("");
  };

  const removeSNS = (memberId: string, key: string) => {
    setMembers((prev) => {
      const newSNS = { ...prev[memberId].sns };
      delete newSNS[key];
      return { ...prev, [memberId]: { ...prev[memberId], sns: newSNS } };
    });
  };

  // 저장
  const handleSave = async () => {
    for (const id of MEMBER_IDS) {
      const { text, image, sns } = members[id];
      if (text.filter((t) => t.trim() !== "").length < 1) {
        setError(`${id} - 텍스트는 최소 1개 이상 입력해야 합니다.`);
        return;
      }
      if (image.filter((i) => i.trim() !== "").length < 1) {
        setError(`${id} - 이미지는 최소 1개 이상 등록해야 합니다.`);
        return;
      }
      if (Object.values(sns).filter((v): v is string => typeof v === "string" && v.trim() !== "").length < 1) {
        setError(`${id} - SNS는 최소 1개 이상 등록해야 합니다.`);
        return;
      }
    }
    setError("");

    const payload: Member[] = MEMBER_IDS.map((id) => {
      const memberSNS = Object.fromEntries(
        Object.entries(members[id].sns)
          .filter((entry): entry is [string, string] => {
            const v = entry[1];
            return typeof v === "string" && v.trim() !== "";
          })
      );

    return {
      id: id.toLowerCase(),
      name: id,
      contents: [
        ...members[id].text.filter((t) => t.trim() !== "").map((t) => ({ type: "text" as const, content: t })),
        ...members[id].image.filter((i) => i.trim() !== "").map((i) => ({ type: "image" as const, content: i })),
      ],
      sns: memberSNS,
    };
  });

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("저장 실패");
      alert("저장되었습니다 ✅");
    } catch (e) {
      console.error(e);
      setError("저장 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ p: 3, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Profile 관리</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={4}>
          {MEMBER_IDS.map((id) => (
            <Card key={id}>
              <CardContent>
                <Typography variant="h6">{id}</Typography>

                {/* Text Fields */}
                {members[id].text.map((t, idx) => (
                  <Stack key={idx} direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <TextField
                      label={`Text ${idx + 1}`}
                      value={t}
                      fullWidth
                      onChange={(e) => handleChange(id, "text", idx, e.target.value)}
                    />
                    <IconButton onClick={() => removeField(id, "text", idx)} disabled={members[id].text.length === 1} color="error">
                      <Delete />
                    </IconButton>
                  </Stack>
                ))}
                <Button onClick={() => addField(id, "text")} startIcon={<Add />} disabled={members[id].text.length >= 99}>텍스트 추가</Button>

                {/* Image Fields */}
                {members[id].image.map((img, idx) => (
                  <Stack key={idx} direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                    <TextField label={`Image ${idx + 1}`} value={img} fullWidth disabled />
                    <Button variant="contained" component="label">
                      업로드
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={async (e) => {
                          if (!e.target.files) return;
                          const file = e.target.files[0];
                          const url = await uploadImage(file, id, idx);
                          handleChange(id, "image", idx, url);
                        }}
                      />
                    </Button>
                    <IconButton onClick={() => removeField(id, "image", idx)} disabled={members[id].image.length === 1} color="error">
                      <Delete />
                    </IconButton>
                  </Stack>
                ))}
                <Button onClick={() => addField(id, "image")} startIcon={<Add />} disabled={members[id].image.length >= 4}>이미지 추가</Button>

                {/* SNS Fields */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, mb: 1 }}>
                  <select value={selectedSNS} onChange={(e) => setSelectedSNS(e.target.value)}>
                    {SNS_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <TextField
                    placeholder="SNS 링크 입력"
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                  />
                  <Button onClick={() => addSNS(id)} startIcon={<Add />} disabled={Object.keys(members[id].sns).length >= 6}>추가</Button>
                </Stack>
                {Object.entries(members[id].sns).map(([key, val]) => (
                  <Stack key={key} direction="row" spacing={2} alignItems="center">
                    <Typography>{key}: {val}</Typography>
                    <IconButton onClick={() => removeSNS(id, key)} color="error"><Delete /></IconButton>
                  </Stack>
                ))}

              </CardContent>
            </Card>
          ))}
        </Stack>

        <Box mt={3}>
          <Button variant="contained" onClick={handleSave}>저장하기</Button>
        </Box>
      </Box>
    </Layout>
  );
}
