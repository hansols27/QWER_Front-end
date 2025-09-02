import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { albums } from '@/data/albumlist';
import '@/ui/detail/albumdetail.css';

export default function AlbumDetail() {
  const { title } = useParams<{ title: string }>();
  const album = albums.find((a) => a.id === title)!;

  return (
    <div className="container">
      {/* Side 영역 */}
      <div id="side">
        <div className="side2">
          02
          <span className="s_line"></span>
          DISCOGRAPHY
        </div>
      </div>

      <div className="cont discography wow fadeInUp" data-wow-delay="0.2s">
        {/* Left */}
        <div className="dis_left">
          <div className="dis_bt_top">
            <p className="back">
              <Link to="/Album">&lt; BACK</Link>
            </p>
          </div>

          {/* 앨범 커버 */}
          <div className="onlin_cover">
            <img alt={album.title} src={album.image} />
          </div>

          {/* 발매일 */}
          <div className="dis_bt_bottom">
            <p className="dis_date">{album.date}</p>
          </div>

          {/* 트랙리스트 */}
          {album.tracks && (
            <div className="tracklist">
              <div className="card-bare-text release-playlist text-tall">
                {album.tracks.map((track, index) => (
                  <p key={index}>
                    {index + 1}. {track}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="dis_right">
          <div className="discography_inner">
            <div className="dis_txt_top">
              <p className="album_name EN">{album.title}</p>
            </div>

            {/* 설명 */}
            {album.description && (
              <div className="dis_more_cont" style={{ whiteSpace: 'pre-line' }}>
                {album.description}
              </div>
            )}

            {/* 유튜브 영상 */}
            {album.videoUrl && (
              <div className="video">
                <iframe
                  src={album.videoUrl}
                  title={album.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
