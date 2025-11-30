import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './PreviewCourseRegister.css';

function PreviewCourseRegister() {
  const navigate = useNavigate();
  const { previewCourseId } = useParams();
  const isEditMode = !!previewCourseId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    videoLink: '',
  });
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [videoId, setVideoId] = useState(null);

  useEffect(() => {
    // 관리자 권한 확인
    const checkAdminStatus = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const user = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !user) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return false;
      }

      try {
        const userData = JSON.parse(user);
        if (userData.isAdmin !== true) {
          alert('관리자 권한이 필요합니다.');
          navigate('/');
          return false;
        }
        setIsAdmin(true);
        return true;
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        alert('사용자 정보를 확인할 수 없습니다.');
        navigate('/');
        return false;
      }
    };

    if (!checkAdminStatus()) {
      return;
    }

    // 수정 모드인 경우 기존 데이터 로드
    if (isEditMode) {
      fetchPreviewCourse();
    }
  }, [navigate, isEditMode, previewCourseId]);

  // YouTube URL에서 비디오 ID 추출
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 유튜브 링크 변경 시 썸네일 업데이트
  useEffect(() => {
    const extractedVideoId = getYouTubeVideoId(formData.videoLink);
    if (extractedVideoId) {
      setVideoId(extractedVideoId);
      setThumbnailUrl(`https://img.youtube.com/vi/${extractedVideoId}/maxresdefault.jpg`);
    } else {
      setVideoId(null);
      setThumbnailUrl(null);
    }
  }, [formData.videoLink]);

  const fetchPreviewCourse = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/preview-courses/${previewCourseId}`);
      
      if (response.data.success) {
        const course = response.data.data;
        setFormData({
          title: course.title || '',
          videoLink: course.videoLink || '',
        });
      } else {
        setError(response.data.error || '맛보기강좌 정보를 불러오는 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('맛보기강좌 조회 오류:', error);
      if (error.response) {
        if (error.response.status === 404) {
          setError('맛보기강좌를 찾을 수 없습니다.');
        } else {
          setError(error.response.data?.error || '맛보기강좌 정보를 불러오는 중 오류가 발생했습니다');
        }
      } else {
        setError('서버에 연결할 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 유효성 검증
    if (!formData.title || !formData.title.trim()) {
      setError('강의 제목을 입력해주세요.');
      return;
    }

    if (!formData.videoLink || !formData.videoLink.trim()) {
      setError('유튜브 링크를 입력해주세요.');
      return;
    }

    // YouTube 링크 유효성 검증
    const extractedVideoId = getYouTubeVideoId(formData.videoLink);
    if (!extractedVideoId) {
      setError('올바른 YouTube 링크 형식이 아닙니다.');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditMode) {
        // 수정
        const response = await api.put(`/preview-courses/${previewCourseId}`, {
          title: formData.title.trim(),
          videoLink: formData.videoLink.trim(),
        });

        if (response.data.success) {
          alert('맛보기강좌가 성공적으로 수정되었습니다.');
          navigate('/admin');
        } else {
          setError(response.data.error || '맛보기강좌 수정 중 오류가 발생했습니다');
        }
      } else {
        // 등록
        const response = await api.post('/preview-courses', {
          title: formData.title.trim(),
          videoLink: formData.videoLink.trim(),
        });

        if (response.data.success) {
          alert('맛보기강좌가 성공적으로 등록되었습니다.');
          navigate('/admin');
        } else {
          setError(response.data.error || '맛보기강좌 등록 중 오류가 발생했습니다');
        }
      }
    } catch (error) {
      console.error('맛보기강좌 저장 오류:', error);
      if (error.response) {
        setError(error.response.data?.error || '맛보기강좌 저장 중 오류가 발생했습니다');
      } else {
        setError('서버에 연결할 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading && isEditMode) {
    return (
      <div className="preview-course-register-page">
        <Header />
        <div className="preview-course-register-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="preview-course-register-page">
      <Header />
      <div className="preview-course-register-container">
        <div className="preview-course-register-content">
          <div className="page-header">
            <h1 className="page-title">
              {isEditMode ? '맛보기강좌 수정' : '맛보기강좌 등록'}
            </h1>
            <p className="page-description">
              맛보기강좌의 제목과 유튜브 링크를 입력해주세요.
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="preview-course-form">
            <div className="form-section">
              <label className="form-label">
                <span className="label-text">강의 제목 *</span>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="예: 중1 수학 기초 강의"
                  required
                />
              </label>
            </div>

            <div className="form-section">
              <label className="form-label">
                <span className="label-text">유튜브 링크 *</span>
                <input
                  type="url"
                  name="videoLink"
                  value={formData.videoLink}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <small className="form-hint">
                  YouTube 영상 링크를 입력하시면 썸네일이 자동으로 표시됩니다.
                </small>
              </label>
            </div>

            {/* 썸네일 미리보기 */}
            {thumbnailUrl && (
              <div className="thumbnail-preview-section">
                <h3 className="preview-title">썸네일 미리보기</h3>
                <div className="thumbnail-preview">
                  <img 
                    src={thumbnailUrl} 
                    alt="YouTube 썸네일"
                    className="thumbnail-image"
                    onError={(e) => {
                      // maxresdefault가 없으면 hqdefault 사용
                      if (videoId) {
                        e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }
                    }}
                  />
                  <div className="thumbnail-overlay">
                    <i className="fas fa-play-circle"></i>
                  </div>
                </div>
                {videoId && (
                  <p className="video-id-hint">
                    비디오 ID: {videoId}
                  </p>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/admin')}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PreviewCourseRegister;

