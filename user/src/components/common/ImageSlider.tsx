import { useEffect, useState } from 'react';
import Image from 'next/image'; // Next.js Image 컴포넌트 임포트

interface ImageSliderProps {
    images: string[];
    style?: React.CSSProperties;
    interval?: number; // ms
}

export default function ImageSlider({ images, style, interval = 3000 }: ImageSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // 이미지가 없을 경우 interval 설정 방지
        if (images.length === 0) return; 

        const id = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % images.length);
        }, interval);
        return () => clearInterval(id);
    }, [images.length, interval]);

    // 이미지가 없을 경우 렌더링하지 않음
    if (images.length === 0) return null;

    return (
        <div className="artist_img" style={style}>
            {/* 💡 수정: <img> 대신 <Image> 컴포넌트 사용 */}
            <Image
                src={images[currentIndex]}
                alt={`slide-${currentIndex}`}
                // Next/Image는 width/height 필수
                width={460}
                height={580}
                // API에서 불러온 외부 이미지 URL을 사용할 경우 unoptimized를 추가하여 빌드 오류 방지
                unoptimized 
                // Next.js Image 컴포넌트는 CSS class나 style 객체를 사용하여 렌더링 스타일 지정
                style={{ 
                    transition: 'opacity 0.5s ease',
                    width: '100%', 
                    height: 'auto', 
                    objectFit: 'cover' // 이미지 크기 조정에 유용
                }}
            />
        </div>
    );
}