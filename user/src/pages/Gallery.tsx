'use client';

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@shared/services/axios"; 
import type { GalleryItem } from "@shared/types/gallery"; 
import Image from 'next/image';
import { Alert, Box, CircularProgress, Typography } from "@mui/material"; 

import btn_prev from "@front/assets/icons/bg-btn-prev.png";
import btn_next from "@front/assets/icons/bg-btn-next.png";
import "@front/ui/gallery.module.css"; 

// Yet Another React Lightbox
import Lightbox from "yet-another-react-lightbox";
import { Slide, RenderSlideProps } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css"; 

// Slide 타입 확장 (Lightbox 캡션 또는 alt 텍스트를 위해 title 속성 사용)
type MySlide = Slide & { title?: string };

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error && error.response && error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data.message;
    }
    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }
    return defaultMsg;
};

type AlertSeverity = "success" | "error";

export default function Gallery() {
    // ===========================
    // 상태 관리
    // ===========================
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ message: string; severity: AlertSeverity } | null>(null);

    const itemsPerPage = 20;
    const totalPages = Math.ceil(galleryItems.length / itemsPerPage);
    const [currentPage, setCurrentPage] = useState(1);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentImages = galleryItems.slice(startIndex, startIndex + itemsPerPage);

    // Lightbox 상태
    const [isOpen, setIsOpen] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);

    // ===========================
    // 이벤트 핸들러 및 데이터 로딩
    // ===========================
    const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

    const fetchGalleryItems = useCallback(async () => {
        setLoading(true);
        setAlertMessage(null);
        setCurrentPage(1); 

        try {
            const res = await api.get<{ success: boolean; data: GalleryItem[] }>("/api/gallery"); 
            setGalleryItems(res.data.data);
            if (res.data.data.length === 0) {
                setAlertMessage({ message: "현재 등록된 갤러리 이미지가 없습니다.", severity: "success" });
            }
        } catch (err: any) { 
            console.error("갤러리 로드 실패:", err);
            const errorMsg = extractErrorMessage(err, "갤러리 목록 로드에 실패했습니다. 데이터를 불러올 수 없습니다.");
            setAlertMessage({ message: errorMsg, severity: "error" });
            setGalleryItems([]); 
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGalleryItems();
    }, [fetchGalleryItems]);


    // ===========================
    // Lightbox 설정
    // ===========================
    // GalleryItem에 title 속성이 없으므로, ID를 사용한 대체 텍스트를 title로 사용합니다.
    const slides: MySlide[] = galleryItems.map((item) => ({
        src: item.url || 'https://via.placeholder.com/300x300?text=No+Image', 
        title: `갤러리 이미지 ID: ${item.id}`, 
    }));

    // Lightbox 슬라이드 렌더 함수
    const renderSlide = ({ slide }: RenderSlideProps<MySlide>) => (
        <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000"
        }}>
            <img
                src={slide.src}
                alt={slide.title ?? "갤러리 이미지"}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
        </div>
    );

    // ===========================
    // 렌더링
    // ===========================
    return (
        <div className="container">
            {/* Side */}
            <div id="side">
                <div className="side2">
                    03
                    <span className="s_line"></span>
                    GALLERY
                </div>
            </div>

            {/* Main */}
            <div className="cont gallery wow fadeInUp" data-wow-delay="0.2s">
                <div className="title">GALLERY</div>

                {/* 로딩 및 오류 메시지 */}
                {alertMessage && (
                    <Alert 
                        severity={alertMessage.severity} 
                        sx={{ mb: 2, justifyContent: 'center' }} 
                    >
                        {alertMessage.message}
                    </Alert>
                )}

                {loading && (
                    <Box display="flex" justifyContent="center" py={8} flexDirection="column" alignItems="center">
                        <CircularProgress />
                        <Typography mt={2}>갤러리 이미지를 불러오는 중...</Typography>
                    </Box>
                )}

                {!loading && galleryItems.length === 0 && !alertMessage && (
                    <Typography variant="body1" color="textSecondary" align="center" py={8}>
                        등록된 이미지가 없습니다.
                    </Typography>
                )}


                {/* 이미지 목록 (데이터가 있을 때만 표시) */}
                {!loading && currentImages.length > 0 && (
                    <>
                        <div className="galleryList">
                            <ul>
                                {currentImages.map((item, index) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPhotoIndex(startIndex + index); 
                                                setIsOpen(true);
                                            }}
                                        >
                                            {/* next/image를 사용하여 이미지 최적화 */}
                                            <Image 
                                                src={item.url || 'https://via.placeholder.com/300x300?text=No+Image'} 
                                                alt={`갤러리 이미지 ID: ${item.id}`} // alt 텍스트 사용
                                                width={300} 
                                                height={300} 
                                                style={{ objectFit: 'cover' }}
                                                sizes="(max-width: 600px) 100vw, 50vw" 
                                            />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Pagination */}
                        <div className="page-btn-box">
                            <button
                                type="button"
                                className="prev-btn"
                                onClick={goPrev}
                                disabled={currentPage <= 1}
                            >
                                <Image 
                                    alt="이전" 
                                    src={btn_prev} 
                                    width={36} 
                                    height={36} 
                                />
                                이전
                            </button>
                            <span className="page-number">
                                <strong>{currentPage}</strong> / <em>{totalPages}</em>
                            </span>
                            <button
                                type="button"
                                className="next-btn"
                                onClick={goNext}
                                disabled={currentPage >= totalPages}
                            >
                                <Image 
                                    alt="이후" 
                                    src={btn_next} 
                                    width={36} 
                                    height={36} 
                                />
                                이후
                            </button>
                        </div>
                    </>
                )}

                {/* Lightbox */}
                {isOpen && (
                    <Lightbox
                        open={isOpen}
                        close={() => setIsOpen(false)}
                        slides={slides}
                        index={photoIndex}
                        render={{ slide: renderSlide }} 
                    />
                )} 
            </div>
        </div>
    );
}