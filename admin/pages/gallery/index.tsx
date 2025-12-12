import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; 
import { api } from "@shared/services/axios";
import Layout from "@components/common/layout";
import type { GalleryItem } from "@shared/types/gallery";
import {
    Box,
    Button,
    Card,
    Typography,
    Grid,
    Alert,
    CircularProgress,
    Checkbox
} from "@mui/material";

type AlertSeverity = "success" | "error";

// 오류 메시지 유틸
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

export default function GalleryList() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    // 체크된 이미지 ID 목록
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const router = useRouter();

    // -----------------------------------
    // 갤러리 로드
    // -----------------------------------
    const fetchGalleryItems = useCallback(async () => {
        setLoading(true);
        setAlertMessage(null);

        try {
            const res = await api.get<{ success: boolean; data: GalleryItem[] }>("/api/gallery");
            setItems(res.data.data);
        } catch (err: any) {
            const errorMsg = extractErrorMessage(err, "갤러리 목록 로드 실패");
            setAlertMessage({ message: errorMsg, severity: "error" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGalleryItems();
    }, [fetchGalleryItems]);

    // -----------------------------------
    // 체크박스 선택 핸들러
    // -----------------------------------
    const handleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleCreateClick = () => {
        router.push("/gallery/create");
    };

    // -----------------------------------
    // 선택된 이미지 삭제 (수정된 부분)
    // -----------------------------------
    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        const confirmDelete = window.confirm(
            `${selectedIds.length}개의 이미지를 삭제하시겠습니까?`
        );
        if (!confirmDelete) return;

        try {
            setLoading(true);

            const idsToDelete = [...selectedIds]; // 삭제 요청할 ID 목록 복사

            // 1. 백엔드 API 호출 (실제 삭제)
            await api.delete("/api/gallery", {
                data: { ids: idsToDelete },
            } as any);

            // 2. 🚀 핵심 해결책: 상태(items)에서 삭제된 ID 필터링
            setItems((prevItems) => 
                prevItems.filter((item) => !idsToDelete.includes(item.id))
            );

            setAlertMessage({
                message: "선택한 이미지가 삭제되었습니다.",
                severity: "success",
            });

            setSelectedIds([]); // 선택된 ID 목록 초기화

            // 💡 주의: 상태 필터링 방식에서는 fetchGalleryItems()를 호출할 필요가 없습니다.
            // fetchGalleryItems(); // <-- 이 라인을 주석 처리하거나 제거합니다.

        } catch (err: any) {
            setAlertMessage({
                message: extractErrorMessage(err, "이미지 삭제 실패"),
                severity: "error",
            });
            // 🚨 삭제 실패 시, 선택 목록을 초기화하지 않아야 사용자가 재시도할 수 있습니다.
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box p={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4" fontWeight="bold">갤러리 관리</Typography>

                    <Button
                        variant="contained"
                        onClick={handleCreateClick}
                        disabled={loading}
                    >
                        등록
                    </Button>
                </Box>

                {alertMessage && (
                    <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
                        {alertMessage.message}
                    </Alert>
                )}

                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                        <Typography ml={2}>로딩 중...</Typography>
                    </Box>
                )}

                {!loading && items.length === 0 && !alertMessage && (
                    <Typography align="center" py={4}>
                        등록된 이미지가 없습니다.
                    </Typography>
                )}

                {/* 이미지 목록 */}
                <Grid container spacing={4} {...({} as any)}>
                    {items.map((item) => {
                        const isChecked = selectedIds.includes(item.id);

                        return (
                            <Grid item xs={6} sm={4} md={1} key={item.id} {...({} as any)}>
                                <Card
                                    sx={{
                                        cursor: "default", 
                                        transition: "none", 
                                        "&:hover": {}, 
                                        position: "relative",
                                    }}
                                >
                                    {/* 체크박스 */}
                                    <Checkbox
                                        checked={isChecked}
                                        onChange={() => handleSelect(item.id)}
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            left: 8,
                                            zIndex: 5,
                                            backgroundColor: "transparent",
                                            borderRadius: "4px",
                                        }}
                                    />

                                    {/* 이미지: 표준 <img> 태그 사용 (클릭 이벤트 제거) */}
                                    <Box
                                        sx={{
                                            width: "180px",
                                            height: "270px",
                                            position: "relative",
                                            overflow: "hidden",
                                            borderRadius: "6px"
                                        }}
                                        >
                                        <img
                                            src={item.url || "https://via.placeholder.com/300?text=No+Image"}
                                            alt={`Gallery ${item.id}`}
                                            style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",   // 비율 유지 + 박스를 꽉 채움
                                            display: "block"
                                            }}
                                            loading="lazy"
                                        />
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* 삭제 버튼 (선택한 이미지가 있을 때만 활성화) */}
                <Box mt={4} textAlign="right">
                    <Button
                        variant="contained"
                        color="error"
                        disabled={selectedIds.length === 0 || loading}
                        onClick={handleDeleteSelected}
                    >
                        선택 삭제
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
}