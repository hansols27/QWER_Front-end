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
          <Link href="/Profile" onClick={onClose}>
            PROFILE
          </Link>
        </li>
        <li>
          <Link href="/Album" onClick={onClose}>
            DISCOGRAPHY
          </Link>
        </li>
        <li>
          <Link href="/Gallery" onClick={onClose}>
            GALLERY
          </Link>
        </li>
        <li>
          <Link href="/Video" onClick={onClose}>
            VIDEO
          </Link>
        </li>
        <li>
          <Link href="/Schedule" onClick={onClose}>
            SCHEDULE
          </Link>
        </li>
        <li>
          <Link href="/Notice" onClick={onClose}>
            NOTICE
          </Link>
        </li>
      </ul>

    </nav>
  );
};

export default SideNav;
