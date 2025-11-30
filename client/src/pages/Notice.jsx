import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './Notice.css';

function Notice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    checkAdminAndFetchNotices();
  }, [currentPage]);

  useEffect(() => {
    // 검색 시 첫 페이지로 리셋
    if (searchQuery !== '') {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const checkAdminAndFetchNotices = async () => {
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

      // 공지사항 목록 가져오기 (페이지네이션)
      const response = await api.get(`/notices?page=${currentPage}&limit=5`);
      if (response.data.success) {
        setNotices(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);
      }
    } catch (error) {
      console.error('공지사항 가져오기 오류:', error);
      setError('공지사항을 불러오는 중 오류가 발생했습니다.');
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

  const handleNoticeClick = (noticeId, e) => {
    // 작성 버튼 클릭이 아닌 경우에만 상세 페이지로 이동
    if (e && e.target.closest('.btn-create-notice')) {
      return;
    }
    navigate(`/community/notice/${noticeId}`);
  };

  // 검색 필터링 (클라이언트 측 필터링은 유지하되, 서버 페이지네이션과 함께 사용)
  const filteredNotices = notices.filter(notice => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      notice.title?.toLowerCase().includes(query) ||
      notice.authorName?.toLowerCase().includes(query) ||
      notice.content?.toLowerCase().includes(query)
    );
  });

  // 페이지네이션 계산
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="notice-page">
        <Header />
        <div className="notice-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="notice-page">
      <Header />
      <div className="notice-container">
        <div className="notice-content">
          <div className="page-header-section">
            <div className="title-section" style={{ marginBottom: '35px', marginTop: '20px' }}>
              <i className="fas fa-bullhorn title-icon" style={{ marginBottom: '8px' }}></i>
              <h1 className="page-title">공지사항</h1>
            </div>
          </div>
          <div className="header-actions">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="제목, 작성자, 내용으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="fas fa-search search-icon"></i>
            </div>
            {isAdmin && (
              <button
                className="btn-create-notice"
                onClick={() => navigate('/community/notice/create')}
              >
                <i className="fas fa-plus"></i>
                공지사항 작성
              </button>
            )}
          </div>

          {error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-inbox"></i>
              </div>
              <h2>{searchQuery ? '검색 결과가 없습니다' : '등록된 공지사항이 없습니다'}</h2>
              <p>{searchQuery ? '다른 검색어를 시도해보세요.' : '공지사항이 등록되면 여기에 표시됩니다.'}</p>
            </div>
          ) : (
            <>
              <div className="notice-section">
                <table className="notice-table">
                  <thead>
                    <tr>
                      <th>일시</th>
                      <th>제목</th>
                      <th>작성자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotices.map((notice) => (
                      <tr
                        key={notice._id}
                        className="notice-row"
                        onClick={(e) => handleNoticeClick(notice._id, e)}
                      >
                        <td className="notice-date">{formatDate(notice.createdAt)}</td>
                        <td className="notice-title">{notice.title}</td>
                        <td className="notice-author">{notice.authorName || notice.author?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                    이전
                  </button>
                  
                  <div className="pagination-numbers">
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Notice;

