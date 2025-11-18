'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@shared/services/axios';
import Layout from '@components/common/layout';
import {
  Box,
  Button,
  Card,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { AlbumItem } from '@shared/types/album';

type AlertSeverity = 'success' | 'error';

// ===========================
// 유틸리티 함수 (오류 메시지 추출)
// ===========================
const extractErrorMessage = (error: any, defaultMsg: string): string => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return defaultMsg;
};

export default function AlbumList() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    message: string;
    severity: AlertSeverity;
  } | null>(null);
  const router = useRouter();

  /**
   * 앨범 목록 불러오기
   */
  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setAlertMessage(null);

    try {
      const res = await api.get<{ success: boolean; data: AlbumItem[] }>(
        '/api/album'
      );
      setAlbums(res.data.data);
    } catch (err: any) {
      console.error('앨범 로드 실패:', err);
      const errorMsg = extractErrorMessage(
        err,
        '앨범 목록 로드에 실패했습니다. 백엔드 연결 상태를 확인하세요.'
      );
      setAlertMessage({ message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // 앨범 생성 페이지로 이동
  const handleCreateClick = () => {
    router.push('/album/create');
  };

  const NO_IMAGE_URL = 'https://via.placeholder.com/320x240?text=No+Image';

  return (
    <Layout>
      <Box p={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" fontWeight="bold">
            앨범 관리
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateClick}
            disabled={loading}
          >
            앨범 등록
          </Button>
        </Box>

        {alertMessage && (
          <Alert severity={alertMessage.severity} sx={{ mb: 2 }}>
            {alertMessage.message}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography ml={2} sx={{ alignSelf: 'center' }}>
              로딩 중...
            </Typography>
          </Box>
        )}

        {!loading && albums.length === 0 && !alertMessage && (
          <Typography
            variant="body1"
            color="textSecondary"
            align="center"
            py={4}
          >
            등록된 앨범이 없습니다. 앨범을 등록해 주세요.
          </Typography>
        )}

        {/* ⭐️ 수정: Grid container를 CSS Grid 스타일이 적용된 Box로 대체
                  - Grid item의 반응형 설정을 제거하고 320px 아이템을 자동으로 컨텐츠 영역에 채웁니다. 
                */}
        <Box
          sx={{
            display: 'grid',
            gap: '24px', // 아이템 간의 간격 (spacing={3}과 유사)
            // 컨텐츠 영역 너비에 따라 320px 크기의 아이템을 최대한 많이 채우고 나머지는 자동으로 분배
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', // 최소 320px 너비 보장
            justifyContent: 'flex-start', // 앨범이 왼쪽부터 시작하도록 정렬
          }}
        >
          {albums.map((album) => {
            const imageUrl = album.image || NO_IMAGE_URL;
            return (
              // ⭐️ Grid item 대신 일반 Box 또는 div를 사용
              <Box key={album.id}>
                <Link
                  href={`/album/${album.id}`}
                  passHref
                  legacyBehavior
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
                      // Card 자체의 너비도 320px로 고정 (또는 최대 너비 제한)
                      width: '320px',
                    }}
                  >
                    {/* ⭐️ 이미지 컨테이너 크기를 320x240으로 고정 */}
                    <Box
                      sx={{
                        position: 'relative',
                        width: '320px',
                        height: '240px',
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={album.title}
                        fill
                        sizes="320px"
                        style={{
                          // 320x240 컨테이너를 꽉 채우도록 설정
                          objectFit: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                        }}
                        unoptimized={imageUrl === NO_IMAGE_URL}
                        priority={false}
                      />
                    </Box>

                    <Box p={1}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {album.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        align="right"
                      >
                        {album.date ? album.date.split('T')[0] : '날짜 미정'}
                      </Typography>
                    </Box>
                  </Card>
                </Link>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Layout>
  );
}
