import React, { useState } from 'react';
import Link from 'next/link'; 
import Image from 'next/image'; 
import logo from '@front/assets/images/logo.svg';
import menu from '@front/assets/icons/menu.png'; 
import SideNav from '@components/layout/SideNav';

const Header = () => {
    const [isSideNavOpen, setIsSideNavOpen] = useState(false);

    const handleMenuOpen = () => setIsSideNavOpen(true);
    const handleMenuClose = () => setIsSideNavOpen(false);

    return (
        <>
            {/* 헤더 */}
            <header id="header" className="main_hd">
                <div className="logo">
                    {/* 💡 최종 수정: legacyBehavior 및 <a> 태그 제거 */}
                    <Link href="/"> 
                        {/* Link의 자식으로 단일 React 요소인 Image만 남김 */}
                        <Image 
                            src={logo} 
                            alt="Logo" 
                            width={40} // Next/Image는 width/height 필수
                            height={40} 
                            unoptimized 
                        />
                    </Link>
                </div>

                {/* 메뉴 버튼 구조는 이미 올바름 */}
                {!isSideNavOpen && (
                    <button
                        type="button" 
                        className="menu-button"
                        onClick={handleMenuOpen}
                        aria-label="메뉴 열기"
                    >
                        <Image
                            src={menu}
                            alt="Menu 아이콘"
                            width={40} 
                            height={40} 
                            unoptimized 
                        />
                    </button>
                )}
            </header>

            {/* 사이드 네비게이션 */}
            <SideNav isOpen={isSideNavOpen} onClose={handleMenuClose} />
        </>
    );
};

export default Header;