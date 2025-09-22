import { useState } from 'react';
import axios from 'axios';
import { SettingsData, SnsLink } from '@shared/types/settings';

export default function SettingsPage() {
  // 1️⃣ 상태 관리
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [snsLinks, setSnsLinks] = useState<SnsLink[]>([
    { id: 'instagram', url: '', icon: '/assets/icons/sns_instagram.png' },
    { id: 'twitter', url: '', icon: '/assets/icons/sns_twitter.png' },
    { id: 'youtube', url: '', icon: '/assets/icons/sns_youtube.png' },
    { id: 'cafe', url: '', icon: '/assets/icons/sns_cafe.png' },
    { id: 'shop', url: '', icon: '/assets/icons/sns_shop.png'},
  ]);

  // 2️⃣ 메인 이미지 업로드
  const uploadMainImage = async () => {
    if (!mainImage) return null;

    const formData = new FormData();
    formData.append('image', mainImage);

    const res = await axios.post('/api/settings/main-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  };

  // 3️⃣ SNS 링크 저장
  const saveSnsLinks = async () => {
    const res = await axios.post('/api/settings/sns-links', snsLinks);
    return res.data;
  };

  // 4️⃣ 저장 버튼 핸들러
  const handleSave = async () => {
    try {
      // 이미지 업로드
      await uploadMainImage();

      // SNS 링크 저장
      await saveSnsLinks();

      alert('설정이 저장되었습니다!');
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h2>기본 설정</h2>

      {/* 메인 이미지 업로드 */}
      <div>
        <label>메인 이미지 업로드</label>
        <input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} />
      </div>

      {/* SNS 링크 입력 */}
      <div>
        <h3>SNS 링크</h3>
        {snsLinks.map((link, idx) => (
          <div key={link.id} style={{ marginBottom: 10 }}>
            <label>{link.id}</label>
            <input
              type="text"
              value={link.url}
              placeholder="URL 입력"
              onChange={(e) => {
                const newLinks = [...snsLinks];
                newLinks[idx].url = e.target.value;
                setSnsLinks(newLinks);
              }}
              style={{ marginLeft: 10, width: 300 }}
            />
          </div>
        ))}
      </div>

      <button onClick={handleSave} style={{ marginTop: 20 }}>
        저장
      </button>
    </div>
  );
}
