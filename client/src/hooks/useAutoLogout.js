import { useEffect, useRef, useState } from 'react';

const INACTIVITY_TIME = 30 * 60 * 1000; // 30분 (밀리초)
const WARNING_TIME = 5 * 60 * 1000; // 5분 전 경고 (밀리초)

export const useAutoLogout = () => {
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const warningShownRef = useRef(false);

  const clearAllTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  };

  const performLogout = () => {
    // 토큰이 있는지 확인
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      // 자동 로그아웃 실행
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedUserId');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // 사용자에게 알림
      alert('30분간 활동이 없어 자동으로 로그아웃되었습니다.');
      
      // 홈으로 이동 및 페이지 새로고침하여 상태 초기화
      window.location.href = '/';
    }
  };

  const resetTimer = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // 토큰이 없으면 타이머 설정하지 않음
    if (!token) {
      clearAllTimers();
      setShowWarning(false);
      warningShownRef.current = false;
      return;
    }

    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    
    clearAllTimers();

    // 경고 타이머 설정 (25분 후)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      warningShownRef.current = true;
    }, INACTIVITY_TIME - WARNING_TIME);

    // 자동 로그아웃 타이머 설정 (30분 후)
    timeoutRef.current = setTimeout(() => {
      performLogout();
    }, INACTIVITY_TIME);
  };

  const handleWarningClose = () => {
    setShowWarning(false);
    warningShownRef.current = false;
    resetTimer(); // 경고 닫으면 타이머 리셋
  };

  const handleWarningStayLoggedIn = () => {
    resetTimer(); // 계속 사용하기 클릭 시 타이머 리셋
  };

  useEffect(() => {
    // 초기 타이머 설정
    resetTimer();

    // 사용자 활동 이벤트 리스너
    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart', 
      'click',
      'keydown',
      'wheel',
      'resize'
    ];
    
    const handleActivity = () => {
      resetTimer();
    };

    // 이벤트 리스너 등록 (capture phase에서도 감지)
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // API 요청 시에도 활동으로 간주 (axios 인터셉터에서 처리)
    const handleApiActivity = () => {
      resetTimer();
    };
    
    // 커스텀 이벤트 리스너 (axios 인터셉터에서 발생시킬 이벤트)
    window.addEventListener('userActivity', handleApiActivity);

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearAllTimers();
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      window.removeEventListener('userActivity', handleApiActivity);
    };
  }, []);

  // 경고 모달 렌더링
  useEffect(() => {
    if (showWarning) {
      // 경고 모달 생성
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 10px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      `;
      
      content.innerHTML = `
        <h3 style="margin: 0 0 1rem 0; color: #333;">세션 만료 경고</h3>
        <p style="margin: 0 0 1.5rem 0; color: #666;">
          5분 후 자동으로 로그아웃됩니다.<br/>
          계속 사용하시겠습니까?
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="stayLoggedIn" style="
            padding: 0.75rem 1.5rem;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
          ">계속 사용하기</button>
          <button id="closeWarning" style="
            padding: 0.75rem 1.5rem;
            background: #ccc;
            color: #333;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
          ">닫기</button>
        </div>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // 버튼 이벤트
      const stayBtn = content.querySelector('#stayLoggedIn');
      const closeBtn = content.querySelector('#closeWarning');
      
      stayBtn.onclick = () => {
        handleWarningStayLoggedIn();
        document.body.removeChild(modal);
      };
      
      closeBtn.onclick = () => {
        handleWarningClose();
        document.body.removeChild(modal);
      };
      
      // ESC 키로 닫기
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          handleWarningClose();
          document.body.removeChild(modal);
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
      
      return () => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [showWarning]);

  return null;
};

