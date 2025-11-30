import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import './YouTube.css';

function YouTube() {
  const navigate = useNavigate();
  const cardsRef = useRef([]);
  const [previewCourses, setPreviewCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // YouTube URL에서 비디오 ID 추출
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 맛보기강좌 목록 가져오기
  useEffect(() => {
    const fetchPreviewCourses = async () => {
      try {
        setLoading(true);
        const response = await api.get('/preview-courses');
        
        if (response.data.success) {
          // 최대 4개만 표시
          const courses = response.data.data || [];
          setPreviewCourses(courses.slice(0, 4));
        }
      } catch (error) {
        console.error('맛보기강좌 조회 오류:', error);
        // 오류 발생 시 빈 배열로 설정 (기본 동작 유지)
        setPreviewCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewCourses();
  }, []);

  const handleVideoClick = (videoLink) => {
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

  const headerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    // previewCourses가 변경될 때마다 카드 관찰
    cardsRef.current.forEach((ref, index) => {
      if (ref) {
        setTimeout(() => {
          observer.observe(ref);
        }, index * 100);
      }
    });

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current);
      }
      cardsRef.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [previewCourses]); // previewCourses가 변경될 때마다 실행

  return (
    <section id="youtube" className="youtube-section">
      <div className="container">
        <div className="youtube-header" ref={headerRef}>
          <div className="youtube-icon">
            <i className="fab fa-youtube"></i>
          </div>
          <h2 className="section-title">맛보기 영상</h2>
          <p className="section-description">
            수학 강의 영상을 먼저 확인해보세요
          </p>
        </div>
        <div className="youtube-grid">
          {loading ? (
            <div className="youtube-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>로딩 중...</p>
            </div>
          ) : previewCourses.length === 0 ? (
            <div className="youtube-empty">
              <i className="fas fa-video"></i>
              <p>등록된 맛보기강좌가 없습니다.</p>
            </div>
          ) : (
            previewCourses.map((course, index) => {
              const videoId = getYouTubeVideoId(course.videoLink);
              const thumbnailUrl = videoId 
                ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                : '/placeholder-image.png';
              
              return (
                <div 
                  key={course._id || index} 
                  className="youtube-card"
                  ref={(el) => {
                    if (el) {
                      cardsRef.current[index] = el;
                    }
                  }}
                  onClick={() => handleVideoClick(course.videoLink)}
                >
                  <div className="youtube-thumbnail">
                    <img 
                      src={thumbnailUrl} 
                      alt={course.title}
                      onError={(e) => {
                        if (videoId) {
                          e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        } else {
                          e.target.src = '/placeholder-image.png';
                        }
                      }}
                    />
                    <div className="youtube-overlay">
                      <div className="youtube-play-btn">
                        <i className="fas fa-play"></i>
                      </div>
                    </div>
                    <div className="youtube-duration">영상 보기</div>
                  </div>
                  <div className="youtube-info">
                    <h3 className="youtube-title">{course.title}</h3>
                    <button className="youtube-btn" onClick={(e) => {
                      e.stopPropagation();
                      handleVideoClick(course.videoLink);
                    }}>
                      <span>영상 시청하기</span>
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
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
    </section>
  );
}

export default YouTube;


