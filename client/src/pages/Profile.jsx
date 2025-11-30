import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
    schoolName: '',
    studentContact: '',
    parentContact: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    confirmCurrentPassword: '', // 현재 비밀번호 재확인
    profileImage: '',
  });
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changePassword, setChangePassword] = useState(false); // 비밀번호 변경 체크박스

  useEffect(() => {
    // 로그인 상태 확인
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !userData) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // 폼 데이터 초기화
        setFormData({
          userId: parsedUser.userId || '',
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          schoolName: parsedUser.schoolName || '',
          studentContact: parsedUser.studentContact || '',
          parentContact: parsedUser.parentContact || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          profileImage: parsedUser.profileImage || '',
        });
        setProfileImagePreview(parsedUser.profileImage || '');
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        alert('사용자 정보를 불러올 수 없습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, [navigate]);

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

    // 기본 정보 검증
    if (!formData.userId.trim()) {
      newErrors.userId = '아이디를 입력해주세요';
    }
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else {
      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = '올바른 이메일 형식이 아닙니다';
      }
    }

    // 학습 정보 검증
    if (!formData.schoolName.trim()) {
      newErrors.schoolName = '학교명을 입력해주세요';
    }
    if (!formData.studentContact.trim()) {
      newErrors.studentContact = '학생 연락처를 입력해주세요';
    }
    if (!formData.parentContact.trim()) {
      newErrors.parentContact = '부모님 연락처를 입력해주세요';
    }

    // 비밀번호 변경 검증 (체크박스가 선택된 경우에만)
    if (changePassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = '현재 비밀번호를 입력해주세요';
      }
      if (!formData.newPassword) {
        newErrors.newPassword = '새 비밀번호를 입력해주세요';
      } else {
        const hasLetter = /[a-zA-Z]/.test(formData.newPassword);
        const hasNumber = /[0-9]/.test(formData.newPassword);
        if (!hasLetter || !hasNumber || formData.newPassword.length < 7) {
          newErrors.newPassword = '영문+숫자 7자 이상이어야 합니다';
        }
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      }
      if (!formData.confirmCurrentPassword) {
        newErrors.confirmCurrentPassword = '현재 비밀번호를 다시 입력해주세요';
      } else if (formData.currentPassword !== formData.confirmCurrentPassword) {
        newErrors.confirmCurrentPassword = '현재 비밀번호가 일치하지 않습니다';
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
        email: formData.email.trim(),
        schoolName: formData.schoolName.trim(),
        studentContact: formData.studentContact.trim(),
        parentContact: formData.parentContact.trim(),
      };

      // 강사회원인 경우 프로필 사진 업데이트
      if (user.userType === '강사' && formData.profileImage) {
        updateData.profileImage = formData.profileImage.trim();
      }

      // 비밀번호 변경이 있는 경우 (체크박스가 선택된 경우)
      if (changePassword && formData.newPassword) {
        // 현재 비밀번호 확인
        const verifyResponse = await api.post('/users/login', {
          userId: user.userId,
          password: formData.currentPassword,
        });

        if (!verifyResponse.data.success) {
          setErrors({ currentPassword: '현재 비밀번호가 올바르지 않습니다' });
          setIsSubmitting(false);
          return;
        }

        // 현재 비밀번호 재확인
        if (formData.currentPassword !== formData.confirmCurrentPassword) {
          setErrors({ confirmCurrentPassword: '현재 비밀번호가 일치하지 않습니다' });
          setIsSubmitting(false);
          return;
        }

        updateData.password = formData.newPassword;
      }

      // 사용자 정보 업데이트
      const response = await api.put(`/users/${user._id}`, updateData);

      if (response.data.success) {
        // 업데이트된 사용자 정보로 상태 업데이트
        const updatedUser = response.data.data;
        setUser(updatedUser);
        
        // localStorage와 sessionStorage 업데이트
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        if (sessionStorage.getItem('user')) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // 폼 데이터 초기화
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          confirmCurrentPassword: '',
        }));
        setChangePassword(false);

        setIsEditing(false);
        alert('정보가 성공적으로 수정되었습니다.');
      } else {
        alert(response.data.error || '정보 수정 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('정보 수정 오류:', error);
      let errorMessage = '정보 수정 중 오류가 발생했습니다';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // 원래 사용자 정보로 복원
    setFormData({
      userId: user.userId || '',
      name: user.name || '',
      email: user.email || '',
      schoolName: user.schoolName || '',
      studentContact: user.studentContact || '',
      parentContact: user.parentContact || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      profileImage: user.profileImage || '',
    });
    setProfileImagePreview(user.profileImage || '');
    setChangePassword(false);
    setErrors({});
    setIsEditing(false);
  };

  // Cloudinary 위젯 열기
  const openCloudinaryWidget = () => {
    // Cloudinary 설정
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'drdqg5pc0';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mathchang';
    
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFileSize: 5000000, // 5MB
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        folder: 'mathchang/profiles', // 업로드 폴더 설정
        cropping: true, // 크롭 기능 활성화
        croppingAspectRatio: 1, // 정사각형 비율 (1:1)
        croppingDefaultSelectionRatio: 0.9,
        croppingShowDimensions: true,
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#0078FF',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#0078FF',
            action: '#FF620C',
            inactiveTabIcon: '#0E2F5A',
            error: '#F44235',
            inProgress: '#0078FF',
            complete: '#20B832',
            sourceBg: '#E4EBF1',
          },
          fonts: {
            default: null,
            "'Poppins', sans-serif": {
              url: 'https://fonts.googleapis.com/css?family=Poppins',
              active: true,
            },
          },
        },
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url;
          setFormData((prev) => ({
            ...prev,
            profileImage: imageUrl,
          }));
          setProfileImagePreview(imageUrl);
        }
      }
    );

    widget.open();
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        <div className="profile-content">
          <h1 className="profile-title">내정보</h1>
          
          {!isEditing ? (
            // 일반 보기 모드
            <>
              <div className="profile-info">
                {/* 강사회원 프로필 사진 표시 */}
                {user.userType === '강사' && (
                  <div className="profile-image-section">
                    <div className="profile-image-container">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt="프로필 사진" 
                          className="profile-image"
                        />
                      ) : (
                        <div className="profile-image-placeholder">
                          <i className="fas fa-user"></i>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="info-section">
                  <h2>기본 정보</h2>
                  <div className="info-item">
                    <span className="info-label">아이디</span>
                    <span className="info-value">{user.userId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">이름</span>
                    <span className="info-value">{user.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">이메일</span>
                    <span className="info-value">{user.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">사용자 유형</span>
                    <span className="info-value">{user.userType}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h2>학습 정보</h2>
                  <div className="info-item">
                    <span className="info-label">학교명</span>
                    <span className="info-value">{user.schoolName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">학생 연락처</span>
                    <span className="info-value">{user.studentContact}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">부모님 연락처</span>
                    <span className="info-value">{user.parentContact}</span>
                  </div>
                </div>

                {user.isAdmin && (
                  <div className="info-section">
                    <h2>권한 정보</h2>
                    <div className="info-item">
                      <span className="info-label">관리자 권한</span>
                      <span className="info-value admin-badge">관리자</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                <button 
                  className="btn-edit"
                  onClick={() => setIsEditing(true)}
                >
                  정보 수정
                </button>
                <button 
                  className="btn-back"
                  onClick={() => navigate('/')}
                >
                  홈으로
                </button>
              </div>
            </>
          ) : (
            // 수정 모드
            <form onSubmit={handleSubmit} className="profile-edit-form">
              <div className="profile-info">
                {/* 강사회원 프로필 사진 업로드 */}
                {user.userType === '강사' && (
                  <div className="profile-image-section">
                    <h2>프로필 사진</h2>
                    <div className="profile-image-upload">
                      <div className="profile-image-preview-container">
                        {profileImagePreview ? (
                          <div className="profile-image-preview-wrapper">
                            <img 
                              src={profileImagePreview} 
                              alt="프로필 사진 미리보기" 
                              className="profile-image-preview"
                            />
                            <button
                              type="button"
                              className="btn-remove-image"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, profileImage: '' }));
                                setProfileImagePreview('');
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : formData.profileImage ? (
                          <div className="profile-image-preview-wrapper">
                            <img 
                              src={formData.profileImage} 
                              alt="프로필 사진" 
                              className="profile-image-preview"
                            />
                            <button
                              type="button"
                              className="btn-remove-image"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, profileImage: '' }));
                                setProfileImagePreview('');
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="profile-image-placeholder">
                            <i className="fas fa-user"></i>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-upload-image"
                        onClick={openCloudinaryWidget}
                      >
                        <i className="fas fa-camera"></i> 프로필 사진 업로드
                      </button>
                      <p className="image-upload-hint">정사각형 모양의 사진을 권장합니다.</p>
                    </div>
                  </div>
                )}
                <div className="info-section">
                  <h2>기본 정보</h2>
                  <div className="form-group">
                    <label className="form-label">아이디</label>
                    <input
                      type="text"
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      className={`form-input ${errors.userId ? 'input-error' : ''}`}
                    />
                    {errors.userId && <span className="error-message">{errors.userId}</span>}
                  </div>
                  <div className="info-item">
                    <span className="info-label">이름</span>
                    <span className="info-value">{user.name}</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">이메일</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  <div className="info-item">
                    <span className="info-label">사용자 유형</span>
                    <span className="info-value">{user.userType}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h2>학습 정보</h2>
                  <div className="form-group">
                    <label className="form-label">학교명</label>
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      className={`form-input ${errors.schoolName ? 'input-error' : ''}`}
                    />
                    {errors.schoolName && <span className="error-message">{errors.schoolName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">학생 연락처</label>
                    <input
                      type="tel"
                      name="studentContact"
                      value={formData.studentContact}
                      onChange={handleChange}
                      className={`form-input ${errors.studentContact ? 'input-error' : ''}`}
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
                    />
                    {errors.parentContact && <span className="error-message">{errors.parentContact}</span>}
                  </div>
                </div>

                <div className="info-section">
                  <h2>비밀번호 변경</h2>
                  <div className="form-group">
                    <button
                      type="button"
                      className={`password-change-button ${changePassword ? 'active' : ''}`}
                      onClick={() => {
                        if (changePassword) {
                          // 버튼 비활성화 시 비밀번호 필드 초기화
                          setChangePassword(false);
                            setFormData((prev) => ({
                              ...prev,
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: '',
                            confirmCurrentPassword: '',
                            }));
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.currentPassword;
                              delete newErrors.newPassword;
                              delete newErrors.confirmPassword;
                            delete newErrors.confirmCurrentPassword;
                              return newErrors;
                            });
                        } else {
                          setChangePassword(true);
                          }
                        }}
                    >
                      <i className={`fas ${changePassword ? 'fa-lock-open' : 'fa-lock'}`}></i>
                      {changePassword ? '비밀번호 변경 취소' : '비밀번호 변경하기'}
                    </button>
                  </div>
                  {changePassword && (
                    <>
                      <div className="form-group">
                        <label className="form-label">현재 비밀번호</label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          placeholder="현재 비밀번호를 입력하세요"
                          className={`form-input ${errors.currentPassword ? 'input-error' : ''}`}
                        />
                        {errors.currentPassword && <span className="error-message">{errors.currentPassword}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">현재 비밀번호 재확인</label>
                        <input
                          type="password"
                          name="confirmCurrentPassword"
                          value={formData.confirmCurrentPassword}
                          onChange={handleChange}
                          placeholder="현재 비밀번호를 다시 입력하세요"
                          className={`form-input ${errors.confirmCurrentPassword ? 'input-error' : ''}`}
                        />
                        {errors.confirmCurrentPassword && <span className="error-message">{errors.confirmCurrentPassword}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">새 비밀번호</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="영문+숫자 7자 이상"
                          className={`form-input ${errors.newPassword ? 'input-error' : ''}`}
                        />
                        {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">새 비밀번호 확인</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="새 비밀번호를 다시 입력하세요"
                          className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="profile-actions">
                <button 
                  type="submit"
                  className="btn-save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '저장 중...' : '저장하기'}
                </button>
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;

