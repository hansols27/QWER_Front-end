import { useEffect, useState } from 'react';

interface ImageSliderProps {
  images: string[];
  style?: React.CSSProperties;
  interval?: number; // ms
}

export default function ImageSlider({ images, style, interval = 3000 }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className="artist_img" style={style}>
      <img
        src={images[currentIndex]}
        alt={`slide-${currentIndex}`}
        width={460}
        height={580}
        style={{ transition: 'opacity 0.5s ease' }}
      />
    </div>
  );
}
