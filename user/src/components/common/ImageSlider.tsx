"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ImageSliderProps {
  images: string[];
  style?: React.CSSProperties;
  interval?: number; // ms
  width?: number; // default: 460
  height?: number; // default: 580
}

export default function ImageSlider({
  images,
  style,
  interval = 3000,
  width = 460,
  height = 580,
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className="artist_img" style={{ ...style, position: 'relative', width, height }}>
      <Image
        src={images[currentIndex]}
        alt={`slide-${currentIndex}`}
        width={width}
        height={height}
        style={{ transition: 'opacity 0.5s ease' }}
        priority={false} // true로 하면 첫 번째 이미지만 우선 로드
      />
    </div>
  );
}
