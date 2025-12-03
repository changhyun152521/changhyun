import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './PreviewCourses.css';

function PreviewCourses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [previewCourses, setPreviewCourses] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetchPreviewCourses();
  }, []);

  const fetchPreviewCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[맛보기강좌] 요청 시작: /api/preview-courses');
      
      // 인증 없이 모든 사용자가 접근 가능
      const response = await api.get('/preview-courses');
      
      console.log('[맛보기강좌] 응답 받음:', {
        status: response.status,
        success: response.data?.success,
        count: response.data?.count,
        dataLength: response.data?.data?.length,
        fullResponse: response.data
      });
      
      if (response.data && response.data.success) {
        setPreviewCourses(response.data.data || []);
        console.log('[맛보기강좌] 데이터 설정 완료:', response.data.data?.length || 0, '개');
      } else {
        const errorMsg = response.data?.error || '맛보기강좌를 불러오는 중 오류가 발생했습니다';
        console.error('[맛보기강좌] 응답 실패:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('[맛보기강좌] 조회 오류 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        hasResponse: !!error.response,
        hasRequest: !!error.request,
        config: error.config
      });
      
      if (error.response) {
        setError(error.response.data?.error || error.response.data?.message || '맛보기강좌를 불러오는 중 오류가 발생했습니다');
      } else if (error.request) {
        setError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError(error.message || '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // YouTube URL에서 비디오 ID 추출
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleCourseClick = (videoLink) => {
    const videoId = getYouTubeVideoId(videoLink);
    if (videoId) {
      setSelectedVideo(videoId);
    } else {
      alert('유효한 YouTube 영상 링크가 아닙니다.');
    }
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="preview-courses-page">
        <Header />
        <div className="preview-courses-section">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>로딩 중...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="preview-courses-page">
      <Header />
      <div className="preview-courses-section">
        <div className="container">
          <div className="page-header">
            <div className="page-header-icon">
              <img src="/008.png" alt="이창현수학" className="page-header-icon-img" />
            </div>
            <div className="page-title">
              <img src="/008 - 복사본.png" alt="맛보기강좌" className="page-title-img" />
            </div>
            <p className="page-description">이창현수학 강좌를 미리 확인해보세요</p>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {previewCourses.length === 0 ? (
            <div className="no-courses-container">
              <div className="no-courses-icon">
                <i className="fas fa-video"></i>
              </div>
              <h2>등록된 맛보기강좌가 없습니다</h2>
              <p>관리자가 등록한 맛보기강좌가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="courses-header">
                <p className="courses-count">
                  <i className="fas fa-video"></i>
                  <span>총 {previewCourses.length}개의 맛보기강좌</span>
                </p>
              </div>
              <div className="courses-grid">
                {previewCourses.map((course) => {
                  const videoId = getYouTubeVideoId(course.videoLink);
                  const thumbnailUrl = videoId 
                    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                    : '/placeholder-image.png';
                  
                  return (
                    <div 
                      key={course._id} 
                      className="course-card"
                      onClick={() => handleCourseClick(course.videoLink)}
                    >
                      <div className="course-thumbnail">
                        <img 
                          src={thumbnailUrl} 
                          alt={course.title}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                          }}
                        />
                        <div className="play-overlay">
                          <i className="fas fa-play"></i>
                        </div>
                      </div>
                      <div className="course-info">
                        <div className="course-header">
                          <h3 className="course-name">{course.title}</h3>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
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

export default PreviewCourses;

