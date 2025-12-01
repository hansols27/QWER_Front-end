'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@shared/services/axios';
import '@front/styles/album.module.css';
import Image from 'next/image';
import { CircularProgress, Alert, Box, Typography } from '@mui/material';

import more_view from '@front/assets/icons/more_view.png';
import btn_prev from '@front/assets/icons/bg-btn-prev.png';
import btn_next from '@front/assets/icons/bg-btn-next.png';
import { AlbumItem } from '@shared/types/album';

interface AlbumListResponse {
  success: boolean;
  data: AlbumItem[];
}

const extractErrorMessage = (error: any, defaultMsg: string): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return defaultMsg;
};

export default function Album() {
  const [allAlbums, setAllAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setAlertMessage(null);
    setCurrentPage(1);

    try {
      const res = await api.get<AlbumListResponse>('/api/album');
      const sortedAlbums = res.data.data.sort(
        (a, b) => parseInt(b.id as unknown as string) - parseInt(a.id as unknown as string)
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

  const totalPages = Math.max(1, Math.ceil(allAlbums.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAlbums = allAlbums.slice(startIndex, startIndex + itemsPerPage);

  const goPrev = () => { if (currentPage > 1) setCurrentPage((prev) => prev - 1); };
  const goNext = () => { if (currentPage < totalPages) setCurrentPage((prev) => prev + 1); };

  const getCoverImageUrl = (album: AlbumItem) => {
    const NO_IMAGE_URL = 'https://via.placeholder.com/400x400?text=No+Image';
    return album.image || album.coverImageUrl || NO_IMAGE_URL;
  };

  return (
    <div className="container">
      <div id="side">
        <div className="side2">
          02
          <span className="s_line"></span>
          DISCOGRAPHY
        </div>
      </div>

      <div className="cont discography_view wow fadeInUp" data-wow-delay="0.2s">
        <div className="title">DISCOGRAPHY</div>

        {loading && (
          <Box display="flex" justifyContent="center" py={8} flexDirection="column" alignItems="center">
            <CircularProgress />
            <Typography mt={2}>앨범 목록을 불러오는 중...</Typography>
          </Box>
        )}

        {!loading && alertMessage && (
          <Box py={4}>
            <Alert severity={alertMessage.includes('실패') ? 'error' : 'info'}>
              {alertMessage}
            </Alert>
          </Box>
        )}

        {!loading && allAlbums.length > 0 && (
          <>
            <div className="release_list">
              {currentAlbums.map((album) => (
                <div className="album_cont" key={album.id}>
                  <Link href={`/album/${album.id}`}>
                    <div className="album_img" style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image
                        alt={album.title}
                        src={getCoverImageUrl(album)}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                      <div className="list-hover">
                        <Image
                          alt="자세히보기"
                          src={more_view}
                          width={70}
                          height={70}
                        />
                      </div>
                    </div>
                  </Link>
                  <div className="txt">
                    <p>{album.title}</p>
                    <span>{album.date ? album.date.split('T')[0] : '날짜 미정'}</span>
                  </div>
                </div>
              ))}
            </div>

            {allAlbums.length > itemsPerPage && (
              <div className="page-btn-box">
                <button type="button" className="prev-btn" onClick={goPrev} disabled={currentPage <= 1}>
                  <Image alt="이전" src={btn_prev} width={36} height={36} />
                  이전
                </button>
                <span className="page-number">
                  <strong>{currentPage}</strong> / <em>{totalPages}</em>
                </span>
                <button type="button" className="next-btn" onClick={goNext} disabled={currentPage >= totalPages}>
                  <Image alt="이후" src={btn_next} width={36} height={36} />
                  이후
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
