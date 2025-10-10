export interface GalleryItem {
  id: number;
  href: string;
  src: string;
  alt: string;
}

export const gallery: GalleryItem[] = [
  {
    id: 1,
    href: "https://lv2-cdn.azureedge.net/day6/cf3adb18c30e4dc1950c201e3a72c20e-18.jpg",
    src: "https://lv2-cdn.azureedge.net/day6/5fd06e1a043b49869773966b04822527-1820250507053031958.jpg",
    alt: "5fd06e1a043b49869773966b04822527-1820250507053031958.jpg",
  },
  {
    id: 2,
    href: "https://lv2-cdn.azureedge.net/day6/6fff291badee49d4b905884584fa6711-17.jpg",
    src: "https://lv2-cdn.azureedge.net/day6/c68e619cf3ec403eb2c9af3c740a18cd-1720250507053030973.jpg",
    alt: "c68e619cf3ec403eb2c9af3c740a18cd-1720250507053030973.jpg",
  },
  {
    id: 3,
    href: "https://lv2-cdn.azureedge.net/day6/a4e92feb1cb14c06a4bcf6a1c5d93757-16.jpg",
    src: "https://lv2-cdn.azureedge.net/day6/18ac9bacacd24c0db0e9240ac97c24e7-1620250507053030036.jpg",
    alt: "18ac9bacacd24c0db0e9240ac97c24e7-1620250507053030036.jpg",
  },
  // ... 나머지 이미지 데이터 동일 형식으로 추가
];
