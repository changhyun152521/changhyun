import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './UserEdit.css';

function UserEdit() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
    userType: '',
    schoolName: '',
    studentContact: '',
    parentContact: '',
    password: '',
    classIds: [], // 선택된 반 ID 배열
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [linkedUsers, setLinkedUsers] = useState([]); // 현재 연동된 사용자 정보 배열 (n:m)
  const [showLinkModal, setShowLinkModal] = useState(false); // 연동 모달 표시 여부
  const [linkSearchTerm, setLinkSearchTerm] = useState(''); // 연동 검색어
  const [availableUsers, setAvailableUsers] = useState([]); // 연동 가능한 사용자 목록
  const [linkLoading, setLinkLoading] = useState(false);

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
    if (userId) {
      fetchUserData();
    }
  }, [navigate, userId]);

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

  // 사용자 데이터 가져오기
  const fetchUserData = async () => {
    setUserLoading(true);
    try {
      const response = await api.get(`/users/${userId}`);
      if (response.data.success) {
        const user = response.data.data;
        setFormData({
          userId: user.userId || '',
          name: user.name || '',
          email: user.email || '',
          userType: user.userType || '',
          schoolName: user.schoolName || '',
          studentContact: user.studentContact || '',
          parentContact: user.parentContact || '',
          password: '', // 비밀번호는 빈 값으로 시작
          classIds: user.classes ? user.classes.map(cls => cls._id) : [], // 사용자가 속한 반 ID 배열
        });
        
        // 연동 정보 가져오기
        await fetchLinkedUsers(user);
      } else {
        alert('사용자 정보를 불러올 수 없습니다.');
        navigate('/admin');
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 오류:', error);
      alert('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      navigate('/admin');
    } finally {
      setUserLoading(false);
    }
  };

  // 연동 정보 가져오기 (n:m 구조)
  const fetchLinkedUsers = async (user) => {
    try {
      // 전체 사용자 목록에서 연동 정보 확인
      const allUsersResponse = await api.get('/users');
      if (allUsersResponse.data.success) {
        const currentUser = allUsersResponse.data.data.find(u => u._id === userId);
        if (currentUser && currentUser.linkedUsers && currentUser.linkedUsers.length > 0) {
          setLinkedUsers(currentUser.linkedUsers);
        } else {
          setLinkedUsers([]);
        }
      }
    } catch (error) {
      console.error('연동 정보 가져오기 오류:', error);
      setLinkedUsers([]);
    }
  };

  // 연동 가능한 사용자 목록 가져오기 (n:m 구조)
  const fetchAvailableUsers = async () => {
    try {
      setLinkLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        const currentUser = response.data.data.find(u => u._id === userId);
        const currentUserType = currentUser?.userType;
        const currentLinkedUserIds = linkedUsers.map(lu => lu._id);
        
        // 현재 사용자와 반대 타입의 사용자만 필터링 (이미 연동되지 않은 사용자)
        const available = response.data.data.filter(u => {
          // 자기 자신 제외
          if (u._id === userId) return false;
          
          // 반대 타입만 필터링
          if (currentUserType === '학생' && u.userType !== '학부모') return false;
          if (currentUserType === '학부모' && u.userType !== '학생') return false;
          
          // 이미 연동된 사용자 제외
          if (currentLinkedUserIds.includes(u._id)) return false;
          
          return true;
        });
        
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error('연동 가능한 사용자 목록 가져오기 오류:', error);
      alert('연동 가능한 사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLinkLoading(false);
    }
  };

  // 연동 모달 열기
  const handleOpenLinkModal = () => {
    setLinkSearchTerm('');
    fetchAvailableUsers();
    setShowLinkModal(true);
  };

  // 연동하기 (n:m 구조)
  const handleLinkUser = async (targetUserId) => {
    try {
      setLinkLoading(true);
      const parentId = formData.userType === '학부모' ? userId : targetUserId;
      const studentId = formData.userType === '학생' ? userId : targetUserId;
      
      const response = await api.post('/parent-student-links', {
        parentId,
        studentId,
      });
      
      if (response.data.success) {
        alert('연동이 완료되었습니다.');
        setShowLinkModal(false);
        await fetchUserData(); // 연동 정보 다시 가져오기
      } else {
        alert(response.data.error || '연동 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('연동 오류:', error);
      const errorMessage = error.response?.data?.error || '연동 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setLinkLoading(false);
    }
  };

  // 연동 해지 (n:m 구조)
  const handleUnlinkUser = async (linkId, linkedUserName) => {
    if (!window.confirm(`"${linkedUserName}"와의 연동을 해지하시겠습니까?`)) {
      return;
    }

    try {
      const response = await api.delete(`/parent-student-links/${linkId}`);
      
      if (response.data.success) {
        alert('연동이 해지되었습니다.');
        await fetchUserData(); // 연동 정보 다시 가져오기
      } else {
        alert(response.data.error || '연동 해지 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('연동 해지 오류:', error);
      alert('연동 해지 중 오류가 발생했습니다.');
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

    // 사용자 유형 검증
    if (!formData.userType) {
      newErrors.userType = '사용자 유형을 선택해주세요';
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

    // 비밀번호 검증 (입력된 경우에만)
    if (formData.password) {
      const hasLetter = /[a-zA-Z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      if (!hasLetter || !hasNumber || formData.password.length < 7) {
        newErrors.password = '영문+숫자 7자 이상이어야 합니다';
      }
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
      const updateData = {
        userId: formData.userId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        userType: formData.userType,
        schoolName: formData.schoolName.trim(),
        studentContact: formData.studentContact.trim(),
        parentContact: formData.parentContact.trim(),
        classIds: (formData.userType === '학생' || formData.userType === '학부모') ? formData.classIds : [],
      };

      // 비밀번호가 입력된 경우에만 포함
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      const response = await api.put(`/users/${userId}`, updateData);

      if (response.data.success) {
        alert('사용자 정보가 성공적으로 수정되었습니다!');
        navigate('/admin');
      } else {
        alert(response.data.error || '사용자 정보 수정 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('사용자 정보 수정 오류:', error);
      let errorMessage = '사용자 정보 수정 중 오류가 발생했습니다';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="user-edit-page">
        <Header />
        <div className="user-edit-container">
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
    <div className="user-edit-page">
      <Header />
      <div className="user-edit-container">
        <div className="user-edit-content">
          <h1 className="user-edit-title">사용자 정보 수정</h1>

          <form onSubmit={handleSubmit} className="user-edit-form">
            {/* 기본 정보 */}
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
              </div>

              <div className="form-row">
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

                <div className="form-group">
                  <label className="form-label">사용자 유형</label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className={`form-input form-select ${errors.userType ? 'input-error' : ''}`}
                  >
                    <option value="">사용자 유형을 선택하세요</option>
                    <option value="학생">학생</option>
                    <option value="학부모">학부모</option>
                    <option value="강사">강사</option>
                  </select>
                  {errors.userType && <span className="error-message">{errors.userType}</span>}
                </div>
              </div>
            </div>

            {/* 학습 정보 */}
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

              {/* 연동 정보 (학생 또는 학부모인 경우에만 표시) - n:m 구조 */}
              {(formData.userType === '학생' || formData.userType === '학부모') && (
                <div className="form-row">
                  <div className="form-group" style={{ width: '100%' }}>
                    <label className="form-label">연동 정보</label>
                    <div className="link-user-section">
                      {linkedUsers && linkedUsers.length > 0 ? (
                        <div className="linked-users-list">
                          {linkedUsers.map((linkedUser, idx) => (
                            <div key={linkedUser._id || idx} className="linked-user-display">
                          <div className="linked-user-info">
                            <i className={`fas ${formData.userType === '학생' ? 'fa-user-friends' : 'fa-user-graduate'}`}></i>
                            <span className="linked-user-name">
                              {linkedUser.name} ({linkedUser.userId})
                            </span>
                            <span className="linked-user-type">{linkedUser.userType}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-unlink-user"
                                onClick={() => handleUnlinkUser(linkedUser.linkId, linkedUser.name)}
                          >
                            <i className="fas fa-unlink"></i>
                            연동 해지
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn-link-user"
                            onClick={handleOpenLinkModal}
                          >
                            <i className="fas fa-link"></i>
                            연동 추가
                          </button>
                        </div>
                      ) : (
                        <div className="no-linked-user-display">
                          <span className="no-linked-text">연동된 사용자가 없습니다.</span>
                          <button
                            type="button"
                            className="btn-link-user"
                            onClick={handleOpenLinkModal}
                          >
                            <i className="fas fa-link"></i>
                            연동하기
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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

            {/* 비밀번호 변경 */}
            <div className="form-section">
              <h2 className="section-title">비밀번호 변경</h2>
              <p className="section-description">비밀번호를 변경하려면 새 비밀번호를 입력하세요. 변경하지 않으려면 비워두세요.</p>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">새 비밀번호</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="영문+숫자 7자 이상 (변경하지 않으려면 비워두세요)"
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>
              </div>
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
                {isSubmitting ? '수정 중...' : '수정 완료'}
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
                <div className="loading" style={{ 
                  color: '#666', 
                  padding: '3rem', 
                  textAlign: 'center',
                  fontSize: '1rem'
                }}>
                  반 목록을 불러오는 중...
                </div>
              ) : classes.length === 0 ? (
                <div style={{ 
                  color: '#999', 
                  padding: '3rem', 
                  textAlign: 'center',
                  fontSize: '0.95rem'
                }}>
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
                  <div style={{ 
                    color: '#999', 
                    padding: '3rem', 
                    textAlign: 'center',
                    fontSize: '0.95rem'
                  }}>
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
                        <div className="class-modal-item-content">
                          <span className="class-name">{classItem.grade} {classItem.className}</span>
                          {classItem.createdAt && (
                            <span className="class-date">
                              {new Date(classItem.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
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

      {/* 연동 모달 */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => {
          setShowLinkModal(false);
          setLinkSearchTerm('');
        }}>
          <div className="modal-container link-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">연동할 사용자 선택</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkSearchTerm('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* 검색 입력 */}
              <div className="modal-search">
                <input
                  type="text"
                  className="modal-search-input"
                  placeholder="사용자 이름, 아이디로 검색..."
                  value={linkSearchTerm}
                  onChange={(e) => setLinkSearchTerm(e.target.value)}
                />
                <i className="fas fa-search modal-search-icon"></i>
              </div>

              {/* 사용자 목록 */}
              <div className="modal-list">
                {linkLoading ? (
                  <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>
                    로딩 중...
                  </div>
                ) : (
                  <>
                {availableUsers
                  .filter(user => {
                    if (!linkSearchTerm) return true;
                    const searchLower = linkSearchTerm.toLowerCase();
                    return (
                      user.name?.toLowerCase().includes(searchLower) ||
                      user.userId?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((user) => (
                    <div
                      key={user._id}
                      className="modal-list-item"
                      onClick={() => handleLinkUser(user._id)}
                    >
                      <div className="modal-item-info">
                        <span className="modal-item-name">{user.name}</span>
                        <span className="modal-item-id">({user.userId})</span>
                        <span className="modal-item-type">{user.userType}</span>
                        {user.schoolName && (
                          <span className="modal-item-school">{user.schoolName}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-link-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLinkUser(user._id);
                        }}
                            disabled={linkLoading}
                      >
                        <i className="fas fa-link"></i>
                        연동
                      </button>
                    </div>
                  ))}
                {availableUsers.filter(user => {
                  if (!linkSearchTerm) return true;
                  const searchLower = linkSearchTerm.toLowerCase();
                  return (
                    user.name?.toLowerCase().includes(searchLower) ||
                    user.userId?.toLowerCase().includes(searchLower)
                  );
                    }).length === 0 && !linkLoading && (
                  <div className="modal-empty-message">
                    {linkSearchTerm ? '검색 결과가 없습니다.' : '연동 가능한 사용자가 없습니다.'}
                  </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkSearchTerm('');
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default UserEdit;

