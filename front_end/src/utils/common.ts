export function openNav() {
  const sidenav = document.getElementById("mySidenav");
  const wrap = document.getElementById("wrap");
  if (sidenav) sidenav.style.height = "100%";
  if (wrap) wrap.classList.add("gnb_on");
}

export function closeNav() {
  const sidenav = document.getElementById("mySidenav");
  const wrap = document.getElementById("wrap");
  if (sidenav) sidenav.style.height = "0";
  if (wrap) wrap.classList.remove("gnb_on");
}

export function initCommon() {
  // DOMContentLoaded 대신 React useEffect에서 호출한다고 가정
  const topBanner = document.getElementById("topBanner");
  const goTop = document.getElementById("goTop");
  const videoBg = document.getElementById("video-bg");
  const videoIframe = videoBg?.querySelector("iframe");

  // 윈도우 너비 체크 후 iframe display 조절, video-bg 높이 설정
  function updateVideoBg() {
    const width = window.innerWidth;
    if (width > 500) {
      if (videoIframe) videoIframe.style.display = "block";
      if (videoBg) videoBg.style.height = `${width * 0.57}px`;
    } else {
      if (videoIframe) videoIframe.style.display = "none";
    }
  }
  updateVideoBg();
  window.addEventListener("resize", updateVideoBg);

  // .gnb a 클릭 시 body.active 제거
  const gnbLinks = document.querySelectorAll(".gnb a");
  gnbLinks.forEach(link => {
    link.addEventListener("click", () => {
      document.body.classList.remove("active");
    });
  });

  // .gnb_list li a hover 시 artist_color 토글 (mouseenter, mouseleave 이벤트)
  const gnbListLinks = document.querySelectorAll(".gnb_list li a");
  gnbListLinks.forEach(link => {
    link.addEventListener("mouseenter", () => {
      link.classList.add("artist_color");
    });
    link.addEventListener("mouseleave", () => {
      link.classList.remove("artist_color");
    });
  });
}