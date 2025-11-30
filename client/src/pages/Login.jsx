import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFindUserIdModal, setShowFindUserIdModal] = useState(false);
  const [findUserIdData, setFindUserIdData] = useState({ name: '', email: '' });
  const [findUserIdErrors, setFindUserIdErrors] = useState({});
  const [isFindingUserId, setIsFindingUserId] = useState(false);
  const [foundUserId, setFoundUserId] = useState('');

  // 저장된 로그인 정보 불러오기
  useEffect(() => {
    const savedUserId = localStorage.getItem('rememberedUserId');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedRememberMe && savedUserId) {
      setFormData(prev => ({ ...prev, userId: savedUserId }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 아이디 검증
    if (!formData.userId.trim()) {
      newErrors.userId = '아이디를 입력해주세요';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('로그인 요청 전송:', { userId: formData.userId.trim() });
      
      // 서버에 로그인 요청 전송
      const response = await api.post('/users/login', {
        userId: formData.userId.trim(),
        password: formData.password,
      });

      console.log('로그인 응답 받음:', {
        status: response.status,
        success: response.data?.success,
        hasToken: !!response.data?.token,
        tokenLength: response.data?.token?.length,
        hasData: !!response.data?.data,
        error: response.data?.error,
        fullResponse: response.data
      });

      if (!response.data) {
        console.error('⚠️ 응답 데이터가 없습니다!');
        alert('서버 응답이 올바르지 않습니다. 다시 시도해주세요.');
        return;
      }

      if (response.data.success) {
        // 토큰이 있는지 확인
        if (!response.data.token) {
          console.error('⚠️ 서버에서 토큰을 반환하지 않았습니다!');
          alert('로그인은 성공했지만 토큰을 받지 못했습니다. 다시 시도해주세요.');
          return;
        }

        // 토큰을 저장 (항상 localStorage에 저장, rememberMe는 추가 정보만 저장)
        try {
          // 항상 localStorage에 토큰과 사용자 정보 저장
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.data));
          
          if (rememberMe) {
            // 로그인 상태 유지: 추가 정보 저장
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedUserId', formData.userId.trim());
          } else {
            // 로그인 상태 유지 안 함: 추가 정보 제거
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedUserId');
          }
          
          // sessionStorage에도 동일하게 저장 (호환성)
          sessionStorage.setItem('token', response.data.token);
          sessionStorage.setItem('user', JSON.stringify(response.data.data));
          
          console.log('✅ 토큰 저장 완료:', {
            localStorage: {
              token: localStorage.getItem('token') ? '저장됨' : '저장 실패',
              user: localStorage.getItem('user') ? '저장됨' : '저장 실패'
            },
            sessionStorage: {
              token: sessionStorage.getItem('token') ? '저장됨' : '저장 실패',
              user: sessionStorage.getItem('user') ? '저장됨' : '저장 실패'
            },
            rememberMe: rememberMe
          });
        } catch (storageError) {
          console.error('❌ Storage 저장 오류:', storageError);
          alert('토큰 저장 중 오류가 발생했습니다. 브라우저 설정을 확인해주세요.');
          return;
        }
        
        alert('로그인에 성공했습니다!');
        
        // 성공 후 메인 페이지로 이동 (약간의 지연을 두어 storage에 저장 완료 보장)
        setTimeout(() => {
          navigate('/');
          // 페이지 이동 후 Header 업데이트를 위해 강제 리로드 (선택사항)
          window.dispatchEvent(new Event('storage'));
        }, 100);
      } else {
        alert(response.data.error || '로그인 중 오류가 발생했습니다');
      }
    } catch (error) {
      // 에러 처리
      console.error('로그인 오류 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        hasResponse: !!error.response,
        hasRequest: !!error.request,
      });
      
      let errorMessage = '로그인 중 오류가 발생했습니다';
      
      if (error.response) {
        // 서버에서 응답이 온 경우
        const serverError = error.response.data;
        if (serverError?.error) {
          errorMessage = serverError.error;
        } else if (serverError?.message) {
          errorMessage = serverError.message;
        } else if (error.response.status === 401) {
          errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다';
        } else if (error.response.status === 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMessage = `서버 오류 (${error.response.status})`;
        }
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      } else if (error.message) {
        // 네트워크 오류 등
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 아이디 찾기
  const handleFindUserId = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!findUserIdData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (!findUserIdData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^\S+@\S+\.\S+$/.test(findUserIdData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }
    
    setFindUserIdErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsFindingUserId(true);
    try {
      const response = await api.post('/users/find-userid', {
        name: findUserIdData.name.trim(),
        email: findUserIdData.email.trim().toLowerCase(),
      });

      if (response.data.success) {
        setFoundUserId(response.data.data.fullUserId);
        alert(`아이디를 찾았습니다: ${response.data.data.fullUserId}`);
        setShowFindUserIdModal(false);
        setFindUserIdData({ name: '', email: '' });
        setFoundUserId('');
      } else {
        alert(response.data.error || '아이디 찾기 중 오류가 발생했습니다');
      }
    } catch (error) {
      let errorMessage = '아이디 찾기 중 오류가 발생했습니다';
      console.error('아이디 찾기 오류 상세:', error);
      if (error.response) {
        // 서버에서 응답이 온 경우
        errorMessage = error.response.data?.error || error.response.data?.message || `서버 오류: ${error.response.status}`;
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      } else {
        // 요청 설정 중 오류가 발생한 경우
        errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      }
      alert(errorMessage);
    } finally {
      setIsFindingUserId(false);
    }
  };


  return (
    <div className="login-page">
      <Header />
      <div className="login-container">
        <div className="login-content">
        <h1 className="login-title">LOGIN</h1>
        <p className="login-description">
          이창현수학 방문을 환영합니다
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {/* 아이디 */}
          <div className="form-group">
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="userId"
                placeholder="아이디"
                value={formData.userId}
                onChange={handleChange}
                className={errors.userId ? 'input-error' : ''}
              />
            </div>
            {errors.userId && <span className="error-message">{errors.userId}</span>}
          </div>

          {/* 비밀번호 */}
          <div className="form-group">
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
              />
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* 로그인 상태 유지 & 아이디/비밀번호 찾기 */}
          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>로그인 상태 유지</span>
            </label>
            <div className="find-links">
              <button
                type="button"
                className="find-link"
                onClick={() => setShowFindUserIdModal(true)}
              >
                아이디 찾기
              </button>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            계정이 없으신가요?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }} className="link">
              회원가입
            </a>
          </p>
        </div>
        </div>

      {/* 아이디 찾기 모달 */}
      {showFindUserIdModal && (
        <div className="modal-overlay" onClick={() => setShowFindUserIdModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>아이디 찾기</h2>
              <button className="modal-close" onClick={() => setShowFindUserIdModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleFindUserId} className="modal-form">
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={findUserIdData.name}
                  onChange={(e) => setFindUserIdData({ ...findUserIdData, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className={findUserIdErrors.name ? 'input-error' : ''}
                />
                {findUserIdErrors.name && <span className="error-message">{findUserIdErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  value={findUserIdData.email}
                  onChange={(e) => setFindUserIdData({ ...findUserIdData, email: e.target.value })}
                  placeholder="이메일을 입력하세요"
                  className={findUserIdErrors.email ? 'input-error' : ''}
                />
                {findUserIdErrors.email && <span className="error-message">{findUserIdErrors.email}</span>}
              </div>
              <button type="submit" className="modal-submit-button" disabled={isFindingUserId}>
                {isFindingUserId ? '찾는 중...' : '아이디 찾기'}
              </button>
            </form>
          </div>
        </div>
      )}

      </div>
      <Footer />
    </div>
  );
}

export default Login;

