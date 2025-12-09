import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isMobileRef = useRef(window.innerWidth <= 968);

  // 로그인 상태 확인 함수
  const checkLoginStatus = (silent = false) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        const newName = userData.name || userData.userId || '';
        const newIsAdmin = userData.isAdmin === true;
        
        // 상태가 변경된 경우에만 업데이트하고 로그 출력
        if (!isLoggedIn || userName !== newName || isAdmin !== newIsAdmin) {
          setIsLoggedIn(true);
          setUserName(newName);
          setIsAdmin(newIsAdmin);
          if (!silent) {
            console.log('로그인 상태 확인:', { name: userData.name, userId: userData.userId, isAdmin: newIsAdmin });
          }
        }
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        setIsLoggedIn(false);
        setUserName('');
        setIsAdmin(false);
      }
    } else {
      if (isLoggedIn) {
        setIsLoggedIn(false);
        setUserName('');
        setIsAdmin(false);
        if (!silent) {
          console.log('로그인 상태 없음');
        }
      }
    }
  };

  // 모바일 메뉴 열림/닫힘에 따라 body 스크롤 제어
  useEffect(() => {
    if (isMobileMenuOpen) {
      // 모바일 메뉴가 열렸을 때도 스크롤 허용
      document.body.style.overflow = '';
      document.body.style.position = '';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // 화면 크기 변경 감지
    const handleResize = () => {
      isMobileRef.current = window.innerWidth <= 968;
    };

    window.addEventListener('resize', handleResize);

    // 스크롤 이벤트 리스너 (throttle 적용)
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 초기 로그인 상태 확인 (조용히)
    checkLoginStatus(true);

    // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시 감지)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkLoginStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 주기적으로 로그인 상태 확인 (페이지 이동 시 업데이트) - 3초마다 체크
    const interval = setInterval(checkLoginStatus, 3000);

    // 화면 밖 클릭 시 사용자 메뉴 닫기 (모바일 및 PC 모두)
    const handleUserMenuClickOutside = (e) => {
      if (isUserMenuOpen) {
        const userMenu = e.target.closest('.user-menu');
        // PC에서는 hover로도 제어되므로 클릭 이벤트는 모바일에서만 처리
        if (isMobileRef.current && !userMenu) {
          setIsUserMenuOpen(false);
        }
      }
    };

    // 모바일에서 화면 밖 클릭 시 네비게이션 메뉴 닫기
    const handleNavMenuClickOutside = (e) => {
      if (isMobileRef.current && isMobileMenuOpen) {
        const nav = e.target.closest('.nav');
        const mobileMenuToggle = e.target.closest('.mobile-menu-toggle');
        const dropdownMenu = e.target.closest('.dropdown-menu');
        const navLink = e.target.closest('.nav-link');
        // 네비게이션, 모바일 메뉴 토글, 드롭다운 메뉴, 네비게이션 링크 내부 클릭은 무시
        if (!nav && !mobileMenuToggle && !dropdownMenu && !navLink) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleUserMenuClickOutside);
    }

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleNavMenuClickOutside);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
      document.removeEventListener('click', handleUserMenuClickOutside);
      document.removeEventListener('click', handleNavMenuClickOutside);
    };
  }, [isUserMenuOpen, isMobileMenuOpen]);

  const handleLogout = () => {
    // 로그아웃 확인 메시지
    const confirmLogout = window.confirm('정말 로그아웃 하시겠습니까?');
    
    if (!confirmLogout) {
      return; // 사용자가 취소를 선택한 경우
    }

    // localStorage와 sessionStorage 모두에서 제거
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedUserId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserName('');
    setIsAdmin(false);
    navigate('/');
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/');
    // 홈으로 이동 시 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          <a href="/" className="logo" onClick={handleLogoClick}>
            <img 
              src="/KakaoTalk_20250321_000608260_01-removebg-preview.png" 
              alt="이창현수학" 
              className="logo-image"
            />
          </a>
          <nav className={`nav ${isMobileMenuOpen ? 'active' : ''}`}>
            <ul className="nav-list">
              {/* 내강의실 */}
              <li 
                className={`nav-item dropdown ${activeDropdown === 'myClassroom' ? 'active' : ''}`}
                onMouseEnter={() => {
                  if (!isMobileRef.current) {
                    setActiveDropdown('myClassroom');
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobileRef.current) {
                    setActiveDropdown(null);
                  }
                }}
              >
                <a 
                  href="#" 
                  className="nav-link" 
                  onTouchStart={(e) => {
                    if (isMobileRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === 'myClassroom' ? null : 'myClassroom');
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isMobileRef.current) {
                      setActiveDropdown(activeDropdown === 'myClassroom' ? null : 'myClassroom');
                    }
                  }}
                >
                  내강의실
                  <i className="fas fa-chevron-down" style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}></i>
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/preview-courses');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      맛보기강좌
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/my-classroom/courses');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      내강좌
                    </a>
                  </li>
                </ul>
              </li>

              {/* 내교실 */}
              <li 
                className={`nav-item dropdown ${activeDropdown === 'myClass' ? 'active' : ''}`}
                onMouseEnter={() => {
                  if (!isMobileRef.current) {
                    setActiveDropdown('myClass');
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobileRef.current) {
                    setActiveDropdown(null);
                  }
                }}
              >
                <a 
                  href="#" 
                  className="nav-link" 
                  onTouchStart={(e) => {
                    if (isMobileRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === 'myClass' ? null : 'myClass');
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isMobileRef.current) {
                      setActiveDropdown(activeDropdown === 'myClass' ? null : 'myClass');
                    }
                  }}
                >
                  내교실
                  <i className="fas fa-chevron-down" style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}></i>
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/my-class/status');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      수업현황
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/my-class/statistics');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      월별통계
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = 'https://www.mathchang-quiz.com/';
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Quiz lab
                    </a>
                  </li>
                </ul>
              </li>

              {/* 학부모교실 */}
              <li 
                className={`nav-item dropdown ${activeDropdown === 'parentClass' ? 'active' : ''}`}
                onMouseEnter={() => {
                  if (!isMobileRef.current) {
                    setActiveDropdown('parentClass');
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobileRef.current) {
                    setActiveDropdown(null);
                  }
                }}
              >
                <a 
                  href="#" 
                  className="nav-link" 
                  onTouchStart={(e) => {
                    if (isMobileRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === 'parentClass' ? null : 'parentClass');
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isMobileRef.current) {
                      setActiveDropdown(activeDropdown === 'parentClass' ? null : 'parentClass');
                    }
                  }}
                >
                  학부모교실
                  <i className="fas fa-chevron-down" style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}></i>
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/parent-class/status');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      수업현황
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/parent-class/statistics');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      월별통계
                    </a>
                  </li>
                </ul>
              </li>

              {/* 커뮤니티 */}
              <li 
                className={`nav-item dropdown ${activeDropdown === 'community' ? 'active' : ''}`}
                onMouseEnter={() => {
                  if (!isMobileRef.current) {
                    setActiveDropdown('community');
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobileRef.current) {
                    setActiveDropdown(null);
                  }
                }}
              >
                <a 
                  href="#" 
                  className="nav-link" 
                  onTouchStart={(e) => {
                    if (isMobileRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === 'community' ? null : 'community');
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isMobileRef.current) {
                      setActiveDropdown(activeDropdown === 'community' ? null : 'community');
                    }
                  }}
                >
                  커뮤니티
                  <i className="fas fa-chevron-down" style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}></i>
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/community/notice');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      공지사항
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="dropdown-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/community/attendance');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      수강문의
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
          <div className="auth-buttons">
            {!isLoggedIn ? (
              <>
                <button className="btn-login" onClick={() => navigate('/login')}>로그인</button>
                <button className="btn-signup" onClick={() => navigate('/signup')}>회원가입</button>
              </>
            ) : (
              <div 
                className={`user-menu ${isUserMenuOpen ? 'open' : ''}`}
                onMouseEnter={() => {
                  // 데스크톱에서 hover 시 드롭다운 열기
                  if (!isMobileRef.current) {
                    setIsUserMenuOpen(true);
                  }
                }}
                onMouseLeave={() => {
                  // 데스크톱에서 마우스가 벗어나면 드롭다운 닫기
                  if (!isMobileRef.current) {
                    setIsUserMenuOpen(false);
                  }
                }}
              >
                <span 
                  className="user-name" 
                  onClick={() => {
                    // 클릭 시 토글 (모바일 및 PC 모두)
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                >
                  {userName.endsWith('부모님') ? `${userName} 환영합니다` : `${userName}님 환영합니다`}
                  <i className={`fas fa-chevron-${isUserMenuOpen ? 'up' : 'down'}`} style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}></i>
                </span>
                <div className="user-menu-dropdown">
                  <button 
                    className="btn-profile" 
                    onClick={() => {
                      navigate('/profile');
                      setIsUserMenuOpen(false);
                    }}
                  >
                    내정보
                  </button>
                  {isAdmin && (
                    <button 
                      className="btn-admin" 
                      onClick={() => {
                        navigate('/admin');
                        setIsUserMenuOpen(false);
                      }}
                    >
                      관리자 페이지
                    </button>
                  )}
                  <button 
                    className="btn-logout" 
                    onClick={() => {
                      handleLogout();
                      setIsUserMenuOpen(false);
                    }}
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

