import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './PreviewCourseDetail.css';

function PreviewCourseDetail() {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const location = useLocation();
  const [videoLink, setVideoLink] = useState(null);

  useEffect(() => {
    // location state에서 videoLink를 가져옴
    if (location.state && location.state.videoLink) {
      setVideoLink(location.state.videoLink);
    } else if (videoId) {
      // videoId만 있는 경우 YouTube URL 생성
      setVideoLink(`https://www.youtube.com/watch?v=${videoId}`);
    }
  }, [videoId, location.state]);

  return (
    <div className="preview-course-detail-page">
      <Header />
      <div className="preview-course-detail-container">
        <div className="preview-course-detail-content">
          <div className="video-header">
            <button 
              className="btn-back"
              onClick={() => navigate('/preview-courses')}
            >
              목록으로 돌아가기
            </button>
          </div>

          {videoId ? (
            <div className="video-player-wrapper">
              <div className="video-iframe-container">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                ></iframe>
              </div>
            </div>
          ) : (
            <div className="error-message">
              <p>영상을 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PreviewCourseDetail;

