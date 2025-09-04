import React from 'react';
import close from '@/assets/icons/close.png';
import { Link } from 'react-router-dom';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <nav className="gnb open" aria-label="사이드 네비게이션">
      <div className="gnb-header">
        <button
          className="menu_close"
          onClick={onClose}
          type="button"
          aria-label="사이드메뉴 닫기"
        >
          <img src={close} alt="닫기 아이콘" />
        </button>
      </div>

      <ul className="gnb_list">
        <li>
          <Link to="/Profile" onClick={onClose}>
            PROFILE
          </Link>
        </li>
        <li>
          <Link to="/Album" onClick={onClose}>
            DISCOGRAPHY
          </Link>
        </li>
        <li>
          <Link to="/Gallery" onClick={onClose}>
            GALLERY
          </Link>
        </li>
        <li>
          <Link to="/Video" onClick={onClose}>
            VIDEO
          </Link>
        </li>
        <li>
          <Link to="/Schedule" onClick={onClose}>
            SCHEDULE
          </Link>
        </li>
        <li>
          <Link to="/Notice" onClick={onClose}>
            NOTICE
          </Link>
        </li>
        {/*
        <li>
          <Link to="/Community" onClick={onClose}>
            COMMUNITY
          </Link>
        </li>
        */}
      </ul>
    </nav>
  );
};

export default SideNav;
