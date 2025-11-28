import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link'; // Next.js의 Link 컴포넌트 사용
import { api } from '@shared/services/axios';
import styles from '@front/ui/album.module.css'; // CSS Modules import로 변경
import Image from 'next/image'; 
import { CircularProgress, Alert, Box, Typography } from '@mui/material';

// 로컬 이미지 리소스 import 유지
import more_view from '@front/assets/icons/more_view.png';
import btn_prev from '@front/assets/icons/bg-btn-prev.png';
import btn_next from '@front/assets/icons/bg-btn-next.png';

// 타입 정의 import 유지
import { AlbumItem } from '@shared/types/album'; 

// API 응답 타입
interface AlbumListResponse {
    success: boolean;
    data: AlbumItem[]; 
}

// ===========================
// 유틸리티 함수
// ===========================

const extractErrorMessage = (error: any, defaultMsg: string): string => {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return defaultMsg;
};

// ===========================
// 컴포넌트 시작
// ===========================

export default function Album() {
    const [allAlbums, setAllAlbums] = useState<AlbumItem[]>([]); 
    
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4; // 페이지당 4개 유지
    
    // 앨범 목록 불러오기 
    const fetchAlbums = useCallback(async () => {
        setLoading(true);
        setAlertMessage(null);
        setCurrentPage(1); 

        try {
            const res = await api.get<AlbumListResponse>('/api/album');
            
            // 💡 [TS2362 오류 수정] b.id와 a.id를 명시적으로 숫자로 변환하여 산술 연산을 수행합니다.
            const sortedAlbums = res.data.data.sort((a, b) => 
                parseInt(b.id as unknown as string) - parseInt(a.id as unknown as string)
            );
            
            setAllAlbums(sortedAlbums);
            
            if (res.data.data.length === 0) {
                setAlertMessage('등록된 앨범이 없습니다.');
            }
        } catch (err: any) {
            console.error('앨범 로드 실패:', err);
            const errorMsg = extractErrorMessage(err, '앨범 목록 로드에 실패했습니다.');
            setAlertMessage(errorMsg);
            setAllAlbums([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums]);

    // 클라이언트 측 페이지네이션 계산
    const totalPages = Math.max(1, Math.ceil(allAlbums.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentAlbums = allAlbums.slice(startIndex, startIndex + itemsPerPage);

    const goPrev = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const goNext = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };
    
    // 앨범 커버 이미지 URL 처리 
    const getCoverImageUrl = (album: AlbumItem) => {
        const NO_IMAGE_URL = 'https://via.placeholder.com/400x400?text=No+Image';
        return album.image || album.coverImageUrl || NO_IMAGE_URL; 
    };


    return (
        <div className="container">
            {/* Side */}
            <div id="side">
                <div className="side2">
                    02
                    <span className="s_line"></span>
                    DISCOGRAPHY
                </div>
            </div>

            {/* Main */}
            <div className="cont discography_view wow fadeInUp" data-wow-delay="0.2s">
                <div className="title">DISCOGRAPHY</div>

                {/* 로딩 상태 */}
                {loading && (
                    <Box display="flex" justifyContent="center" py={8} flexDirection="column" alignItems="center">
                        <CircularProgress />
                        <Typography mt={2}>앨범 목록을 불러오는 중...</Typography>
                    </Box>
                )}

                {/* 에러 또는 데이터 없음 */}
                {!loading && alertMessage && (
                    <Box py={4}>
                        <Alert severity={alertMessage.includes('실패') ? 'error' : 'info'}>
                            {alertMessage}
                        </Alert>
                    </Box>
                )}
                
                {/* 앨범 목록 */}
                {!loading && allAlbums.length > 0 && (
                    <>
                        <div className="release_list">
                            {currentAlbums.map((album) => (
                                <div className="album_cont" key={album.id}>
                                    {/* 💡 [Link 수정] Link의 자식은 <a> 태그 하나만 유지 */}
                                    <Link 
                                        href={`/album/${album.id}`} 
                                        passHref 
                                        legacyBehavior
                                    > 
                                        <a className="album_img"> 
                                            {/* 💡 [Image 수정] 일반 <img> 대신 Next/Image 사용 및 layout="fill" 적용 */}
                                            <Image 
                                                alt={album.title} 
                                                src={getCoverImageUrl(album)} 
                                                layout="fill" 
                                                objectFit="cover"
                                                unoptimized // 외부 이미지 최적화 오류를 피하기 위해 추가
                                            />

                                            <div className="list-hover">
                                                <Image 
                                                    alt="자세히보기" 
                                                    src={more_view} 
                                                    width={70} 
                                                    height={70} 
                                                />
                                            </div>
                                        </a>
                                    </Link>
                                    <div className="txt">
                                        {/* 💡 서버 데이터 사용 */}
                                        <p>{album.title}</p>
                                        <span>{album.date ? album.date.split('T')[0] : '날짜 미정'}</span>
                                    </div>
                                </div>
                            ))}
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
            </div>
        </div>
    );
}