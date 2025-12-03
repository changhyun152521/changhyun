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
    privacyAgreement: false, // 개인정보 수집 및 이용 동의
    termsAgreement: false, // 서비스 이용 약관 동의
    allAgreement: false, // 모두 동의
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

    // 개인정보 수집 및 이용 동의 검증
    if (!formData.privacyAgreement) {
      newErrors.privacyAgreement = '개인정보 수집 및 이용에 동의해주세요';
    }

    // 서비스 이용 약관 동의 검증
    if (!formData.termsAgreement) {
      newErrors.termsAgreement = '서비스 이용 약관에 동의해주세요';
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
        privacyAgreement: formData.privacyAgreement, // 개인정보 수집 및 이용 동의
        termsAgreement: formData.termsAgreement, // 서비스 이용 약관 동의
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

          {/* 약관 동의 (통합) */}
          <div className="form-group">
            <div className="agreement-box-unified">
              <div className="agreement-item">
                <label className="checkbox-label-compact">
                  <input
                    type="checkbox"
                    name="privacyAgreement"
                    checked={formData.privacyAgreement}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text-compact">
                    <span className="required-mark">(필수)</span>{' '}
                    <span>개인정보 수집 및 이용에 동의합니다</span>
                  </span>
                </label>
                <button
                  type="button"
                  className="view-detail-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyModal(true);
                  }}
                >
                  전체보기
                </button>
              </div>
              <div className="agreement-item">
                <label className="checkbox-label-compact">
                  <input
                    type="checkbox"
                    name="termsAgreement"
                    checked={formData.termsAgreement}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text-compact">
                    <span className="required-mark">(필수)</span>{' '}
                    <span>서비스 이용 약관에 동의합니다</span>
                  </span>
                </label>
                <button
                  type="button"
                  className="view-detail-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                >
                  전체보기
                </button>
              </div>
            </div>
            {(errors.privacyAgreement || errors.termsAgreement) && (
              <span className="error-message">
                {errors.privacyAgreement || errors.termsAgreement}
              </span>
            )}
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

      {/* 개인정보 수집 및 이용 동의서 모달 */}
      {showPrivacyModal && (
        <div className="agreement-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="agreement-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="agreement-modal-header">
              <h2>개인정보 수집 및 이용 동의서</h2>
              <button
                type="button"
                className="agreement-modal-close"
                onClick={() => setShowPrivacyModal(false)}
              >
                ×
              </button>
            </div>
            <div className="agreement-modal-body">
              <div className="agreement-section">
                <h3>1. 수집 목적</h3>
                <p>이창현수학은 다음과 같은 목적으로 개인정보를 수집 및 이용합니다:</p>
                <ul>
                  <li>강의 관리 및 운영</li>
                  <li>학생별 학습 통계 분석 및 성적 관리</li>
                  <li>학생과 학부모 계정 연동 및 관리</li>
                  <li>학생 및 학부모와의 원활한 소통</li>
                  <li>서비스 제공 및 개선</li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>2. 수집 항목</h3>
                <p>다음과 같은 개인정보를 수집합니다:</p>
                <ul>
                  <li><strong>필수 항목:</strong> 아이디, 비밀번호, 이름, 학생 연락처, 부모님 연락처, 이메일, 학교명</li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>3. 보유 및 이용 기간</h3>
                <p>
                  수집한 개인정보는 회원 탈퇴 시까지 보유 및 이용하며, 회원 탈퇴 시 지체 없이 파기합니다.
                  단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.
                </p>
              </div>

              <div className="agreement-section">
                <h3>4. 거부 권리 및 불이익</h3>
                <p>
                  귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다.
                  다만, 필수 항목에 대한 동의를 거부할 경우 회원가입 및 서비스 이용이 제한됩니다.
                </p>
              </div>

              <div className="agreement-section">
                <h3>5. 개인정보의 제3자 제공</h3>
                <p>
                  이창현수학은 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
                  다만, 법령에 의하여 제공이 요구되는 경우에는 예외로 합니다.
                </p>
              </div>
            </div>
            <div className="agreement-modal-footer">
              <button
                type="button"
                className="agreement-modal-confirm"
                onClick={() => {
                  setFormData((prev) => {
                    const updated = { ...prev, privacyAgreement: true };
                    updated.allAgreement = updated.privacyAgreement && updated.termsAgreement;
                    return updated;
                  });
                  setErrors((prev) => ({ ...prev, privacyAgreement: '' }));
                  setShowPrivacyModal(false);
                }}
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 서비스 이용 약관 모달 */}
      {showTermsModal && (
        <div className="agreement-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="agreement-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="agreement-modal-header">
              <h2>서비스 이용 약관</h2>
              <button
                type="button"
                className="agreement-modal-close"
                onClick={() => setShowTermsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="agreement-modal-body">
              <div className="agreement-section">
                <h3>제1조 (목적)</h3>
                <p>
                  본 약관은 이창현수학(이하 "회사")이 제공하는 온라인 수학 강의 및 학습 관리 서비스(이하 "서비스")의 이용과 관련하여 
                  회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>
              </div>

              <div className="agreement-section">
                <h3>제2조 (정의)</h3>
                <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                <ul>
                  <li><strong>"서비스"</strong>란 회사가 제공하는 온라인 수학 강의 및 학습 관리 플랫폼을 의미합니다.</li>
                  <li><strong>"이용자"</strong>란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 회원을 의미합니다.</li>
                  <li><strong>"회원"</strong>이란 서비스에 회원등록을 하고 서비스를 이용하는 자를 의미합니다.</li>
                  <li><strong>"아이디(ID)"</strong>란 회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 문자와 숫자의 조합을 의미합니다.</li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>제3조 (약관의 게시와 개정)</h3>
                <ul>
                  <li>회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                  <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                  <li>약관이 개정되는 경우 회사는 개정된 약관의 내용과 시행일을 명시하여 현행약관과 함께 서비스 초기 화면에 그 시행일 7일 이전부터 시행일 후 상당한 기간 동안 공지합니다.</li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>제4조 (회원가입)</h3>
                <ul>
                  <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</li>
                  <li>회사는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
                    <ul>
                      <li>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                      <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                      <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                    </ul>
                  </li>
                  <li>회원가입계약의 성립 시기는 회사의 승낙이 회원에게 도달한 시점으로 합니다.</li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>제5조 (회원정보의 변경)</h3>
                <p>
                  회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다. 
                  다만, 서비스 관리를 위해 필요한 아이디 등은 수정이 불가능합니다.
                </p>
              </div>

              <div className="agreement-section">
                <h3>제6조 (서비스의 제공 및 변경)</h3>
                <ul>
                  <li>회사는 다음과 같은 서비스를 제공합니다:
                    <ul>
                      <li>온라인 수학 강의 서비스</li>
                      <li>학습 진도 관리 및 통계 서비스</li>
                      <li>학생 및 학부모 간 소통 서비스</li>
                      <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                    </ul>
                  </li>
                  <li>회사는 서비스의 내용 및 제공일자를 제7조 제2항에서 정한 방법으로 회원에게 통지하고, 
                    제1항에 정한 서비스를 변경하여 제공할 수 있습니다.</li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>제7조 (서비스의 중단)</h3>
                <ul>
                  <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                  <li>회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 회원 또는 제3자가 입은 손해에 대하여 배상합니다. 
                    단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>제8조 (회원의 의무)</h3>
                <ul>
                  <li>회원은 다음 행위를 하여서는 안 됩니다:
                    <ul>
                      <li>신청 또는 변경 시 허위내용의 등록</li>
                      <li>타인의 정보 도용</li>
                      <li>회사가 게시한 정보의 변경</li>
                      <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                      <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                      <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                      <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>제9조 (개인정보보호)</h3>
                <p>
                  회사는 이용자의 개인정보 수집 시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다. 
                  회사는 회원가입 시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다. 
                  다만, 관련 법령상 의무이행을 위하여 필요한 정보를 수집하는 경우에는 예외로 합니다.
                </p>
              </div>

              <div className="agreement-section">
                <h3>제10조 (회원의 탈퇴 및 자격 상실 등)</h3>
                <ul>
                  <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.</li>
                  <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다:
                    <ul>
                      <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                      <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                      <li>서비스를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>제11조 (면책조항)</h3>
                <ul>
                  <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                  <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
                  <li>회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 
                    그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
                </ul>
              </div>

              <div className="agreement-section">
                <h3>제12조 (준거법 및 관할법원)</h3>
                <ul>
                  <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 
                    주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.</li>
                  <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 대한민국 법을 적용합니다.</li>
                </ul>
              </div>

              <div className="agreement-section">
                <p className="agreement-date">
                  <strong>시행일자:</strong> 2025년 1월 1일
                </p>
              </div>
            </div>
            <div className="agreement-modal-footer">
              <button
                type="button"
                className="agreement-modal-confirm"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, termsAgreement: true }));
                  setErrors((prev) => ({ ...prev, termsAgreement: '' }));
                  setShowTermsModal(false);
                }}
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default SignUp;

