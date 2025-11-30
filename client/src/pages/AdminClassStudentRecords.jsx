import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './Admin.css';

function AdminClassStudentRecords() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [classesSearch, setClassesSearch] = useState('');
  const [classesPage, setClassesPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !userStr) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const userData = JSON.parse(userStr);
      
      if (userData.isAdmin !== true) {
        alert('관리자 권한이 필요합니다.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      
      // 모든 반 목록 가져오기
      const response = await api.get('/classes');
      if (response.data.success) {
        // 생성일자 최신순으로 정렬
        const sortedClasses = (response.data.data || []).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // 최신순 (내림차순)
        });
        setClasses(sortedClasses);
      }
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecords = (classId) => {
    // 학생 기록 보기 페이지로 이동
    navigate(`/admin/class/${classId}/student-records`);
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

  if (error) {
    return (
      <div className="admin-page">
        <Header />
        <div className="admin-container">
          <div className="error-container">
            <p>{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-container">
        <div className="admin-content">
          <div className="page-header">
            <button
              className="btn-back"
              onClick={() => navigate('/admin')}
            >
              목록으로
            </button>
            <div className="page-header-content">
              <h1 className="admin-title">반별 학생 기록 조회</h1>
              <p className="admin-description">
                각 반에 속한 모든 학생들의 기록을 확인할 수 있습니다.
              </p>
            </div>
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
            </div>

            {classes.length === 0 ? (
              <div className="empty-state">
                <p>등록된 반이 없습니다.</p>
              </div>
            ) : (
              <>
                {/* 검색 필터링 */}
                {(() => {
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
                                  <th>생성일</th>
                                  <th>조회</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedClasses.map((classItem) => {
                                  // 학생 회원만 카운트 (학부모 제외)
                                  const studentCount = classItem.students?.filter(student => 
                                    (student.userType || (typeof student === 'object' ? student.userType : null)) === '학생'
                                  ).length || 0;
                                  
                                  return (
                                    <tr key={classItem._id}>
                                      <td>{classItem.grade}</td>
                                      <td>{classItem.className}</td>
                                      <td>{classItem.instructorName || '-'}</td>
                                      <td>{studentCount}명</td>
                                      <td>
                                        {classItem.createdAt 
                                          ? new Date(classItem.createdAt).toLocaleDateString('ko-KR', {
                                              year: 'numeric',
                                              month: '2-digit',
                                              day: '2-digit',
                                            })
                                          : '-'}
                                      </td>
                                      <td>
                                        <button 
                                          className="btn-edit-class"
                                          onClick={() => handleViewRecords(classItem._id)}
                                        >
                                          학생 기록 보기
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* 페이지네이션 */}
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
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AdminClassStudentRecords;

