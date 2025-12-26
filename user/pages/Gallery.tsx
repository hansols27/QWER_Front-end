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
  const itemsPerPage = 20;

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
      // 💡 잦은 API 호출 부하를 줄이기 위해 캐시 활용 권장 (필요시 timestamp 제거 가능)
      const res = await api.get<{ success: boolean; data: GalleryItem[] }>(
        `/api/gallery`, 
        {
          headers: {
            "Cache-Control": "max-age=60", // 1분간은 브라우저 캐시 활용
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
              <ul style={{ display: "flex", flexWrap: "wrap", gap: "20px", listStyle: "none", padding: 0 }}>
                {currentImages.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      onClick={() => {
                        setPhotoIndex(startIndex + index);
                        setIsOpen(true);
                      }}
                    >
                      <div
                        style={{
                          width: "180px",
                          height: "270px",
                          position: "relative",
                          overflow: "hidden",
                          borderRadius: "6px",
                          backgroundColor: "#2a2a2a", // 💡 로딩 전 회색 배경으로 레이아웃 깨짐 방지
                        }}
                      >
                        <Image
                          src={item.url || "https://via.placeholder.com/300?text=No+Image"}
                          alt={item.alt ?? `Gallery ${item.id}`}
                          fill
                          sizes="180px"
                          style={{ objectFit: "cover" }}
                          // 💡 서버 CPU 부하를 막기 위해 S3 원본 직접 로드
                          unoptimized
                          // 💡 현재 페이지 상단 4개 이미지는 즉시 로드(LCP 최적화)
                          priority={index < 4}
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ===== PAGINATION ===== */}
            <div className="page-btn-box" style={{ marginTop: "40px", textAlign: "center" }}>
              <button
                type="button"
                className="prev-btn"
                onClick={goPrev}
                disabled={currentPage <= 1}
              >
                이전
              </button>
              <span className="page-number" style={{ margin: "0 20px" }}>
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
                          width: "90%", // 모바일 대응을 위해 비율 조정
                          maxWidth: "600px",
                          height: "80vh",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={slide.src}
                          alt={slide.title ?? ""}
                          fill
                          unoptimized // 💡 라이트박스에서도 고화질 원본 바로 표시
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