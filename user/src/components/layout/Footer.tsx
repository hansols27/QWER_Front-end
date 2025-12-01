'use client';

import { useSocialLinks } from '@front/components/common/snsLinks';
import { openInNewTab } from '@utils/openInNewTab';

const Footer = () => {
  const { snsLinks, isLoading } = useSocialLinks(); // SettingsPage에서 등록한 URL 반영
  const shouldRenderSns = !isLoading && snsLinks.length > 0;

  return (
    <footer id="footer">
      <div className="footer-inner">
        {/* SNS 메뉴 */}
        {shouldRenderSns && (
          <aside className="sns-menu">
            <ul>
              {snsLinks.map(({ id, icon, url }) => (
                <li
                  key={id}
                  onClick={() => url && openInNewTab(url)}
                  title={id}
                  style={{ cursor: url ? 'pointer' : 'default', opacity: url ? 1 : 0.5 }}
                >
                  {icon && <img src={icon.src} alt={`${id} 아이콘`} width={25} height={25} />}
                </li>
              ))}
            </ul>
          </aside>
        )}

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
