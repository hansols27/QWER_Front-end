'use client';

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { api } from "@shared/services/axios";
import styles from "@front/styles/gallery.module.css";

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

  const totalPages = Math.ceil(galleryItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentImages = galleryItems.slice(startIndex, startIndex + itemsPerPage);

  // ===========================
  // API 호출
  // ===========================
  const fetchGalleryItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: GalleryItem[] }>("/api/gallery");
      setGalleryItems(res.data.data);
    } catch (err) {
      console.error("갤러리 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGalleryItems();
  }, [fetchGalleryItems]);

  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const slides: MySlide[] = galleryItems.map((item) => ({
    src: item.url,
    title: item.alt,
  }));

  return (
    <div className={styles.container}>
      {/* Side */}
      <div id="side" className={styles.side}>
        <div className={styles.side2}>
          03
          <span className={styles.s_line}></span>
          GALLERY
        </div>
      </div> {/* <--- Line 75 근처의 불필요한 닫는 태그를 제거했습니다. */}

      {/* Main: .cont.gallery 클래스 적용 */}
      <div className={`${styles.cont} ${styles.gallery}`}>
        <div className={styles.title}>GALLERY</div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>갤러리 로딩 중...</div>
        ) : galleryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>등록된 이미지가 없습니다.</div>
        ) : (
          <>
            {/* 이미지 목록: .galleryList 클래스 적용 */}
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
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
                        <Image
                          src={item.url}
                          alt={item.alt ?? `Gallery item ${item.id}`}
                          fill
                          sizes="(max-width: 1400px) 10vw"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            <div className={styles['page-btn-box']}>
              <button
                type="button"
                className={styles['prev-btn']}
                onClick={goPrev}
                disabled={currentPage <= 1}
              >
                이전
              </button>
              <span className={styles['page-number']}>
                <strong>{currentPage}</strong> / <em>{totalPages}</em>
              </span>
              <button
                type="button"
                className={styles['next-btn']}
                onClick={goNext}
                disabled={currentPage >= totalPages}
              >
                이후
              </button>
            </div>

            {/* Lightbox */}
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
                      <img
                        src={slide.src}
                        alt={slide.title ?? ""}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
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