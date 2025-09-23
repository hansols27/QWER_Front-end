import { useSocialLinks } from '@front/constants/snsLinks';
import { openInNewTab } from '@utils/openInNewTab';

const Footer = () => {
  const socialLinks = useSocialLinks(); // admin에서 입력한 URL 반영

  return (
    <footer id="footer">
      <div className="footer-inner">
        {/* SNS 메뉴 */}
        <aside className="sns-menu">
          <ul>
            {socialLinks.map(({ id, icon, url }) => (
              <li
                key={id}
                onClick={() => url && openInNewTab(url)} // URL이 있을 때만 새 탭 열기
                title={id}
                style={{ cursor: url ? "pointer" : "default" }}
              >
                <img src={icon} alt={`${id} 아이콘`} width={25} height={25} />
              </li>
            ))}
          </ul>
        </aside>

        {/* Copyright */}
        <div className="copyright">
          Copyright © <span className="q">Q</span>
          <span className="w">W</span>
          <span className="e">E</span>
          <span className="r">R</span> Fansite
        </div>
      </div>
    </footer>
  );
};

export default Footer;
