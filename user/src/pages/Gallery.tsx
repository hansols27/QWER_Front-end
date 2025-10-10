import React, { useState } from "react";
import "@front/ui/gallery.css";
import { gallery } from "@front/data/gallerylist";

import btn_prev from "@front/assets/icons/bg-btn-prev.png";
import btn_next from "@front/assets/icons/bg-btn-next.png";

// Yet Another React Lightbox
import Lightbox from "yet-another-react-lightbox";
import { Slide, RenderSlideProps } from "yet-another-react-lightbox";


// Slide 타입 확장 (title 사용 가능)
type MySlide = Slide & { title?: string };

export default function Gallery() {
  const itemsPerPage = 20;
  const totalPages = Math.ceil(gallery.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentImages = gallery.slice(startIndex, startIndex + itemsPerPage);

  // Lightbox 상태
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  // slides 배열 생성 (MySlide 타입)
  const slides: MySlide[] = gallery.map((item) => ({
    src: item.src,
    title: item.alt,
  }));

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

        {/* 이미지 목록 */}
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
                  <img src={item.src} alt={item.alt} />
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
            <img alt="이전" src={btn_prev} />
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
            <img alt="이후" src={btn_next} />
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
                  alt={slide.title ?? ""}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
             </div>
            ),
        }}
      />
    )}  
      </div>
    </div>
  );
}
