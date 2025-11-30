import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './Admin.css';

function ClassesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesSearch, setClassesSearch] = useState('');
  const [classesPage, setClassesPage] = useState(1);
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
        fetchClasses();
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
      fetchClasses();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchClasses = async () => {
    try {
      setClassesLoading(true);
      const response = await api.get('/classes');
      if (response.data.success) {
        setClasses(response.data.data || []);
      } else {
        console.error('반 목록 가져오기 실패:', response.data);
        alert(response.data.error || '반 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('반 목록 가져오기 오류:', error);
      let errorMessage = '반 목록을 불러오는 중 오류가 발생했습니다.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setClassesLoading(false);
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`정말로 "${className}" 반을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await api.delete(`/classes/${classId}`);
      if (response.data.success) {
        alert('반이 성공적으로 삭제되었습니다.');
        fetchClasses();
      } else {
        alert(response.data.error || '반 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('반 삭제 오류:', error);
      alert('반 삭제 중 오류가 발생했습니다.');
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
  const filteredClasses = classes.filter(cls => {
    const searchLower = classesSearch.toLowerCase();
    return (
      cls.className?.toLowerCase().includes(searchLower) ||
      cls.grade?.toLowerCase().includes(searchLower) ||
      cls.instructorName?.toLowerCase().includes(searchLower)
    );
  });

  // 생성일 기준 최신순 정렬 (필터링 후에도 정렬 순서 유지)
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // 최신순 (내림차순)
  });

  // 페이지네이션
  const totalPages = Math.ceil(sortedClasses.length / ITEMS_PER_PAGE);
  const startIndex = (classesPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedClasses = sortedClasses.slice(startIndex, endIndex);

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-container">
        <div className="admin-content">
          <div className="page-header">
            <h1 className="page-title">반 관리</h1>
            <button
              className="btn-back"
              onClick={() => navigate('/admin')}
            >
              목록으로
            </button>
          </div>

          <div className="classes-section">
            <div className="classes-header-actions">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="반명, 구분, 강사명으로 검색..."
                  value={classesSearch}
                  onChange={(e) => {
                    setClassesSearch(e.target.value);
                    setClassesPage(1);
                  }}
                />
                <i className="fas fa-search search-icon"></i>
              </div>
              <button 
                className="btn-add-class"
                onClick={() => navigate('/admin/class/register')}
              >
                + 반 등록
              </button>
            </div>

            {classesLoading ? (
              <div className="loading">반 목록을 불러오는 중...</div>
            ) : classes.length === 0 ? (
              <div className="empty-state">
                <p>등록된 반이 없습니다.</p>
                <button 
                  className="btn-add-class"
                  onClick={() => navigate('/admin/class/register')}
                >
                  반 등록하기
                </button>
              </div>
            ) : (
              <>
                {filteredClasses.length === 0 ? (
                  <div className="empty-state">
                    <p>검색 결과가 없습니다.</p>
                  </div>
                ) : (
                  <>
                    <div className="classes-table-container">
                      <table className="classes-table">
                        <thead>
                          <tr>
                            <th>구분</th>
                            <th>반명</th>
                            <th>담당강사</th>
                            <th>학생 수</th>
                            <th>강의 수</th>
                            <th>생성일</th>
                            <th>관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedClasses.map((cls) => {
                            // 학생 회원만 카운트 (학부모 제외)
                            const studentCount = cls.students?.filter(student => 
                              (student.userType || (typeof student === 'object' ? student.userType : null)) === '학생'
                            ).length || 0;
                            
                            return (
                            <tr key={cls._id}>
                              <td>{cls.grade}</td>
                              <td>{cls.className}</td>
                              <td>{cls.instructorName || '-'}</td>
                              <td>{studentCount}명</td>
                              <td>{cls.courses?.length || 0}개</td>
                              <td>
                                {cls.createdAt 
                                  ? new Date(cls.createdAt).toLocaleDateString('ko-KR', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                    })
                                  : '-'}
                              </td>
                              <td>
                                <div className="management-buttons">
                                  <button 
                                    className="btn-edit-class"
                                    onClick={() => {
                                      navigate(`/admin/class/edit/${cls._id}`);
                                    }}
                                  >
                                    정보수정
                                  </button>
                                  <button 
                                    className="btn-manage-class"
                                    onClick={() => {
                                      navigate(`/admin/class/${cls._id}/records`);
                                    }}
                                  >
                                    교실관리
                                  </button>
                                  <button 
                                    className="btn-delete-class"
                                    onClick={() => {
                                      handleDeleteClass(cls._id, `${cls.grade} ${cls.className}`);
                                    }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          className="pagination-btn"
                          onClick={() => setClassesPage(prev => Math.max(1, prev - 1))}
                          disabled={classesPage === 1}
                        >
                          이전
                        </button>
                        <span className="pagination-info">
                          {classesPage} / {totalPages}
                        </span>
                        <button
                          className="pagination-btn"
                          onClick={() => setClassesPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={classesPage === totalPages}
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

export default ClassesList;

