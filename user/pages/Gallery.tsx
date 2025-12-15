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

  /* API */
  const fetchGalleryItems = useCallback(async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const res = await api.get<{ success: boolean; data: GalleryItem[] }>(
        `/api/gallery?t=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
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
      {/* ===== SIDE (Album 페이지와 동일) ===== */}
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
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            갤러리 로딩 중...
          </div>
        ) : galleryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            등록된 이미지가 없습니다.
          </div>
        ) : (
          <>
            {/* ===== GALLERY LIST ===== */}
            <div className={styles.galleryList}>
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
                          width: "180px",
                          height: "270px",
                          position: "relative",
                          overflow: "hidden",
                          borderRadius: "6px",
                        }}
                      >
                        <Image
                          src={
                            item.url ||
                            "https://via.placeholder.com/300?text=No+Image"
                          }
                          alt={item.alt ?? `Gallery ${item.id}`}
                          fill
                          sizes="180px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* ===== PAGINATION (Album과 동일) ===== */}
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
                        backgroundColor: "#000",
                      }}
                    >
                      <div
                        style={{
                          width: "360px",
                          height: "540px",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={slide.src}
                          alt={slide.title ?? ""}
                          fill
                          unoptimized
                          sizes="360px"
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
