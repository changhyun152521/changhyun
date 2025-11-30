import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './UserRegister.css';

function UserRegister() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    phone: '',
    schoolName: '',
    studentContact: '',
    parentContact: '',
    userType: '학생',
    classIds: [], // 선택된 반 ID 배열
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');

  useEffect(() => {
    // 관리자 권한 확인
    const checkAdminStatus = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const user = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !user) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      try {
        const userData = JSON.parse(user);
        if (userData.isAdmin !== true) {
          alert('관리자 권한이 필요합니다.');
          navigate('/');
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        alert('사용자 정보를 확인할 수 없습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
    fetchClasses();
  }, [navigate]);

  // 반 목록 가져오기
  const fetchClasses = async () => {
    try {
      setClassesLoading(true);
      const response = await api.get('/classes');
      if (response.data.success) {
        // 최신순 정렬 (createdAt 기준)
        const sortedClasses = (response.data.data || []).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // 내림차순 (최신순)
        });
        setClasses(sortedClasses);
      }
    } catch (error) {
      console.error('반 목록 가져오기 오류:', error);
    } finally {
      setClassesLoading(false);
    }
  };

  const handleClassToggle = (classId) => {
    if (formData.classIds.includes(classId)) {
      setFormData((prev) => ({
        ...prev,
        classIds: prev.classIds.filter((id) => id !== classId),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        classIds: [...prev.classIds, classId],
      }));
    }
  };

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
      if (!hasLetter || !hasNumber || formData.password.length < 7) {
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
      newErrors.name = '이름을 입력해주세요';
    }

    // 이메일 검증
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    // 휴대폰 번호 검증
    if (!formData.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요';
    } else if (!/^[0-9-]+$/.test(formData.phone.trim())) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }

    // 학교명 검증
    if (!formData.schoolName.trim()) {
      newErrors.schoolName = '학교명을 입력해주세요';
    }

    // 학생 연락처 검증
    if (!formData.studentContact.trim()) {
      newErrors.studentContact = '학생 연락처를 입력해주세요';
    } else if (!/^[0-9-]+$/.test(formData.studentContact.trim())) {
      newErrors.studentContact = '올바른 전화번호 형식이 아닙니다';
    }

    // 부모님 연락처 검증
    if (!formData.parentContact.trim()) {
      newErrors.parentContact = '부모님 연락처를 입력해주세요';
    } else if (!/^[0-9-]+$/.test(formData.parentContact.trim())) {
      newErrors.parentContact = '올바른 전화번호 형식이 아닙니다';
    }

    // 사용자 유형 검증
    if (!formData.userType) {
      newErrors.userType = '사용자 유형을 선택해주세요';
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
      const submitData = {
        userId: formData.userId.trim(),
        password: formData.password,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        schoolName: formData.schoolName.trim(),
        studentContact: formData.studentContact.trim(),
        parentContact: formData.parentContact.trim(),
        userType: formData.userType,
        classIds: (formData.userType === '학생' || formData.userType === '학부모') ? formData.classIds : [],
      };

      const response = await api.post('/users/admin', submitData);

      if (response.data.success) {
        alert('회원이 성공적으로 등록되었습니다!');
        navigate('/admin', { state: { refresh: true } });
      } else {
        alert(response.data.error || '회원 등록 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('회원 등록 오류:', error);
      let errorMessage = '회원 등록 중 오류가 발생했습니다';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="user-register-page">
        <Header />
        <div className="user-register-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="user-register-page">
      <Header />
      <div className="user-register-container">
        <div className="user-register-content">
          <h1 className="user-register-title">회원 등록</h1>

          <form onSubmit={handleSubmit} className="user-register-form">
            <div className="form-section">
              <h2 className="section-title">기본 정보</h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">아이디</label>
                  <input
                    type="text"
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    className={`form-input ${errors.userId ? 'input-error' : ''}`}
                    placeholder="아이디를 입력하세요"
                  />
                  {errors.userId && <span className="error-message">{errors.userId}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">사용자 유형</label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className={`form-input form-select ${errors.userType ? 'input-error' : ''}`}
                  >
                    <option value="학생">학생</option>
                    <option value="학부모">학부모</option>
                    <option value="강사">강사</option>
                  </select>
                  {errors.userType && <span className="error-message">{errors.userType}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">비밀번호</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="영문+숫자 7자 이상"
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">비밀번호 확인</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">이름</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${errors.name ? 'input-error' : ''}`}
                    placeholder="이름을 입력하세요"
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">이메일</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="이메일을 입력하세요"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">휴대폰 번호</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`form-input ${errors.phone ? 'input-error' : ''}`}
                    placeholder="휴대폰 번호를 입력하세요"
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">학습 정보</h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">학교명</label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    className={`form-input ${errors.schoolName ? 'input-error' : ''}`}
                    placeholder="학교명을 입력하세요"
                  />
                  {errors.schoolName && <span className="error-message">{errors.schoolName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">학생 연락처</label>
                  <input
                    type="tel"
                    name="studentContact"
                    value={formData.studentContact}
                    onChange={handleChange}
                    className={`form-input ${errors.studentContact ? 'input-error' : ''}`}
                    placeholder="학생 연락처를 입력하세요"
                  />
                  {errors.studentContact && <span className="error-message">{errors.studentContact}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">부모님 연락처</label>
                  <input
                    type="tel"
                    name="parentContact"
                    value={formData.parentContact}
                    onChange={handleChange}
                    className={`form-input ${errors.parentContact ? 'input-error' : ''}`}
                    placeholder="부모님 연락처를 입력하세요"
                  />
                  {errors.parentContact && <span className="error-message">{errors.parentContact}</span>}
                </div>
              </div>

              {/* 반 선택 (학생 또는 학부모인 경우에만 표시) */}
              {(formData.userType === '학생' || formData.userType === '학부모') && (
                <div className="form-row">
                  <div className="form-group" style={{ width: '100%' }}>
                    <label className="form-label">반 선택</label>
                    <div className="class-selection-summary">
                      <button
                        type="button"
                        className="btn-select-class"
                        onClick={() => setShowClassModal(true)}
                      >
                        <i className="fas fa-list"></i>
                        반 선택하기 ({formData.classIds.length}개 선택됨)
                      </button>
                      {formData.classIds.length > 0 && (
                        <div className="selected-classes">
                          {formData.classIds.map((classId) => {
                            const selectedClass = classes.find(c => c._id === classId);
                            return selectedClass ? (
                              <span key={classId} className="selected-class-badge">
                                {selectedClass.grade} {selectedClass.className}
                                <button
                                  type="button"
                                  className="remove-class-btn"
                                  onClick={() => handleClassToggle(classId)}
                                >
                                  ×
                                </button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/admin')}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '등록 중...' : '회원 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 반 선택 모달 */}
      {showClassModal && (
        <div className="modal-overlay" onClick={() => setShowClassModal(false)}>
          <div className="modal-container class-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">반 선택</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowClassModal(false);
                  setClassSearchTerm('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* 검색 입력 */}
              <div className="class-search-container">
                <input
                  type="text"
                  className="class-search-input"
                  placeholder="반 이름으로 검색..."
                  value={classSearchTerm}
                  onChange={(e) => setClassSearchTerm(e.target.value)}
                />
                <i className="fas fa-search class-search-icon"></i>
              </div>

              {classesLoading ? (
                <div className="loading">반 목록을 불러오는 중...</div>
              ) : classes.length === 0 ? (
                <div style={{ color: '#999', padding: '2rem', textAlign: 'center' }}>
                  등록된 반이 없습니다.
                </div>
              ) : (() => {
                // 검색 필터링
                const filteredClasses = classes.filter((classItem) => {
                  const searchLower = classSearchTerm.toLowerCase();
                  const className = `${classItem.grade} ${classItem.className}`.toLowerCase();
                  return className.includes(searchLower);
                });

                return filteredClasses.length === 0 ? (
                  <div style={{ color: '#999', padding: '2rem', textAlign: 'center' }}>
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <div className="class-modal-list">
                    {filteredClasses.map((classItem) => (
                      <label
                        key={classItem._id}
                        className={`class-modal-item ${formData.classIds.includes(classItem._id) ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.classIds.includes(classItem._id)}
                          onChange={() => handleClassToggle(classItem._id)}
                        />
                        <span className="class-name">{classItem.grade} {classItem.className}</span>
                        {classItem.createdAt && (
                          <span className="class-date">
                            {new Date(classItem.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button
                className="btn-modal-close"
                onClick={() => setShowClassModal(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default UserRegister;

