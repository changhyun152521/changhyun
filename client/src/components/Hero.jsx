import './Hero.css';

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-banner">
        <div className="banner-overlay-gradient"></div>
        <img 
          src="/제목을-입력해주세요_-002 (4).png" 
          alt="배너" 
          className="banner-image"
        />
        <div className="banner-overlay">
          <img 
            src="/로고로고로고ㅗ고로고.png" 
            alt="로고" 
            className="banner-logo"
          />
        </div>
        <div className="banner-top-left">
          <img 
            src="/007.png" 
            alt="장식" 
            className="banner-decoration"
          />
        </div>
        <div className="banner-bottom-right">
          <img 
            src="/006.png" 
            alt="장식" 
            className="banner-decoration-bottom"
          />
        </div>
        <div className="banner-social-buttons">
          <a 
            href="https://www.youtube.com/@math_chang2" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-btn youtube-btn"
          >
            <i className="fab fa-youtube"></i>
            <span>유튜브</span>
          </a>
          <a 
            href="https://www.instagram.com/math_chang2/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-btn instagram-btn"
          >
            <i className="fab fa-instagram"></i>
            <span>인스타</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;

