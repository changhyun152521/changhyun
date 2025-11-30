import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './Admin.css';

function CoursesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesSearch, setCoursesSearch] = useState('');
  const [coursesPage, setCoursesPage] = useState(1);
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
        fetchCourses();
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
      fetchCourses();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await api.get('/courses');
      if (response.data.success) {
        setCourses(response.data.data || []);
      } else {
        console.error('강좌 목록 가져오기 실패:', response.data);
        alert(response.data.error || '강좌 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('강좌 목록 가져오기 오류:', error);
      let errorMessage = '강좌 목록을 불러오는 중 오류가 발생했습니다.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`정말로 "${courseName}" 강좌를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await api.delete(`/courses/${courseId}`);
      if (response.data.success) {
        alert('강좌가 성공적으로 삭제되었습니다.');
        fetchCourses();
      } else {
        alert(response.data.error || '강좌 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('강좌 삭제 오류:', error);
      let errorMessage = '강좌 삭제 중 오류가 발생했습니다.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      }
      alert(errorMessage);
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
  const filteredCourses = courses.filter(course => {
    const searchLower = coursesSearch.toLowerCase();
    return (
      course.courseName?.toLowerCase().includes(searchLower) ||
      course.instructorName?.toLowerCase().includes(searchLower) ||
      course.grade?.toLowerCase().includes(searchLower)
    );
  });

  // 생성일 기준 최신순 정렬 (백엔드 정렬이 제대로 적용되지 않을 경우를 대비)
  filteredCourses.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // 내림차순 (최신순)
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const startIndex = (coursesPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-container">
        <div className="admin-content">
          <div className="page-header">
            <h1 className="page-title">전체 강좌 목록 및 관리</h1>
            <button
              className="btn-back"
              onClick={() => navigate('/admin')}
            >
              목록으로
            </button>
          </div>

          <div className="courses-section">
            {coursesLoading ? (
              <div className="loading">강좌 목록을 불러오는 중...</div>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <p>등록된 강좌가 없습니다.</p>
                <button 
                  className="btn-add-course"
                  onClick={() => navigate('/admin/course/register')}
                >
                  강좌 등록하기
                </button>
              </div>
            ) : (
              <>
                <div className="courses-header-actions">
                  <div className="search-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="강좌명, 강사명으로 검색..."
                      value={coursesSearch}
                      onChange={(e) => {
                        setCoursesSearch(e.target.value);
                        setCoursesPage(1);
                      }}
                    />
                    <i className="fas fa-search search-icon"></i>
                  </div>
                  <button 
                    className="btn-add-course"
                    onClick={() => navigate('/admin/course/register')}
                  >
                    + 강좌 등록
                  </button>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="empty-state">
                    <p>검색 결과가 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <div className="courses-table-container">
                      <table className="courses-table">
                        <thead>
                          <tr>
                            <th>강좌명</th>
                            <th>강사명</th>
                            <th>구분</th>
                            <th>강의수</th>
                            <th>교재</th>
                            <th>생성일</th>
                            <th>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedCourses.map((course) => (
                            <tr key={course._id}>
                              <td>{course.courseName}</td>
                              <td>{course.instructorName}</td>
                              <td>{course.grade}</td>
                              <td>{((course.lectures && Array.isArray(course.lectures)) ? course.lectures.length : (course.courseCount ?? 0))}강</td>
                              <td>{course.textbook || '-'}</td>
                              <td>
                                {course.createdAt 
                                  ? new Date(course.createdAt).toLocaleDateString('ko-KR', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                    })
                                  : '-'}
                              </td>
                              <td>
                                <div className="management-buttons">
                                  <button 
                                    className="btn-edit-course"
                                    onClick={() => {
                                      navigate(`/admin/course/edit/${course._id}`);
                                    }}
                                  >
                                    정보수정
                                  </button>
                                  <button 
                                    className="btn-delete-course"
                                    onClick={() => {
                                      handleDeleteCourse(course._id, course.courseName);
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
                          onClick={() => setCoursesPage(prev => Math.max(1, prev - 1))}
                          disabled={coursesPage === 1}
                        >
                          이전
                        </button>
                        <span className="pagination-info">
                          {coursesPage} / {totalPages}
                        </span>
                        <button
                          className="pagination-btn"
                          onClick={() => setCoursesPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={coursesPage === totalPages}
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

export default CoursesList;

