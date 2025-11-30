import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './NoticeDetail.css';

function NoticeDetail() {
  const navigate = useNavigate();
  const { noticeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminAndFetchNotice();
  }, [noticeId]);

  // 빈 태그 제거
  useEffect(() => {
    if (!notice) return;
    
    const removeEmptyTags = () => {
      const noticeContent = document.querySelector('.notice-content');
      if (!noticeContent) return;

      // 빈 태그들 찾기 및 제거
      const emptyTags = noticeContent.querySelectorAll('p, font, span, div');
      emptyTags.forEach(tag => {
        const textContent = tag.textContent?.trim() || '';
        const innerHTML = tag.innerHTML?.trim() || '';
        
        // 빈 태그이거나 <br>만 있는 경우 제거
        const isEmpty = !textContent || 
          innerHTML === '<br>' || 
          innerHTML === '<br/>' || 
          innerHTML === '<br />' ||
          innerHTML === '<font size="1"><br></font>' ||
          innerHTML === '<font size="1"><br/></font>' ||
          innerHTML.match(/^<font[^>]*><br[^>]*><\/font>$/i) ||
          innerHTML.match(/^<p[^>]*><font[^>]*><br[^>]*><\/font><\/p>$/i) ||
          innerHTML.match(/^<p[^>]*><br[^>]*><\/p>$/i) ||
          innerHTML.match(/^<p[^>]*>\s*<font[^>]*>\s*<br[^>]*>\s*<\/font>\s*<\/p>$/i);
        
        if (isEmpty) {
          // 이미지나 표가 포함되어 있지 않은 경우에만 제거
          if (!tag.querySelector('img, table, .image-wrapper, .table-wrapper, iframe, video')) {
            tag.remove();
          }
        }
      });
    };

    // DOM이 업데이트된 후 실행
    const timer = setTimeout(removeEmptyTags, 100);
    return () => clearTimeout(timer);
  }, [notice]);

  const checkAdminAndFetchNotice = async () => {
    try {
      // 관리자 권한 확인
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setIsAdmin(userData.isAdmin === true);
        } catch (error) {
          console.error('사용자 데이터 파싱 오류:', error);
        }
      }

      // 공지사항 상세 정보 가져오기
      const response = await api.get(`/notices/${noticeId}`);
      if (response.data.success) {
        setNotice(response.data.data);
      } else {
        setError(response.data.error || '공지사항을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('공지사항 가져오기 오류:', error);
      if (error.response?.status === 404) {
        setError('공지사항을 찾을 수 없습니다.');
      } else {
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await api.delete(`/notices/${noticeId}`);
      if (response.data.success) {
        alert('공지사항이 삭제되었습니다.');
        navigate('/community/notice');
      } else {
        alert(response.data.error || '공지사항 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지사항 삭제 오류:', error);
      alert(error.response?.data?.error || '공지사항 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleFileDownload = (e, fileUrl, fileName) => {
    e.preventDefault();
    
    if (window.confirm(`"${fileName}" 파일을 다운로드하시겠습니까?`)) {
      // 새 창에서 파일 다운로드
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="notice-detail-page">
        <Header />
        <div className="notice-detail-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="notice-detail-page">
        <Header />
        <div className="notice-detail-container">
          <div className="error-message">
            <p>{error || '공지사항을 찾을 수 없습니다.'}</p>
            <button
              className="btn-back"
              onClick={() => navigate('/community/notice')}
            >
              목록으로
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="notice-detail-page">
      <Header />
      <div className="notice-detail-container">
        <div className="notice-detail-content">
          {isAdmin && (
            <div className="page-header">
              <div className="admin-actions">
                <button
                  className="btn-edit"
                  onClick={() => navigate(`/community/notice/edit/${noticeId}`)}
                >
                  <i className="fas fa-edit"></i>
                  수정
                </button>
                <button
                  className="btn-delete"
                  onClick={handleDelete}
                >
                  <i className="fas fa-trash"></i>
                  삭제
                </button>
              </div>
            </div>
          )}

          <article className="notice-article">
            <header className="notice-header">
              <h1 className="notice-title">{notice.title}</h1>
              <div className="notice-meta">
                <span className="notice-author">
                  <i className="fas fa-user"></i>
                  {notice.authorName || notice.author?.name || '-'}
                </span>
                <span className="notice-date">
                  <i className="fas fa-calendar"></i>
                  {formatDate(notice.createdAt)}
                </span>
              </div>
            </header>

            <div
              className="notice-content"
              dangerouslySetInnerHTML={{ __html: notice.content }}
            />

            {/* 업로드된 파일 목록 */}
            {notice.attachments && notice.attachments.filter(att => att.type === 'file').length > 0 && (
              <div className="notice-attachments">
                <h3 className="attachments-title">
                  <i className="fas fa-paperclip"></i>
                  첨부 파일
                </h3>
                <div className="attachments-list">
                  {notice.attachments
                    .filter(att => att.type === 'file')
                    .map((file, index) => {
                      const fileName = file.originalName || file.filename || '파일';
                      return (
                        <a
                          key={index}
                          href={file.url}
                          download={fileName}
                          className="attachment-item"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => handleFileDownload(e, file.url, fileName)}
                        >
                          <i className="fas fa-file-download"></i>
                          <span className="attachment-name">{fileName}</span>
                          <i className="fas fa-external-link-alt attachment-external"></i>
                        </a>
                      );
                    })}
                </div>
              </div>
            )}
            
            <div className="notice-footer">
              <button
                className="btn-back"
                onClick={() => navigate('/community/notice')}
              >
                목록으로
              </button>
            </div>
          </article>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NoticeDetail;

