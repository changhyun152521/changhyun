import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './Admin.css';

function PreviewCoursesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewCourses, setPreviewCourses] = useState([]);
  const [previewCoursesLoading, setPreviewCoursesLoading] = useState(false);
  const [previewCoursesSearch, setPreviewCoursesSearch] = useState('');
  const [previewCoursesPage, setPreviewCoursesPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
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
        fetchPreviewCourses();
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        alert('사용자 정보를 확인할 수 없습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchPreviewCourses();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchPreviewCourses = async () => {
    try {
      setPreviewCoursesLoading(true);
      const response = await api.get('/preview-courses');
      if (response.data.success) {
        setPreviewCourses(response.data.data || []);
      } else {
        console.error('맛보기강좌 목록 가져오기 실패:', response.data);
        alert(response.data.error || '맛보기강좌 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('맛보기강좌 목록 가져오기 오류:', error);
      let errorMessage = '맛보기강좌 목록을 불러오는 중 오류가 발생했습니다.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setPreviewCoursesLoading(false);
    }
  };

  const handleDeletePreviewCourse = async (previewCourseId, title) => {
    if (!window.confirm(`정말로 "${title}" 맛보기강좌를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await api.delete(`/preview-courses/${previewCourseId}`);
      if (response.data.success) {
        alert('맛보기강좌가 성공적으로 삭제되었습니다.');
        fetchPreviewCourses();
      } else {
        alert(response.data.error || '맛보기강좌 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('맛보기강좌 삭제 오류:', error);
      alert('맛보기강좌 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <Header />
        <div className="admin-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // 검색 필터링
  const filteredPreviewCourses = previewCourses.filter(course => {
    const searchLower = previewCoursesSearch.toLowerCase();
    return course.title?.toLowerCase().includes(searchLower);
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredPreviewCourses.length / ITEMS_PER_PAGE);
  const startIndex = (previewCoursesPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPreviewCourses = filteredPreviewCourses.slice(startIndex, endIndex);

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-container">
        <div className="admin-content">
          <div className="page-header">
            <h1 className="page-title">맛보기강좌 관리</h1>
            <button
              className="btn-back"
              onClick={() => navigate('/admin')}
            >
              목록으로
            </button>
          </div>

          <div className="preview-courses-section">
            <div className="preview-courses-header-actions">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="제목으로 검색..."
                  value={previewCoursesSearch}
                  onChange={(e) => {
                    setPreviewCoursesSearch(e.target.value);
                    setPreviewCoursesPage(1);
                  }}
                />
                <i className="fas fa-search search-icon"></i>
              </div>
              <button 
                className="btn-add-preview-course"
                onClick={() => navigate('/admin/preview-course/register')}
              >
                + 맛보기강좌 등록
              </button>
            </div>

            {previewCoursesLoading ? (
              <div className="loading">맛보기강좌 목록을 불러오는 중...</div>
            ) : previewCourses.length === 0 ? (
              <div className="empty-state">
                <p>등록된 맛보기강좌가 없습니다.</p>
                <button 
                  className="btn-add-preview-course"
                  onClick={() => navigate('/admin/preview-course/register')}
                >
                  맛보기강좌 등록하기
                </button>
              </div>
            ) : (
              <>
                {filteredPreviewCourses.length === 0 ? (
                  <div className="empty-state">
                    <p>검색 결과가 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <div className="preview-courses-table-container">
                      <table className="preview-courses-table">
                        <thead>
                          <tr>
                            <th>제목</th>
                            <th>유튜브 링크</th>
                            <th>등록일</th>
                            <th>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedPreviewCourses.map((course) => (
                            <tr key={course._id}>
                              <td>{course.title}</td>
                              <td>
                                <a 
                                  href={course.videoLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="video-link"
                                >
                                  {course.videoLink}
                                </a>
                              </td>
                              <td>{new Date(course.createdAt).toLocaleDateString('ko-KR')}</td>
                              <td>
                                <div className="management-buttons">
                                  <button 
                                    className="btn-edit-preview-course"
                                    onClick={() => {
                                      navigate(`/admin/preview-course/edit/${course._id}`);
                                    }}
                                  >
                                    정보수정
                                  </button>
                                  <button 
                                    className="btn-delete-preview-course"
                                    onClick={() => {
                                      handleDeletePreviewCourse(course._id, course.title);
                                    }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          className="pagination-btn"
                          onClick={() => setPreviewCoursesPage(prev => Math.max(1, prev - 1))}
                          disabled={previewCoursesPage === 1}
                        >
                          이전
                        </button>
                        <span className="pagination-info">
                          {previewCoursesPage} / {totalPages}
                        </span>
                        <button
                          className="pagination-btn"
                          onClick={() => setPreviewCoursesPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={previewCoursesPage === totalPages}
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PreviewCoursesList;

