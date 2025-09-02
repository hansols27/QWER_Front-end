// 새 창에서 링크 열기 함수
export const openInNewTab = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};
