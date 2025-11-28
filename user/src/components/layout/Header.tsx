import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
          <Link to="/">
            <Image 
                src={logo} 
                alt="Logo" 
                width={40} 
                height={40} 
            />
          </Link>
        </div>

        {/* isSideNavOpen이 false일 때만 메뉴 아이콘 전체 nav.menu 렌더링 */}
        {!isSideNavOpen && (
          <nav className="menu">
            <Image
              src={menu}
              alt="Menu"
              width={40} 
              height={40} 
              onClick={handleMenuOpen}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleMenuOpen();
                }
              }}
            />
          </nav>
        )}
      </header>

      {/* 사이드 네비게이션 */}
      <SideNav isOpen={isSideNavOpen} onClose={handleMenuClose} />
    </>
  );
};

export default Header;