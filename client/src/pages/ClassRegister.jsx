import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './ClassRegister.css';

function ClassRegister() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const isEditMode = !!classId;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]); // 전체 학생 목록
  const [selectedStudents, setSelectedStudents] = useState([]); // 선택된 학생 ID 배열
  const [courses, setCourses] = useState([]); // 전체 강좌 목록
  const [selectedCourses, setSelectedCourses] = useState([]); // 선택된 강좌 ID 배열
  const [showStudentModal, setShowStudentModal] = useState(false); // 학생 추가 모달 표시 여부
  const [showCourseModal, setShowCourseModal] = useState(false); // 강좌 추가 모달 표시 여부
  const [studentSearchTerm, setStudentSearchTerm] = useState(''); // 학생 검색어
  const [courseSearchTerm, setCourseSearchTerm] = useState(''); // 강좌 검색어
  const [formData, setFormData] = useState({
    grade: '',
    className: '',
    instructorId: '',
    instructorName: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 관리자 권한 확인
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
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        alert('사용자 정보를 확인할 수 없습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
    fetchInstructors();
    fetchStudents();
    fetchCourses();
    
    if (isEditMode) {
      fetchClassData();
    }
  }, [navigate, classId, isEditMode]);

  // 강사 목록 가져오기
  const fetchInstructors = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        // 강사만 필터링
        const instructorsList = response.data.data.filter(
          (user) => user.userType === '강사'
        );
        setInstructors(instructorsList);
      }
    } catch (error) {
      console.error('강사 목록 가져오기 오류:', error);
    }
  };

  // 학생 목록 가져오기
  const fetchStudents = async () => {
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        // 학생만 필터링
        const studentsList = response.data.data.filter(
          (user) => user.userType === '학생'
        );
        setStudents(studentsList);
      }
    } catch (error) {
      console.error('학생 목록 가져오기 오류:', error);
    }
  };

  // 강좌 목록 가져오기
  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      if (response.data.success) {
        setCourses(response.data.data || []);
      }
    } catch (error) {
      console.error('강좌 목록 가져오기 오류:', error);
    }
  };

  // 기존 반 데이터 가져오기 (수정 모드)
  const fetchClassData = async () => {
    setClassLoading(true);
    try {
      const response = await api.get(`/classes/${classId}`);
      if (response.data.success) {
        const classData = response.data.data;
        setFormData({
          grade: classData.grade || '',
          className: classData.className || '',
          instructorId: classData.instructorId?._id || classData.instructorId || '',
          instructorName: classData.instructorName || '',
        });
        // 선택된 학생 ID 배열 설정 (학부모는 자동으로 추가되므로 학생만 설정)
        if (classData.students && Array.isArray(classData.students)) {
          // 학생만 필터링
          const studentIds = [];
          
          for (const item of classData.students) {
            const userId = item._id || item;
            // 이미 populate된 경우 userType 확인
            if (item.userType === '학생') {
              studentIds.push(userId);
            } else if (!item.userType) {
              // populate되지 않은 경우 전체 목록에서 확인
              const user = students.find(s => s._id === userId);
              if (user && user.userType === '학생') {
                studentIds.push(userId);
              }
            }
          }
          
          setSelectedStudents(studentIds);
        }
        // 선택된 강좌 ID 배열 설정
        if (classData.courses && Array.isArray(classData.courses)) {
          const courseIds = classData.courses.map(course => 
            course._id || course
          );
          setSelectedCourses(courseIds);
        }
      } else {
        alert('반 정보를 불러올 수 없습니다.');
        navigate('/admin');
      }
    } catch (error) {
      console.error('반 데이터 가져오기 오류:', error);
      alert('반 정보를 불러오는 중 오류가 발생했습니다.');
      navigate('/admin');
    } finally {
      setClassLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // 강사 선택 시 강사명 자동 설정
  const handleInstructorChange = (e) => {
    const selectedInstructorId = e.target.value;
    const selectedInstructor = instructors.find(inst => inst._id === selectedInstructorId);
    
    setFormData((prev) => ({
      ...prev,
      instructorId: selectedInstructorId,
      instructorName: selectedInstructor ? selectedInstructor.name : '',
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.grade) {
      newErrors.grade = '구분을 선택해주세요';
    }
    if (!formData.className.trim()) {
      newErrors.className = '반명을 입력해주세요';
    }
    if (!formData.instructorId) {
      newErrors.instructorId = '담당강사를 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 학생 추가
  const handleAddStudent = (studentId) => {
    if (!selectedStudents.includes(studentId)) {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // 학생 삭제
  const handleRemoveStudent = (studentId) => {
    setSelectedStudents(selectedStudents.filter(id => id !== studentId));
  };


  // 강좌 추가
  const handleAddCourse = (courseId) => {
    if (!selectedCourses.includes(courseId)) {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  // 강좌 삭제
  const handleRemoveCourse = (courseId) => {
    setSelectedCourses(selectedCourses.filter(id => id !== courseId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        grade: formData.grade,
        className: formData.className.trim(),
        instructorId: formData.instructorId,
        instructorName: formData.instructorName.trim(),
        students: selectedStudents, // 선택된 학생 ID 배열 (연동된 학부모는 백엔드에서 자동 추가)
        courses: selectedCourses, // 선택된 강좌 ID 배열
      };

      let response;
      if (isEditMode) {
        response = await api.put(`/classes/${classId}`, submitData);
        if (response.data.success) {
          alert('반 정보가 성공적으로 수정되었습니다!');
          navigate('/admin', { state: { refresh: true } });
        } else {
          alert(response.data.error || '반 수정 중 오류가 발생했습니다');
        }
      } else {
        response = await api.post('/classes', submitData);
        if (response.data.success) {
          alert('반이 성공적으로 등록되었습니다!');
          navigate('/admin', { state: { refresh: true } });
        } else {
          alert(response.data.error || '반 등록 중 오류가 발생했습니다');
        }
      }
    } catch (error) {
      console.error('반 처리 오류:', error);
      let errorMessage = '반 처리 중 오류가 발생했습니다';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || classLoading) {
    return (
      <div className="class-register-page">
        <Header />
        <div className="class-register-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="class-register-page">
      <Header />
      <div className="class-register-container">
        <div className="class-register-content">
          <h1 className="class-register-title">{isEditMode ? '반 정보 수정' : '반 등록'}</h1>

          <form onSubmit={handleSubmit} className="class-register-form">
            <div className="form-section">
              <h2 className="section-title">반 정보</h2>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">구분</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className={`form-input form-select ${errors.grade ? 'input-error' : ''}`}
                  >
                    <option value="">구분을 선택하세요</option>
                    <option value="중1">중1</option>
                    <option value="중2">중2</option>
                    <option value="중3">중3</option>
                    <option value="고1">고1</option>
                    <option value="고2">고2</option>
                    <option value="고3/N수">고3/N수</option>
                  </select>
                  {errors.grade && <span className="error-message">{errors.grade}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">반명</label>
                  <input
                    type="text"
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    className={`form-input ${errors.className ? 'input-error' : ''}`}
                    placeholder="반명을 입력하세요"
                  />
                  {errors.className && <span className="error-message">{errors.className}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">담당강사</label>
                  <select
                    name="instructorId"
                    value={formData.instructorId}
                    onChange={handleInstructorChange}
                    className={`form-input form-select ${errors.instructorId ? 'input-error' : ''}`}
                  >
                    <option value="">담당강사를 선택하세요</option>
                    {instructors.map((instructor) => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.name} ({instructor.userId})
                      </option>
                    ))}
                  </select>
                  {errors.instructorId && <span className="error-message">{errors.instructorId}</span>}
                </div>
              </div>
            </div>

            {/* 학생 관리 섹션 */}
            <div className="form-section">
              <h2 className="section-title">학생 관리</h2>

              {/* 학생 추가 버튼 */}
              <div className="form-group">
                <label className="form-label">학생 추가</label>
                <button
                  type="button"
                  className="btn-add-student"
                  onClick={() => {
                    setStudentSearchTerm('');
                    setShowStudentModal(true);
                  }}
                >
                  <i className="fas fa-plus"></i>
                  학생 추가
                </button>
              </div>

              {/* 선택된 학생 목록 */}
              {selectedStudents.length > 0 && (
                <div className="selected-students-list">
                  <h3 className="students-list-title">등록된 학생 ({selectedStudents.length}명)</h3>
                  <div className="students-grid">
                    {selectedStudents.map((studentId) => {
                      const student = students.find(s => s._id === studentId);
                      if (!student) return null;
                      return (
                        <div key={studentId} className="student-item">
                          <div className="student-info">
                            <span className="student-name">{student.name}</span>
                            <span className="student-id">({student.userId})</span>
                            <span className="student-school">{student.schoolName || '학교 미등록'}</span>
                            <span className="student-type">{student.userType}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-remove-student"
                            onClick={() => handleRemoveStudent(studentId)}
                          >
                            삭제
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedStudents.length === 0 && (
                <div className="empty-students-message">
                  <p>등록된 학생이 없습니다. 위의 드롭다운에서 학생을 선택하여 추가하세요.</p>
                </div>
              )}
            </div>


            {/* 강좌 관리 섹션 */}
            <div className="form-section">
              <h2 className="section-title">강좌 관리</h2>

              {/* 강좌 추가 버튼 */}
              <div className="form-group">
                <label className="form-label">강좌 추가</label>
                <button
                  type="button"
                  className="btn-add-course"
                  onClick={() => {
                    setCourseSearchTerm('');
                    setShowCourseModal(true);
                  }}
                >
                  <i className="fas fa-plus"></i>
                  강좌 추가
                </button>
              </div>

              {/* 선택된 강좌 목록 */}
              {selectedCourses.length > 0 && (
                <div className="selected-courses-list">
                  <h3 className="courses-list-title">등록된 강좌 ({selectedCourses.length}개)</h3>
                  <div className="courses-grid">
                    {selectedCourses.map((courseId) => {
                      const course = courses.find(c => c._id === courseId);
                      if (!course) return null;
                      return (
                        <div key={courseId} className="course-item">
                          <div className="course-info">
                            <span className="course-name">{course.courseName}</span>
                            <span className="course-details">
                              {course.grade} | {course.instructorName} | {course.courseCount}강
                            </span>
                            {course.courseStatus && (
                              <span className={`course-status ${course.courseStatus === '완강' ? 'completed' : 'in-progress'}`}>
                                {course.courseStatus}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn-remove-course"
                            onClick={() => handleRemoveCourse(courseId)}
                          >
                            삭제
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedCourses.length === 0 && (
                <div className="empty-courses-message">
                  <p>등록된 강좌가 없습니다. 위의 드롭다운에서 강좌를 선택하여 추가하세요.</p>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/admin')}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '반 수정' : '반 등록')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 학생 추가 모달 */}
      {showStudentModal && (
        <div className="modal-overlay" onClick={() => {
          setShowStudentModal(false);
          setStudentSearchTerm('');
        }}>
          <div className="modal-container student-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">학생 추가</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowStudentModal(false);
                  setStudentSearchTerm('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* 검색 입력 */}
              <div className="modal-search">
                <input
                  type="text"
                  className="modal-search-input"
                  placeholder="학생 이름, 아이디, 학교명으로 검색..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                />
                <i className="fas fa-search modal-search-icon"></i>
              </div>

              {/* 학생 목록 */}
              <div className="modal-list">
                {students
                  .filter(student => {
                    if (selectedStudents.includes(student._id)) return false;
                    if (!studentSearchTerm) return true;
                    const searchLower = studentSearchTerm.toLowerCase();
                    return (
                      student.name?.toLowerCase().includes(searchLower) ||
                      student.userId?.toLowerCase().includes(searchLower) ||
                      student.schoolName?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((student) => (
                    <div
                      key={student._id}
                      className={`modal-list-item ${selectedStudents.includes(student._id) ? 'selected' : ''}`}
                      onClick={() => handleAddStudent(student._id)}
                    >
                      <div className="modal-item-info">
                        <span className="modal-item-name">{student.name}</span>
                        <span className="modal-item-id">({student.userId})</span>
                        <span className="modal-item-school">{student.schoolName || '학교 미등록'}</span>
                        {student.createdAt && (
                          <span className="modal-item-date">
                            생성일: {new Date(student.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-add-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddStudent(student._id);
                        }}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  ))}
                {students.filter(student => {
                  if (selectedStudents.includes(student._id)) return false;
                  if (!studentSearchTerm) return true;
                  const searchLower = studentSearchTerm.toLowerCase();
                  return (
                    student.name?.toLowerCase().includes(searchLower) ||
                    student.userId?.toLowerCase().includes(searchLower) ||
                    student.schoolName?.toLowerCase().includes(searchLower)
                  );
                }).length === 0 && (
                  <div className="modal-empty-message">
                    {studentSearchTerm ? '검색 결과가 없습니다.' : '추가할 수 있는 학생이 없습니다.'}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => {
                  setShowStudentModal(false);
                  setStudentSearchTerm('');
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 강좌 추가 모달 */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCourseModal(false);
          setCourseSearchTerm('');
        }}>
          <div className="modal-container course-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">강좌 추가</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowCourseModal(false);
                  setCourseSearchTerm('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {/* 검색 입력 */}
              <div className="modal-search">
                <input
                  type="text"
                  className="modal-search-input"
                  placeholder="강좌명, 학년, 강사명으로 검색..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                />
                <i className="fas fa-search modal-search-icon"></i>
              </div>

              {/* 강좌 목록 */}
              <div className="modal-list">
                {courses
                  .filter(course => {
                    if (selectedCourses.includes(course._id)) return false;
                    if (!courseSearchTerm) return true;
                    const searchLower = courseSearchTerm.toLowerCase();
                    return (
                      course.courseName?.toLowerCase().includes(searchLower) ||
                      course.grade?.toLowerCase().includes(searchLower) ||
                      course.instructorName?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((course) => (
                    <div
                      key={course._id}
                      className={`modal-list-item ${selectedCourses.includes(course._id) ? 'selected' : ''}`}
                      onClick={() => handleAddCourse(course._id)}
                    >
                      <div className="modal-item-info">
                        <span className="modal-item-name">{course.courseName}</span>
                        <span className="modal-item-details">
                          {course.grade} | {course.instructorName} | {course.courseCount}강
                        </span>
                        {course.createdAt && (
                          <span className="modal-item-date">
                            생성일: {new Date(course.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        )}
                        {course.courseStatus && (
                          <span className={`modal-item-status ${course.courseStatus === '완강' ? 'completed' : 'in-progress'}`}>
                            {course.courseStatus}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-add-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddCourse(course._id);
                        }}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  ))}
                {courses.filter(course => {
                  if (selectedCourses.includes(course._id)) return false;
                  if (!courseSearchTerm) return true;
                  const searchLower = courseSearchTerm.toLowerCase();
                  return (
                    course.courseName?.toLowerCase().includes(searchLower) ||
                    course.grade?.toLowerCase().includes(searchLower) ||
                    course.instructorName?.toLowerCase().includes(searchLower)
                  );
                }).length === 0 && (
                  <div className="modal-empty-message">
                    {courseSearchTerm ? '검색 결과가 없습니다.' : '추가할 수 있는 강좌가 없습니다.'}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => {
                  setShowCourseModal(false);
                  setCourseSearchTerm('');
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default ClassRegister;

