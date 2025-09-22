import { socialLinks } from '@front/constants/snsLinks';
import { openInNewTab } from '@utils/openInNewTab';

const Footer = () => {
  return (
    <footer id="footer">
      <div className="footer-inner">
        {/* SNS 메뉴 */}
        <aside className="sns-menu">
          <ul>
            {socialLinks.map(({ id, icon, url }) => (
              <li
                key={id}
                onClick={() => openInNewTab(url)}
                title={id}
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
