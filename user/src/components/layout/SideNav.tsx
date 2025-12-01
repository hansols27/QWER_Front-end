import Image from 'next/image';
import Link from 'next/link';
import close from '@front/assets/icons/close.png';

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
          <Image src={close} alt="닫기 아이콘" />
        </button>
      </div>

      <ul className="gnb_list">
        <li>
          <Link href="/Profile" passHref>
            <a onClick={onClose}>PROFILE</a>
          </Link>
        </li>
        <li>
          <Link href="/Album" passHref>
            <a onClick={onClose}>DISCOGRAPHY</a>
          </Link>
        </li>
        <li>
          <Link href="/Gallery" passHref>
            <a onClick={onClose}>GALLERY</a>
          </Link>
        </li>
        <li>
          <Link href="/Video" passHref>
            <a onClick={onClose}>VIDEO</a>
          </Link>
        </li>
        <li>
          <Link href="/Schedule" passHref>
            <a onClick={onClose}>SCHEDULE</a>
          </Link>
        </li>
        <li>
          <Link href="/Notice" passHref>
            <a onClick={onClose}>NOTICE</a>
          </Link>
        </li>
        {/*
        <li>
          <Link href="/Community" passHref>
            <a onClick={onClose}>COMMUNITY</a>
          </Link>
        </li>
        */}
      </ul>
    </nav>
  );
};

export default SideNav;
