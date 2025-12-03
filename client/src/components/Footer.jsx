import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <img 
              src="/KakaoTalk_20251113_223638598.png" 
              alt="이창현수학" 
              className="footer-logo-image"
            />
          </div>
          <div className="footer-info">
            <p className="footer-text">&copy; 이창현수학. All rights reserved.</p>
            <p className="footer-contact">연락처 | 010-9903-7949</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

