import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './CourseDetail.css';

function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    // 로그인 상태 확인
    const checkAuth = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !userData) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return false;
      }

      try {
        const parsedUser = JSON.parse(userData);
        // 관리자 또는 학생만 접근 가능
        if (parsedUser.userType !== '학생' && !parsedUser.isAdmin) {
          alert('접근 권한이 없습니다.');
          navigate('/');
          return false;
        }
        return true;
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        navigate('/login');
        return false;
      }
    };

    if (checkAuth() && courseId) {
      fetchCourseDetail();
    } else {
      setLoading(false);
    }
  }, [navigate, courseId]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}`);
      
      if (response.data.success) {
        setCourse(response.data.data);
      } else {
        setError(response.data.error || '강좌 정보를 불러오는 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('강좌 상세 조회 오류:', error);
      if (error.response) {
        if (error.response.status === 401) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          navigate('/login');
        } else if (error.response.status === 404) {
          setError('강좌를 찾을 수 없습니다.');
        } else {
          setError(error.response.data?.error || '강좌 정보를 불러오는 중 오류가 발생했습니다');
        }
      } else {
        setError('서버에 연결할 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // YouTube URL에서 video ID 추출
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleVideoClick = (videoLink) => {
    if (videoLink) {
      const videoId = getYouTubeVideoId(videoLink);
      if (videoId) {
        setSelectedVideo(videoId);
      } else {
        alert('유효하지 않은 YouTube 링크입니다.');
      }
    }
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="course-detail-page">
        <Header />
        <div className="course-detail-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail-page">
        <Header />
        <div className="course-detail-container">
          <div className="error-message">
            {error || '강좌 정보를 불러올 수 없습니다.'}
          </div>
          <button 
            className="btn-back"
            onClick={() => navigate('/my-classroom/courses')}
          >
            목록으로 돌아가기
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <Header />
      <div className="course-detail-container">
        <div className="course-detail-content">
          {/* 강좌명 제목 */}
          <div className="course-title-header">
            <div className="course-title-icon">
              <i className="fas fa-book-open"></i>
            </div>
            <h1 className="course-title">{course.courseName}</h1>
          </div>
          
          {/* 상단 강좌 정보 섹션 */}
          <div className="course-header-section">
            <div className="course-header-left">
              <div className="course-thumbnail-wrapper">
                {course.instructorId?.profileImage ? (
                  <img 
                    src={course.instructorId.profileImage} 
                    alt={course.instructorName || '강사 프로필'}
                    className="course-thumbnail-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.png';
                    }}
                  />
                ) : (
                  <div className="course-thumbnail-placeholder">
                    <i className="fas fa-user"></i>
                  </div>
                )}
              </div>
            </div>
            <div className="course-header-right">
              <div className="course-badges">
                {course.courseStatus && (
                  <span className={`badge badge-status ${course.courseStatus === '완강' ? 'completed' : 'in-progress'}`}>
                    {course.courseStatus}
                  </span>
                )}
                {course.textbookType && (
                  <span className="badge badge-textbook">
                    {course.textbookType}
                  </span>
                )}
                {course.courseType && (
                  <span className="badge badge-course-type">
                    {course.courseType === '정규' ? '정규수업' : '특강'}
                  </span>
                )}
              </div>
              <div className="course-header-info">
                <div className="course-info-item">
                  <div className="info-icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <div className="info-content-wrapper">
                    <span className="info-label">강좌명</span>
                    <span className="info-value">{course.courseName}</span>
                  </div>
                </div>
                <div className="course-info-item">
                  <div className="info-icon">
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div className="info-content-wrapper">
                    <span className="info-label">강사</span>
                    <span className="info-value">{course.instructorName}</span>
                  </div>
                </div>
                <div className="course-info-item">
                  <div className="info-icon">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <div className="info-content-wrapper">
                    <span className="info-label">학년</span>
                    <span className="info-value">{course.grade}</span>
                  </div>
                </div>
                <div className="course-info-item">
                  <div className="info-icon">
                    <i className="fas fa-video"></i>
                  </div>
                  <div className="info-content-wrapper">
                    <span className="info-label">강의 수</span>
                    <span className="info-value">총 {((course.lectures && Array.isArray(course.lectures)) ? course.lectures.length : (course.courseCount ?? 0))}강</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="course-tabs">
            <button 
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              강좌정보
            </button>
            <button 
              className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              강의목차
            </button>
            <button 
              className={`tab-button ${activeTab === 'textbook' ? 'active' : ''}`}
              onClick={() => setActiveTab('textbook')}
            >
              교재정보
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="tab-content">
            {activeTab === 'info' && (
              <div className="tab-panel">
                <div className="info-card">
                    <div className="info-details">
                      <div className="info-detail-item">
                        <div className="info-icon-wrapper">
                          <i className="fas fa-book-open"></i>
                        </div>
                        <div className="info-detail-content">
                          <span className="info-detail-label">강좌 범위</span>
                          <span className="info-detail-value">{course.courseRange || `${course.grade} ${course.courseName}`}</span>
                        </div>
                      </div>
                      {course.courseDescription && (
                        <div className="info-detail-item">
                          <div className="info-icon-wrapper">
                            <i className="fas fa-lightbulb"></i>
                          </div>
                          <div className="info-detail-content">
                            <span className="info-detail-label">내용 및 특징</span>
                            <span className="info-detail-value">{course.courseDescription}</span>
                          </div>
                        </div>
                      )}
                      <div className="info-detail-item">
                        <div className="info-icon-wrapper">
                          <i className="fas fa-user-graduate"></i>
                        </div>
                        <div className="info-detail-content">
                          <span className="info-detail-label">수강 대상</span>
                          <span className="info-detail-value">{course.grade} 학생</span>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="tab-panel">
                {course.lectures && course.lectures.length > 0 ? (
                  <div className="videos-section">
                    <div className="videos-header">
                      <div className="videos-description">
                        <i className="fas fa-info-circle"></i>
                        <span>강의를 선택하시면 바로 영상을 시청하실 수 있습니다</span>
                      </div>
                    </div>
                    <div className="videos-table-container">
                      <table className="videos-table">
                        <thead>
                          <tr>
                            <th className="video-number-header">강의</th>
                            <th className="video-title-header">제목</th>
                            <th className="video-time-header">시간</th>
                            <th className="video-icon-header"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...course.lectures].sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0)).map((lecture, index) => (
                            <tr 
                              key={index} 
                              className="video-row"
                              onClick={() => lecture.videoLink && handleVideoClick(lecture.videoLink)}
                              style={{ cursor: lecture.videoLink ? 'pointer' : 'default' }}
                            >
                              <td className="video-number-cell">
                                <span className="video-number-badge">
                                  {lecture.lectureNumber ? `${lecture.lectureNumber}강` : `${index + 1}강`}
                                </span>
                              </td>
                              <td className="video-title-cell">
                                <div className="video-title-content">
                                  <span className="video-title-text">{lecture.lectureTitle}</span>
                                </div>
                              </td>
                              <td className="video-time-cell">
                                <span className="video-time-badge">
                                  {lecture.duration || '-'}
                                </span>
                              </td>
                              <td className="video-icon-cell">
                                {lecture.videoLink && (
                                  <span className="video-play-icon">
                                    <i className="fas fa-play-circle"></i>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="videos-section">
                    <div className="empty-videos">
                      <p>등록된 영상이 없습니다.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'textbook' && (
              <div className="tab-panel">
                <div className="textbook-section">
                  <div className="textbook-info-card">
                    <div className="textbook-details">
                      <div className="textbook-detail-item">
                        <div className="detail-icon-wrapper">
                          <i className="fas fa-book-open"></i>
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">교재명</span>
                          <span className="detail-value">{course.textbook}</span>
                        </div>
                      </div>
                      {course.textbookType && (
                        <div className="textbook-detail-item">
                          <div className="detail-icon-wrapper">
                            <i className="fas fa-tag"></i>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">교재 유형</span>
                            <span className="detail-value">{course.textbookType}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 뒤로가기 버튼 */}
          <div className="course-actions">
            <button 
              className="btn-back"
              onClick={() => navigate('/my-classroom/courses')}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
      <Footer />

      {/* YouTube 플레이어 모달 */}
      {selectedVideo && (
        <div className="video-player-modal" onClick={closeVideoPlayer}>
          <div className="video-player-container" onClick={(e) => e.stopPropagation()}>
            <button className="video-player-close" onClick={closeVideoPlayer}>
              ×
            </button>
            <div className="video-player-wrapper">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="video-player-iframe"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetail;

