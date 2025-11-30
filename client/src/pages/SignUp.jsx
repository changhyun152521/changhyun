import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    email: '',
    schoolName: '',
    parentContact: '',
    userType: '학생', // 기본값: 학생
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      const hasLetter = /[a-zA-Z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);

      if (hasLetter && hasNumber) {
        if (formData.password.length < 7) {
          newErrors.password = '영문+숫자 조합은 7자 이상이어야 합니다';
        }
      } else {
        newErrors.password = '영문+숫자 7자 이상이어야 합니다';
      }
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = '성명을 입력해주세요';
    }

    // 휴대폰 번호 검증
    if (!formData.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요';
    } else if (!/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }

    // 이메일 검증
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    // 학교명 검증
    if (!formData.schoolName.trim()) {
      newErrors.schoolName = '학교명을 입력해주세요';
    }

    // 부모님 연락처 검증
    if (!formData.parentContact.trim()) {
      newErrors.parentContact = '부모님 연락처를 입력해주세요';
    } else if (!/^[0-9-]+$/.test(formData.parentContact)) {
      newErrors.parentContact = '올바른 전화번호 형식이 아닙니다';
    }

    // 사용자 유형 검증
    if (!formData.userType) {
      newErrors.userType = '사용자 유형을 선택해주세요';
    } else if (!['학생', '학부모'].includes(formData.userType)) {
      newErrors.userType = '올바른 사용자 유형을 선택해주세요';
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
      // 서버에 전송할 데이터 준비
      const submitData = {
        userId: formData.userId.trim(),
        password: formData.password,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        schoolName: formData.schoolName.trim(),
        studentContact: formData.phone.trim(), // 휴대폰 번호와 동일하게 설정
        parentContact: formData.parentContact.trim(),
        userType: formData.userType, // 사용자 유형 추가
      };

      // 서버에 POST 요청 전송
      const response = await api.post('/users', submitData);

      // 성공 응답 처리
      if (response.data.success) {
        alert('회원가입이 완료되었습니다!');
        // 성공 후 메인 페이지로 이동
        navigate('/');
      } else {
        alert(response.data.error || '회원가입 중 오류가 발생했습니다');
      }
    } catch (error) {
      // 에러 처리
      let errorMessage = '회원가입 중 오류가 발생했습니다';
      
      if (error.response) {
        // 서버에서 응답이 온 경우
        const serverError = error.response.data;
        if (serverError.error) {
          errorMessage = serverError.error;
        } else if (serverError.details && Array.isArray(serverError.details)) {
          errorMessage = serverError.details.join(', ');
        } else if (serverError.message) {
          errorMessage = serverError.message;
        }
      } else if (error.message) {
        // 네트워크 오류 등
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      console.error('회원가입 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <Header />
      <div className="signup-container">
        <div className="signup-content">
        <h1 className="signup-title">SIGN UP</h1>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* 사용자 유형 */}
          <div className="form-group user-type-group">
            <div className="user-type-buttons">
              <button
                type="button"
                className={`user-type-button ${formData.userType === '학생' ? 'active' : ''}`}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, userType: '학생' }));
                  if (errors.userType) {
                    setErrors((prev) => ({ ...prev, userType: '' }));
                  }
                }}
              >
                <i className="fas fa-user-graduate"></i>
                <span>학생</span>
              </button>
              <button
                type="button"
                className={`user-type-button ${formData.userType === '학부모' ? 'active' : ''}`}
                onClick={() => {
                  setFormData((prev) => ({ ...prev, userType: '학부모' }));
                  if (errors.userType) {
                    setErrors((prev) => ({ ...prev, userType: '' }));
                  }
                }}
              >
                <i className="fas fa-users"></i>
                <span>학부모</span>
              </button>
            </div>
            {errors.userType && <span className="error-message">{errors.userType}</span>}
          </div>

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
                placeholder="비밀번호(영문+숫자 7자 이상)"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
              />
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="form-group">
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'input-error' : ''}
              />
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* 성명 */}
          <div className="form-group">
            <div className="input-wrapper">
              <span className="input-icon">✓</span>
              <input
                type="text"
                name="name"
                placeholder={formData.userType === '학부모' ? '학생명' : '성명'}
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
              />
            </div>
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* 학생 연락처 */}
          <div className="form-group">
            <div className="input-wrapper">
              <span className="input-icon">📱</span>
              <input
                type="tel"
                name="phone"
                placeholder="학생 연락처"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'input-error' : ''}
              />
            </div>
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {/* 부모님 연락처 */}
          <div className="form-group">
            <div className="input-wrapper">
              <span className="input-icon">📱</span>
              <input
                type="tel"
                name="parentContact"
                placeholder="부모님 연락처"
                value={formData.parentContact}
                onChange={handleChange}
                className={errors.parentContact ? 'input-error' : ''}
              />
            </div>
            {errors.parentContact && <span className="error-message">{errors.parentContact}</span>}
          </div>

          {/* 이메일 */}
          <div className="form-group">
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input
                type="email"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* 학교명 */}
          <div className="form-group">
            <div className="input-wrapper">
              <span className="input-icon">📄</span>
              <input
                type="text"
                name="schoolName"
                placeholder="학교명"
                value={formData.schoolName}
                onChange={handleChange}
                className={errors.schoolName ? 'input-error' : ''}
              />
            </div>
            {errors.schoolName && <span className="error-message">{errors.schoolName}</span>}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '가입하기'}
          </button>
        </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SignUp;

