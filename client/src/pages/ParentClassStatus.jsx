import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StudentSelector from '../components/StudentSelector';
import api from '../api/axiosConfig';
import './MyClassStatus.css';

function ParentClassStatus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState([]);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // 로그인 상태 확인
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !userStr) {
        // 비회원인 경우 로그인 유도
        setLoading(false);
        return;
      }

      const userData = JSON.parse(userStr);
      setUser(userData);

      // 학부모회원이 아닌 경우는 메시지만 표시
      if (userData.userType !== '학부모') {
        setLoading(false);
        return;
      }

      // 학부모회원인 경우 연동된 학생 목록 가져오기
      const studentsResponse = await api.get(`/parent-student-links/parent/${userData._id}`);
      if (studentsResponse.data.success && studentsResponse.data.data.length > 0) {
        const students = studentsResponse.data.data;
        setLinkedStudents(students);
        
        // 학생이 1명이면 자동 선택
        if (students.length === 1) {
          setSelectedStudent(students[0]);
          await fetchClassesForStudent(students[0]._id);
        } else {
          // 학생이 여러 명이면 선택 모달 표시
          setShowStudentSelector(true);
        }
      } else {
        // 연동된 학생이 없으면 메시지 표시
        setLinkedStudents([]);
        setClasses([]);
      }
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      if (error.response?.status === 401) {
        // 로그인 만료 시 사용자 정보 초기화
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesForStudent = async (studentId) => {
    try {
      // 학생 정보 가져오기 (반 정보 포함)
      const response = await api.get(`/users/${studentId}`);
      if (response.data.success) {
        const studentInfo = response.data.data;
        
        // 반 정보가 있으면 각 반의 상세 정보 가져오기
        if (studentInfo.classes && studentInfo.classes.length > 0) {
          const classPromises = studentInfo.classes.map(classInfo => 
            api.get(`/classes/${classInfo._id}`)
          );
          
          const classResponses = await Promise.all(classPromises);
          const classesData = classResponses
            .filter(res => res.data.success)
            .map(res => res.data.data);
          
          setClasses(classesData);
        } else {
          setClasses([]);
        }
      }
    } catch (error) {
      console.error('학생 반 정보 가져오기 오류:', error);
      setError('반 정보를 불러오는 중 오류가 발생했습니다.');
      setClasses([]);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentSelector(false);
    fetchClassesForStudent(student._id);
  };

  const handleChangeStudent = () => {
    // 연동된 학생이 1명이면 메시지 표시
    if (linkedStudents.length === 1) {
      alert('연동된 학생회원이 한 명뿐입니다. 다른 자녀를 추가하려면 관리자에게 문의해주세요.');
      return;
    }
    // 학생이 여러 명이면 선택 모달 표시
    setShowStudentSelector(true);
  };

  const handleViewStatus = (classId) => {
    if (!selectedStudent) {
      setShowStudentSelector(true);
      return;
    }
    // 수업 현황 보기 페이지로 이동 (학생 ID 포함)
    navigate(`/parent-class/${classId}/status?studentId=${selectedStudent._id}`);
  };

  // 비회원인 경우 로그인 유도 화면
  if (!user) {
    return (
      <div className="my-class-status-page">
        <Header />
        <section className="my-class-status-section">
          <div className="container">
            <div className="page-header">
              <div className="page-header-icon">
                <img src="/010.png" alt="이창현수학" className="page-header-icon-img" />
              </div>
              <div className="page-title">
                <img src="/010 - 복사본.png" alt="수업현황" className="page-title-img" />
              </div>
              <p className="page-description">
                내 자녀의 수업 현황을 확인할 수 있습니다.
              </p>
            </div>
            <div className="login-prompt">
              <div className="login-prompt-icon">
                <i className="fas fa-lock"></i>
              </div>
              <h2>로그인이 필요합니다</h2>
              <p>수업 현황을 보려면 먼저 로그인해주세요.</p>
              <button 
                className="btn-login-prompt"
                onClick={() => navigate('/login')}
              >
                로그인하기
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // 학부모회원이 아닌 경우 안내 메시지
  if (user.userType !== '학부모') {
    return (
      <div className="my-class-status-page">
        <Header />
        <section className="my-class-status-section">
          <div className="container">
            <div className="page-header">
              <div className="page-header-icon">
                <img src="/010.png" alt="이창현수학" className="page-header-icon-img" />
              </div>
              <div className="page-title">
                <img src="/010 - 복사본.png" alt="수업현황" className="page-title-img" />
              </div>
              <p className="page-description">
                내 자녀의 수업 현황을 확인할 수 있습니다.
              </p>
            </div>
            <div className="parent-only-message">
              <div className="parent-only-message-icon">
                <i className="fas fa-info-circle"></i>
              </div>
              <h2>학부모회원 전용 페이지입니다</h2>
              <p className="parent-only-message-sub">학부모 계정으로 로그인해주세요.</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-class-status-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>로딩 중...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-class-status-page">
        <Header />
        <div className="error-container">
          <p>{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="my-class-status-page">
      <Header />
      {showStudentSelector && (
        <StudentSelector
          parentId={user?._id}
          onSelectStudent={handleSelectStudent}
          selectedStudentId={selectedStudent?._id}
        />
      )}
      <section className="my-class-status-section">
        <div className="container">
          <div className="page-header">
            <div className="page-header-icon">
              <img src="/010.png" alt="이창현수학" className="page-header-icon-img" />
            </div>
            <div className="page-title">
              <img src="/010 - 복사본.png" alt="수업현황" className="page-title-img" />
            </div>
            <p className="page-description">
              내 자녀의 수업 현황을 확인할 수 있습니다.
            </p>
            {selectedStudent && (
              <div className="selected-student-info">
                <i className="fas fa-user-graduate"></i>
                <span>선택된 자녀: {selectedStudent.name}</span>
                <button
                  className="btn-change-student"
                  onClick={handleChangeStudent}
                  type="button"
                >
                  변경
                </button>
              </div>
            )}
          </div>

          {!selectedStudent ? (
            <div className="no-classes-container">
              <div className="no-classes-icon">
                <i className="fas fa-user-graduate"></i>
              </div>
              <h2>자녀를 선택해주세요</h2>
              <p>위에서 자녀를 선택하면 수업 현황을 확인할 수 있습니다.</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="no-classes-container">
              <div className="no-classes-icon">
                <i className="fas fa-inbox"></i>
              </div>
              <h2>등록된 반이 없습니다</h2>
              <p>관리자에게 문의하여 반을 등록해주세요.</p>
            </div>
          ) : (
            <div className="classes-grid">
              {classes.map((classItem) => (
                <div 
                  key={classItem._id} 
                  className="class-card"
                  onClick={() => handleViewStatus(classItem._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewStatus(classItem._id);
                    }
                  }}
                >
                  <div className="class-card-header">
                    <div className="class-icon">
                      <i className="fas fa-school"></i>
                    </div>
                    <h2 className="class-name">{classItem.className}</h2>
                  </div>
                  <div className="class-card-body">
                    <div className="class-info-item">
                      <i className="fas fa-user-tie"></i>
                      <span className="class-info-label">담당강사:</span>
                      <span className="class-info-value">{classItem.instructorName}</span>
                    </div>
                  </div>
                  <div className="class-card-footer">
                    <button
                      className="btn-view-status"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleViewStatus(classItem._id);
                      }}
                      type="button"
                    >
                      수업 현황 보기
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default ParentClassStatus;

