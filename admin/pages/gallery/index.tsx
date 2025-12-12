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

    // -----------------------------------
    // 상세 페이지 이동
    // (이미지 클릭 시 이동, 체크박스 클릭은 이동 X)
    // -----------------------------------
    const handleItemClick = (galleryId: string) => {
        router.push(`/gallery/${galleryId}`);
    };

    const handleCreateClick = () => {
        router.push("/gallery/create");
    };

    // -----------------------------------
    // 선택된 이미지 삭제
    // -----------------------------------
    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        const confirmDelete = window.confirm(
            `${selectedIds.length}개의 이미지를 삭제하시겠습니까?`
        );
        if (!confirmDelete) return;

        try {
            setLoading(true);

            await api.post("/api/gallery/delete-multiple", {
                ids: selectedIds,
            });

            setAlertMessage({
                message: "선택한 이미지가 삭제되었습니다.",
                severity: "success",
            });

            // 목록 새로고침
            setSelectedIds([]);
            fetchGalleryItems();

        } catch (err: any) {
            setAlertMessage({
                message: extractErrorMessage(err, "이미지 삭제 실패"),
                severity: "error",
            });
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
                            <Grid item xs={6} sm={4} md={3} key={item.id} {...({} as any)}>
                                <Card
                                    sx={{
                                        cursor: "pointer",
                                        transition: "0.2s",
                                        "&:hover": { transform: "scale(1.02)", boxShadow: 6 },
                                        position: "relative",
                                    }}
                                >
                                    {/* 체크박스 (카드 클릭과 분리) */}
                                    <Checkbox
                                        checked={isChecked}
                                        onChange={() => handleSelect(item.id)}
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            left: 8,
                                            zIndex: 5,
                                            background: "rgba(255,255,255,0.7)",
                                            borderRadius: "4px",
                                        }}
                                    />

                                    {/* 이미지: next/image 대신 표준 <img> 태그 사용 */}
                                    <Box
                                        onClick={() => handleItemClick(item.id)}
                                        sx={{ width: "100%", aspectRatio: "1/1", position: "relative" }}
                                    >
                                        <img
                                            src={item.url || "https://via.placeholder.com/300?text=No+Image"}
                                            alt={`Gallery ${item.id}`}
                                            style={{ 
                                                width: "100%", 
                                                height: "100%", 
                                                objectFit: "cover",
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