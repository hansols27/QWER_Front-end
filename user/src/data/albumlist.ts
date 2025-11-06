import type { AlbumItem } from '@shared/types/album';

import Discord from '@front/assets/images/albums/discord.jpg';
import Manito from '@front/assets/images/albums/manito.jpg';
import Algorithm from '@front/assets/images/albums/algorithm.jpg';
import Dear from '@front/assets/images/albums/dear.jpg';

export const albums: AlbumItem[] = [
  {
    id: 'dear',
    title: '난 네 편이야, 온 세상이 불협일지라도',
    date: '2025. 06. 09.',
    image: Dear,
    description: `“알려주세요, 눈물을 참는 방법”
: 눈물로 얼룩진 날들을 이제는 보내보려고 해요.\n
타이틀곡 '눈물참기'는 눈물을 참을 수 없는 슬픔에도 불구하고 이제는 잘 지내보겠다는 마음을 솔직하게 고백하는 곡이다. 호소력 짙은 멜로디와 더불어 서정적이면서도 울림 있는 밴드 사운드가 섬세한 감정을 전달한다.`,
    tracks: [
      '눈물참기',
      '행복해져라',
      '검색어는 QWER',
      'OVERDRIVE',
      'D-Day',
      'Yoyrs Sincerely',
    ],
    videoUrl: 'https://www.youtube.com/embed/pifz9JH1Re8',
  },
  {
    id: 'algorithms-blossom',
    title: 'Algorithm’s Blossom',
    date: '2024. 09. 23.',
    image: Algorithm,
    description: `"우리라는 씨앗을 심었어"\n
'INTRO'는 이번 미니 앨범의 포문을 여는 곡으로, 웅장한 무드의 일렉트로닉한 트랙과 벅차오르는 나레이션이 더해져 알고리즘이라는 세상 위에 심어진 QWER의 새로운 서사에 대한 기대감을 싣는다.`,
    tracks: [
      'INTRO',
      '가짜 아이돌',
      '내 이름 맑음',
      '사랑하자',
      '달리기',
      '안녕, 나의 슬픔',
      '메아리',
      'OUTRO',
    ],
    videoUrl: 'https://www.youtube.com/embed/AlirzLFEHUI',
  },
  {
    id: 'manito',
    title: 'MANITO',
    date: '2024. 04. 01.',
    image: Manito,
    description: `"매일 고민하고 연습했던 말"\n
Scene#01 : 아침에 눈을 뜨면 아른거리는 너의 모습. 그리고 두근거리는 마음과 함께 시작되는 하루. 너와 가까워지려면 어떻게 해야 할까? 쑥스러워 말 못 하는 망설임과 날 봐줄 거라는 기대감 사이, 난 천 번 하고도 한 번 더 고민 중이야.\n
'고민중독'은 동경하는 상대와 가까워지는 방법을 찾기 위해 수없이 고민하고, 또 어떻게 마음을 전달할지 고민하는 화자의 속마음을 귀엽고 에너제틱하게 표현한 곡이다. 드럼 앤 베이스 기반의 빠르고 중독성 있는 리프는 물론, 귀를 사로잡는 서정적인 멜로디까지 다채로운 구성으로 매력을 어필한다.`,
    tracks: [
      '고민중독',
      'SODA',
      '자유선언',
      '지구정복',
      '대관람차',
      '불꽃놀이',
      '마니또',
    ],
    videoUrl: 'https://www.youtube.com/embed/ImuWa3SJulY',
  },
  {
    id: 'harmony-from-discord',
    title: 'Harmony from Discord',
    date: '2023. 10. 18.',
    image: Discord,
    description: `‘Discord’는 ‘불협화음’이라는 뜻을 가진 제목으로, 때론 좌충우돌처럼 보이지만 거침없는 매력으로 사람들의 시선을 사로잡겠다는 QWER 멤버들의 당당한 메세지가 담긴 곡이다. 빠르고 에너지 있는 연주와 귀를 사로잡는 경쾌한 기타 리프, 그리고 위트 있는 가사가 인상적이다.`,
    tracks: ['별의 하모니', 'Discord', '수수께끼 다이어리'],
    videoUrl: 'https://www.youtube.com/embed/WGm2HmXeeRI',
  },
];
