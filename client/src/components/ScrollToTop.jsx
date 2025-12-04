import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 페이지 이동 시 항상 맨 위로 스크롤
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // 즉시 스크롤 (smooth 대신 instant 사용)
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;

