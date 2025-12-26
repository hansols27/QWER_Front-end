"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { api } from "@shared/services/axios";
import styles from "@front/styles/gallery.module.css";
import "yet-another-react-lightbox/styles.css";

// Yet Another React Lightbox
import Lightbox from "yet-another-react-lightbox";
import { Slide, RenderSlideProps } from "yet-another-react-lightbox";

// Slide 타입 확장
type MySlide = Slide & { title?: string };

// API에서 받아올 갤러리 아이템 타입
type GalleryItem = {
  id: string;
  url: string;
  alt?: string;
};

export default function GalleryPage() {
  // 한 줄에 7개씩 보여주기 위해 7의 배수인 21로 유지
  const itemsPerPage = 21;

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  /* pagination 계산 */
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(galleryItems.length / itemsPerPage)),
    [galleryItems.length, itemsPerPage]
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentImages = galleryItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  /* API 호출 */
  const fetchGalleryItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: GalleryItem[] }>(
        `/api/gallery`, 
        {
          headers: {
            "Cache-Control": "max-age=60",
          },
        }
      );

      setGalleryItems(res.data.data);

      setCurrentPage((prev) => {
        const newTotal = Math.max(
          1,
          Math.ceil(res.data.data.length / itemsPerPage)
        );
        return Math.min(prev, newTotal);
      });
    } catch (err) {
      console.error("갤러리 로드 실패:", err);
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchGalleryItems();
  }, [fetchGalleryItems]);

  const goPrev = useCallback(
    () => setCurrentPage((p) => Math.max(p - 1, 1)),
    []
  );
  const goNext = useCallback(
    () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    [totalPages]
  );

  /* Lightbox slides */
  const slides: MySlide[] = useMemo(
    () =>
      galleryItems.map((item) => ({
        src: item.url,
        title: item.alt,
      })),
    [galleryItems]
  );

  return (
    <div className="container">
      {/* ===== SIDE ===== */}
      <div id="side">
        <div className="side2">
          03
          <span className="s_line"></span>
          GALLERY
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div
        className={`${styles.galleryCont} ${styles.gallery} wow fadeInUp`}
        data-wow-delay="0.2s"
      >
        <div className="title">GALLERY</div>

        {loading && galleryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "#888" }}>
            갤러리를 불러오는 중입니다...
          </div>
        ) : galleryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "#888" }}>
            등록된 이미지가 없습니다.
          </div>
        ) : (
          <>
            {/* ===== GALLERY LIST ===== */}
            <div className={styles.galleryList}>
              {/* 인라인 스타일 flex 삭제 -> 외부 CSS Grid 사용 */}
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
                      <div
                        style={{
                          width: "100%", // CSS에서 정의한 li(180px)를 꽉 채움
                          height: "100%", // CSS에서 정의한 li(270px)를 꽉 채움
                          position: "relative",
                          overflow: "hidden",
                          borderRadius: "6px",
                          backgroundColor: "#2a2a2a",
                        }}
                      >
                        <Image
                          src={item.url || "https://via.placeholder.com/180x270?text=No+Image"}
                          alt={item.alt ?? `Gallery ${item.id}`}
                          fill
                          sizes="180px"
                          style={{ objectFit: "cover" }}
                          unoptimized
                          priority={index < 7} // 첫 줄 7개 우선 로드
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ===== PAGINATION ===== */}
            <div className="page-btn-box">
              <button
                type="button"
                className="prev-btn"
                onClick={goPrev}
                disabled={currentPage <= 1}
              >
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
                이후
              </button>
            </div>

            {/* ===== LIGHTBOX ===== */}
            {isOpen && (
              <Lightbox
                open={isOpen}
                close={() => setIsOpen(false)}
                slides={slides}
                index={photoIndex}
                render={{
                  slide: ({ slide }: RenderSlideProps<MySlide>) => (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0,0,0,0.9)",
                      }}
                    >
                      <div
                        style={{
                          width: "90%",
                          maxWidth: "600px",
                          height: "80vh",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={slide.src}
                          alt={slide.title ?? ""}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 80vw"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                  ),
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}