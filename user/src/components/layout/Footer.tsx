import { useSocialLinks } from '@front/components/common/snsLinks';
import { openInNewTab } from '@utils/openInNewTab';

const Footer = () => {
  const { socialLinks, isLoading, error } = useSocialLinks(); 
  const shouldRenderSns = !isLoading && socialLinks.length > 0 && !error;

  return (
    <footer id="footer">
      <div className="footer-inner">
        {/* SNS 메뉴 */}
        {shouldRenderSns && (
          <aside className="sns-menu">
            <ul>
              {socialLinks.map(({ id, icon, url }) => (
                <li
                  key={id}
                  // 유효한 URL이 있을 때만 클릭 가능하도록 처리
                  onClick={() => url && openInNewTab(url)}
                  title={id}
                  style={{ 
                    cursor: url ? 'pointer' : 'default', 
                    opacity: url ? 1 : 0.5 
                  }}
                >
                  {icon && <img src={icon} alt={`${id} 아이콘`} width={25} height={25} />}
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