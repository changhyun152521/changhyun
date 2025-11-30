import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './Admin.css';

function UsersList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const tableContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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
        fetchUsers();
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
      fetchUsers();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        const usersData = response.data.data || [];
        console.log('사용자 목록 데이터:', usersData);
        // 연동 정보 확인을 위한 로그
        usersData.forEach(user => {
          if (user.userType === '학생' || user.userType === '학부모') {
            console.log(`${user.userId} (${user.userType}) - 연동 정보:`, user.linkedUser);
          }
        });
        setUsers(usersData);
      } else {
        console.error('사용자 목록 가져오기 실패:', response.data);
        alert(response.data.error || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('사용자 목록 가져오기 오류:', error);
      let errorMessage = '사용자 목록을 불러오는 중 오류가 발생했습니다.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName, userType) => {
    // 연동 정보가 있는 경우 경고 메시지 추가
    const user = users.find(u => u._id === userId);
    let confirmMessage = `정말로 "${userName}" 사용자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
    
    if (user && user.linkedUser) {
      confirmMessage += `\n\n⚠️ 주의: 이 사용자는 "${user.linkedUser.name}" (${user.linkedUser.userId})와 연동되어 있습니다.\n삭제 시 연동 정보가 제거됩니다.`;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await api.delete(`/users/${userId}`);
      if (response.data.success) {
        let message = '사용자가 성공적으로 삭제되었습니다.';
        if (response.data.unlinkedUser) {
          message += `\n\n연동된 ${response.data.unlinkedUser.type} 계정(${response.data.unlinkedUser.name})의 연동 정보가 제거되었습니다.`;
        }
        alert(message);
        fetchUsers();
      } else {
        alert(response.data.error || '사용자 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      alert('사용자 삭제 중 오류가 발생했습니다.');
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

  // 필터링 및 페이지네이션
  let filteredUsers = selectedUserType 
    ? users.filter(user => user.userType === selectedUserType)
    : users;

  if (usersSearch.trim()) {
    const searchLower = usersSearch.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.userId?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.schoolName?.toLowerCase().includes(searchLower)
    );
  }

  // 생성일 기준 최신순 정렬 (백엔드 정렬이 제대로 적용되지 않을 경우를 대비)
  filteredUsers.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // 내림차순 (최신순)
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (usersPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // 페이지 번호 배열 생성
  let pageNumbers = [];
  if (totalPages <= 10) {
    pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (usersPage <= 5) {
      pageNumbers = Array.from({ length: 10 }, (_, i) => i + 1);
    } else if (usersPage >= totalPages - 4) {
      pageNumbers = Array.from({ length: 10 }, (_, i) => totalPages - 9 + i);
    } else {
      pageNumbers = Array.from({ length: 10 }, (_, i) => usersPage - 4 + i);
    }
  }

  // 드래그 스크롤 핸들러
  const handleMouseDown = (e) => {
    if (tableContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - tableContainerRef.current.offsetLeft);
      setScrollLeft(tableContainerRef.current.scrollLeft);
      tableContainerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (tableContainerRef.current) {
      tableContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (tableContainerRef.current) {
      tableContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조절
    tableContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="admin-page">
      <Header />
      <div className="admin-container">
        <div className="admin-content">
          <div className="page-header">
            <h1 className="page-title">사용자 관리</h1>
            <button
              className="btn-back"
              onClick={() => navigate('/admin')}
            >
              목록으로
            </button>
          </div>

          <div className="users-section">
            <div className="users-header-actions">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="아이디, 이름으로 검색..."
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                />
                <i className="fas fa-search search-icon"></i>
              </div>
              <button 
                className="btn-add-user"
                onClick={() => navigate('/admin/user/register')}
              >
                + 회원 등록
              </button>
            </div>

            <div className="user-type-tabs">
              <button
                className={`user-type-tab ${selectedUserType === null ? 'active' : ''}`}
                onClick={() => {
                  setSelectedUserType(null);
                  setUsersPage(1);
                }}
              >
                전체
              </button>
              <button
                className={`user-type-tab ${selectedUserType === '강사' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedUserType('강사');
                  setUsersPage(1);
                }}
              >
                강사
              </button>
              <button
                className={`user-type-tab ${selectedUserType === '학생' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedUserType('학생');
                  setUsersPage(1);
                }}
              >
                학생
              </button>
              <button
                className={`user-type-tab ${selectedUserType === '학부모' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedUserType('학부모');
                  setUsersPage(1);
                }}
              >
                학부모
              </button>
            </div>

            {usersLoading ? (
              <div className="loading">사용자 목록을 불러오는 중...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <p>{selectedUserType ? `${selectedUserType} 사용자가 없습니다.` : '등록된 사용자가 없습니다.'}</p>
                <button 
                  className="btn-add-user"
                  onClick={() => navigate('/admin/user/register')}
                >
                  회원 등록하기
                </button>
              </div>
            ) : (
              <>
                <div 
                  className="users-table-container"
                  ref={tableContainerRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>아이디</th>
                        <th>이름</th>
                        <th>사용자 유형</th>
                        <th>학교명</th>
                        <th>생성일</th>
                        <th>관리</th>
                        <th>연동 정보</th>
                        <th>반</th>
                        <th>관리자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="no-results">
                            검색 결과가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => (
                          <tr key={user._id}>
                            <td>{user.userId}</td>
                            <td>{user.name}</td>
                            <td>
                              <span className={`user-type-badge ${user.userType === '강사' ? 'instructor' : user.userType === '학부모' ? 'parent' : 'student'}`}>
                                {user.userType}
                              </span>
                            </td>
                            <td>{user.schoolName}</td>
                            <td>
                              {user.createdAt 
                                ? new Date(user.createdAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                  })
                                : '-'}
                            </td>
                            <td>
                              <div className="management-buttons">
                                <button 
                                  className="btn-edit-user"
                                  onClick={() => {
                                    navigate(`/admin/user/edit/${user._id}`);
                                  }}
                                >
                                  정보수정
                                </button>
                                <button 
                                  className="btn-delete-user"
                                  onClick={() => {
                                    handleDeleteUser(user._id, user.name, user.userType);
                                  }}
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                            <td>
                              {user.linkedUser && user.linkedUser.userId ? (
                                <div className="linked-user-info">
                                  <span 
                                    className="linked-user-badge" 
                                    title={`연동된 ${user.linkedUser.userType}: ${user.linkedUser.name} (${user.linkedUser.userId})`}
                                  >
                                    <i className={`fas ${user.userType === '학생' ? 'fa-user-friends' : 'fa-user-graduate'}`}></i>
                                    <span className="linked-user-text">
                                      {user.linkedUser.name} ({user.linkedUser.userId})
                                    </span>
                                  </span>
                                </div>
                              ) : (
                                <span className="no-linked-user">-</span>
                              )}
                            </td>
                            <td>
                              {user.classes && user.classes.length > 0 ? (
                                <div className="user-classes">
                                  {user.classes.map((className, idx) => (
                                    <span key={idx} className="class-badge">
                                      {className}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="no-class">-</span>
                              )}
                            </td>
                            <td>
                              <span className={`admin-badge ${user.isAdmin ? 'yes' : 'no'}`}>
                                {user.isAdmin ? '예' : '아니오'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                      disabled={usersPage === 1}
                    >
                      이전
                    </button>
                    <div className="pagination-numbers">
                      {pageNumbers.map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`pagination-number ${usersPage === pageNum ? 'active' : ''}`}
                          onClick={() => setUsersPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      className="pagination-btn"
                      onClick={() => setUsersPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={usersPage === totalPages}
                    >
                      다음
                    </button>
                  </div>
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

export default UsersList;

