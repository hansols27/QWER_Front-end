'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
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

  // totalPages 계산: 데이터가 없을 때도 최소 1페이지는 유지하도록 Math.max(1, ...) 사용
  const totalPages = useMemo(() => Math.max(1, Math.ceil(galleryItems.length / itemsPerPage)), [galleryItems.length, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentImages = galleryItems.slice(startIndex, startIndex + itemsPerPage);

  // API 호출 함수 (useCallback 유지)
  const fetchGalleryItems = useCallback(async () => {
    setLoading(true);
    try {
        // 캐시 무력화를 위해 쿼리 파라미터에 현재 타임스탬프를 추가 (최신 데이터 강제 요청)
        const timestamp = new Date().getTime(); 
        const endpoint = `/api/gallery?t=${timestamp}`; 

        const res = await api.get<{ success: boolean; data: GalleryItem[] }>(endpoint, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      setGalleryItems(res.data.data);
      
      // 데이터가 줄어들었을 경우, 현재 페이지가 유효하도록 조정
      setCurrentPage(prevPage => {
        const newTotalPages = Math.max(1, Math.ceil(res.data.data.length / itemsPerPage));
        return Math.min(prevPage, newTotalPages);
      });
      
    } catch (err) {
      console.error("갤러리 로드 실패:", err);
      setGalleryItems([]); 
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]); 

  useEffect(() => {
    // 페이지 접근 시마다 데이터를 다시 불러와 최신 상태 유지
    fetchGalleryItems();
        
  }, [fetchGalleryItems]);

  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 1)), []);
  const goNext = useCallback(() => setCurrentPage((p) => Math.min(p + 1, totalPages)), [totalPages]);


  const slides: MySlide[] = useMemo(() => galleryItems.map((item) => ({
    src: item.url,
    title: item.alt,
  })), [galleryItems]);


  return (
    <div className="container">
      <div id="side">
        <div className="side2">
          03
          <span className="s_line"></span>
          GALLERY
        </div>
        </div>

      <div className={`${styles.galleryCont} ${styles.gallery} wow fadeInUp`} data-wow-delay="0.2s"> 
        <div className="title">GALLERY</div>

        {loading && galleryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>갤러리 로딩 중...</div>
        ) : galleryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>등록된 이미지가 없습니다.</div>
        ) : (
          <>
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
                        <div style={{
                            width: "180px",
                            height: "270px",
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: "6px"
                        }}>
                          <img
                            src={item.url || "https://via.placeholder.com/300?text=No+Image"}
                            alt={item.alt ?? `Gallery ${item.id}`}
                            // 🚀 width와 height 속성을 명시하여 공간을 미리 확보합니다.
                            width={180} 
                            height={270} 
                            loading="lazy" 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover", 
                              // 🚀 핵심 수정: 인라인 요소 특성 제거 및 여백 문제 해결
                              display: "block"
                            }}
                          />
                        </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Pagination (기존 코드 유지) */}
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

            {/* Lightbox 수정: max-width와 max-height를 360px x 540px로 설정 */}
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
                        style={{ 
                            maxWidth: "360px", 
                            maxHeight: "540px", 
                            objectFit: "contain" 
                        }}
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