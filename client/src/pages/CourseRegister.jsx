import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './CourseRegister.css';

function CourseRegister() {
  const navigate = useNavigate();
  const { courseId } = useParams(); // URL 파라미터에서 courseId 가져오기
  const isEditMode = !!courseId; // courseId가 있으면 수정 모드
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [formData, setFormData] = useState({
    sku: '',
    courseName: '',
    instructorId: '',
    instructorName: '',
    grade: '',
    courseCount: '',
    textbook: '',
    textbookType: '', // 자체교재 or 시중교재
    courseStatus: '', // 완강, 진행중
    courseType: '', // 정규, 특강
    courseRange: '', // 강좌 범위
    courseDescription: '', // 내용 및 특징
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lectures, setLectures] = useState([]); // 강의 목록
  const [newLecture, setNewLecture] = useState({ // 새 강의 입력
    lectureNumber: '',
    lectureTitle: '',
    duration: '',
    videoLink: '',
  });
  const [editingLectureIndex, setEditingLectureIndex] = useState(null); // 수정 중인 강의 인덱스
  const [showLectureModal, setShowLectureModal] = useState(false); // 강의 추가/수정 모달 표시 여부

  // 강의 목록이 변경될 때마다 강의 수 자동 업데이트
  useEffect(() => {
    const count = lectures.length || 0;
    setFormData((prev) => ({
      ...prev,
      courseCount: count.toString(),
    }));
  }, [lectures]);

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
    
    // 수정 모드면 기존 강좌 데이터 불러오기
    if (isEditMode) {
      fetchCourseData();
    }
  }, [navigate, courseId, isEditMode]);

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

  // 기존 강좌 데이터 가져오기 (수정 모드)
  const fetchCourseData = async () => {
    setCourseLoading(true);
    try {
      const response = await api.get(`/courses/${courseId}`);
      if (response.data.success) {
        const course = response.data.data;
        setFormData({
          sku: course.sku || '',
          courseName: course.courseName || '',
          instructorId: course.instructorId?._id || course.instructorId || '',
          instructorName: course.instructorName || '',
          grade: course.grade || '',
          courseCount: course.courseCount || '',
          textbook: course.textbook || '',
          textbookType: course.textbookType || '',
          courseStatus: course.courseStatus || '',
          courseType: course.courseType || '',
          courseRange: course.courseRange || '',
          courseDescription: course.courseDescription || '',
        });
        // 강의 목록 설정
        if (course.lectures && Array.isArray(course.lectures)) {
          setLectures(course.lectures.map(lecture => ({
            lectureNumber: lecture.lectureNumber,
            lectureTitle: lecture.lectureTitle || '',
            duration: lecture.duration || '',
            videoLink: lecture.videoLink || '',
          })));
        }
      } else {
        alert('강좌 정보를 불러올 수 없습니다.');
        navigate('/admin');
      }
    } catch (error) {
      console.error('강좌 정보 가져오기 오류:', error);
      alert('강좌 정보를 불러오는 중 오류가 발생했습니다.');
      navigate('/admin');
    } finally {
      setCourseLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 강사 선택 시 강사명 자동 설정
    if (name === 'instructorId') {
      const selectedInstructor = instructors.find(
        (inst) => inst._id === value
      );
      if (selectedInstructor) {
        setFormData((prev) => ({
          ...prev,
          instructorId: value,
          instructorName: selectedInstructor.name,
        }));
      }
    }

    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleTagClick = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] === value ? '' : value,
    }));
  };


  const validateForm = () => {
    const newErrors = {};

    if (!formData.sku || !formData.sku.trim()) {
      newErrors.sku = 'SKU를 입력해주세요';
    }
    if (!formData.courseName || !formData.courseName.trim()) {
      newErrors.courseName = '강좌명을 입력해주세요';
    }
    if (!formData.instructorId) {
      newErrors.instructorId = '강사를 선택해주세요';
    }
    if (!formData.instructorName || !formData.instructorName.trim()) {
      newErrors.instructorName = '강사명을 확인해주세요';
    }
    if (!formData.grade) {
      newErrors.grade = '학년을 선택해주세요';
    }
    // 강의 수는 0 이상이면 허용 (강의 없이도 강좌 등록 가능)
    // 강의 목록 길이를 기본값으로 사용
    const calculatedCount = lectures && lectures.length > 0 ? lectures.length : 0;
    const courseCountValue = formData.courseCount !== undefined && formData.courseCount !== '' 
      ? formData.courseCount 
      : calculatedCount.toString();
    const courseCountNum = Number(courseCountValue);
    if (isNaN(courseCountNum) || courseCountNum < 0) {
      newErrors.courseCount = '강의 수를 입력해주세요 (0 이상)';
    }
    if (!formData.textbook || !formData.textbook.trim()) {
      newErrors.textbook = '교재를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    let submitData = null; // 스코프 문제 해결을 위해 미리 선언

    try {
      // 강의 데이터 검증 및 정리
      let processedLectures = [];
      try {
        if (lectures && lectures.length > 0) {
          // 불완전한 강의 필터링 (제목과 영상 링크가 모두 있는 강의만 포함)
          const validLectures = lectures.filter(lecture => {
            const lectureTitle = lecture.lectureTitle && typeof lecture.lectureTitle === 'string' ? lecture.lectureTitle.trim() : '';
            const videoLink = lecture.videoLink && typeof lecture.videoLink === 'string' ? lecture.videoLink.trim() : '';
            return lectureTitle && videoLink; // 제목과 영상 링크가 모두 있어야 유효한 강의
          });

          if (validLectures.length !== lectures.length) {
            const removedCount = lectures.length - validLectures.length;
            alert(`${removedCount}개의 불완전한 강의가 제외되었습니다. 강의 제목과 영상 링크를 모두 입력해주세요.`);
          }

          // 강의 목록을 정렬하고 lectureNumber 검증 및 재할당
          const sortedLectures = [...validLectures].sort((a, b) => {
            const aNum = a.lectureNumber ? Number(a.lectureNumber) : 0;
            const bNum = b.lectureNumber ? Number(b.lectureNumber) : 0;
            return aNum - bNum;
          });
          
          processedLectures = sortedLectures
            .filter((lecture) => {
              // lectureTitle과 videoLink가 모두 있는 강의만 포함
              const hasTitle = lecture.lectureTitle && typeof lecture.lectureTitle === 'string' && lecture.lectureTitle.trim();
              const hasLink = lecture.videoLink && typeof lecture.videoLink === 'string' && lecture.videoLink.trim();
              return hasTitle && hasLink;
            })
            .map((lecture, index) => {
              // 안전한 데이터 변환
              let lectureNumber;
              if (lecture.lectureNumber !== undefined && lecture.lectureNumber !== null && lecture.lectureNumber !== '') {
                lectureNumber = Number(lecture.lectureNumber);
                if (isNaN(lectureNumber) || lectureNumber < 1) {
                  lectureNumber = index + 1;
                }
              } else {
                lectureNumber = index + 1;
              }
              
              const lectureTitle = lecture.lectureTitle && typeof lecture.lectureTitle === 'string' ? lecture.lectureTitle.trim() : '';
              const duration = lecture.duration && typeof lecture.duration === 'string' && lecture.duration.trim() ? lecture.duration.trim() : undefined;
              const videoLink = lecture.videoLink && typeof lecture.videoLink === 'string' ? lecture.videoLink.trim() : '';
              
              return {
                lectureNumber: lectureNumber,
                lectureTitle: lectureTitle,
                duration: duration,
                videoLink: videoLink,
              };
            });
        }
      } catch (lectureError) {
        alert(lectureError.message || '강의 데이터 처리 중 오류가 발생했습니다.');
        setIsSubmitting(false);
        return;
      }

      submitData = {
        sku: (formData.sku || '').trim(),
        courseName: (formData.courseName || '').trim(),
        instructorId: formData.instructorId,
        instructorName: (() => {
          // 강사명이 없으면 강사 목록에서 찾아서 설정
          if (!formData.instructorName || !formData.instructorName.trim()) {
            if (formData.instructorId) {
              const selectedInstructor = instructors.find(inst => inst._id === formData.instructorId);
              if (selectedInstructor && selectedInstructor.name) {
                return selectedInstructor.name.trim();
              }
            }
            return '';
          }
          return formData.instructorName.trim();
        })(),
        grade: formData.grade,
        courseCount: (() => {
          // 강의 목록 길이를 기본값으로 사용
          const lectureCount = processedLectures && processedLectures.length > 0 ? processedLectures.length : 0;
          const countValue = formData.courseCount !== undefined && formData.courseCount !== '' 
            ? Number(formData.courseCount) 
            : lectureCount;
          return isNaN(countValue) ? 0 : countValue;
        })(), // 강의가 없으면 0
        textbook: (formData.textbook || '').trim(),
        textbookType: formData.textbookType && formData.textbookType.trim() ? formData.textbookType.trim() : undefined,
        courseStatus: formData.courseStatus && formData.courseStatus.trim() ? formData.courseStatus.trim() : undefined,
        courseType: formData.courseType && formData.courseType.trim() ? formData.courseType.trim() : undefined,
        courseRange: formData.courseRange && formData.courseRange.trim() ? formData.courseRange.trim() : undefined,
        courseDescription: formData.courseDescription && formData.courseDescription.trim() ? formData.courseDescription.trim() : undefined,
        lectures: processedLectures || [], // 강의가 없으면 빈 배열
      };

      // 전송할 데이터 검증
      console.log('=== 강좌 등록/수정 데이터 전송 ===');
      console.log('전송할 강의 데이터:', processedLectures);
      console.log('전송할 데이터 (전체):', JSON.stringify(submitData, null, 2));
      console.log('formData 상태:', formData);
      console.log('instructors 목록:', instructors);
      console.log('필수 필드 확인 (상세):', {
        sku: submitData.sku ? `"${submitData.sku}" (길이: ${submitData.sku.length})` : 'undefined 또는 빈 문자열',
        courseName: submitData.courseName ? `"${submitData.courseName}" (길이: ${submitData.courseName.length})` : 'undefined 또는 빈 문자열',
        instructorId: submitData.instructorId ? `"${submitData.instructorId}"` : 'undefined',
        instructorName: submitData.instructorName ? `"${submitData.instructorName}" (길이: ${submitData.instructorName.length})` : 'undefined 또는 빈 문자열',
        grade: submitData.grade ? `"${submitData.grade}"` : 'undefined',
        courseCount: submitData.courseCount !== undefined ? `${submitData.courseCount} (타입: ${typeof submitData.courseCount})` : 'undefined',
        textbook: submitData.textbook ? `"${submitData.textbook}" (길이: ${submitData.textbook.length})` : 'undefined 또는 빈 문자열',
      });
      
      // 강사명이 없으면 강사 목록에서 자동으로 찾아서 설정
      if (!submitData.instructorName || !submitData.instructorName.trim()) {
        if (submitData.instructorId) {
          const selectedInstructor = instructors.find(inst => inst._id === submitData.instructorId);
          if (selectedInstructor && selectedInstructor.name) {
            submitData.instructorName = selectedInstructor.name.trim();
            console.log('강사명 자동 설정:', submitData.instructorName);
          } else {
            console.error('강사를 찾을 수 없습니다. instructorId:', submitData.instructorId);
            console.error('instructors 목록:', instructors);
          }
        } else {
          console.error('instructorId가 없습니다.');
        }
      }
      
      // 필수 필드 사전 검증 (더 엄격하게)
      const missingFields = [];
      if (!submitData.sku || !submitData.sku.trim()) {
        missingFields.push('SKU');
        console.error('SKU 누락:', submitData.sku);
      }
      if (!submitData.courseName || !submitData.courseName.trim()) {
        missingFields.push('강좌명');
        console.error('강좌명 누락:', submitData.courseName);
      }
      if (!submitData.instructorId) {
        missingFields.push('강사ID');
        console.error('강사ID 누락:', submitData.instructorId);
      }
      if (!submitData.instructorName || !submitData.instructorName.trim()) {
        missingFields.push('강사명');
        console.error('강사명 누락:', submitData.instructorName);
      }
      if (!submitData.grade) {
        missingFields.push('학년');
        console.error('학년 누락:', submitData.grade);
      }
      if (submitData.courseCount === undefined || submitData.courseCount === null || isNaN(Number(submitData.courseCount)) || Number(submitData.courseCount) < 0) {
        missingFields.push('강의수');
        console.error('강의수 누락 또는 유효하지 않음:', submitData.courseCount);
      }
      if (!submitData.textbook || !submitData.textbook.trim()) {
        missingFields.push('교재');
        console.error('교재 누락:', submitData.textbook);
      }
      
      if (missingFields.length > 0) {
        console.error('=== 누락된 필수 필드 ===');
        console.error('누락된 필드:', missingFields);
        console.error('전체 submitData:', JSON.stringify(submitData, null, 2));
        console.error('formData 상태:', formData);
        alert(`다음 필수 필드가 누락되었습니다: ${missingFields.join(', ')}\n\n콘솔을 확인하여 자세한 정보를 확인하세요.`);
        setIsSubmitting(false);
        return;
      }
      
      // 최종 전송 데이터 확인
      console.log('=== 최종 전송 데이터 확인 ===');
      console.log('모든 필수 필드가 포함되어 있습니다:', {
        sku: submitData.sku,
        courseName: submitData.courseName,
        instructorId: submitData.instructorId,
        instructorName: submitData.instructorName,
        grade: submitData.grade,
        courseCount: submitData.courseCount,
        textbook: submitData.textbook,
      });

      // 최종 전송 데이터 확인 - 필수 필드는 반드시 포함
      const finalSubmitData = {
        sku: submitData.sku,
        courseName: submitData.courseName,
        instructorId: submitData.instructorId,
        instructorName: submitData.instructorName,
        grade: submitData.grade,
        courseCount: submitData.courseCount,
        textbook: submitData.textbook,
      };
      
      // 선택 필드는 값이 있을 때만 포함
      if (submitData.textbookType) finalSubmitData.textbookType = submitData.textbookType;
      if (submitData.courseStatus) finalSubmitData.courseStatus = submitData.courseStatus;
      if (submitData.courseType) finalSubmitData.courseType = submitData.courseType;
      if (submitData.courseRange) finalSubmitData.courseRange = submitData.courseRange;
      if (submitData.courseDescription) finalSubmitData.courseDescription = submitData.courseDescription;
      if (submitData.lectures && Array.isArray(submitData.lectures)) finalSubmitData.lectures = submitData.lectures;
      
      console.log('=== 최종 전송 데이터 (필수 필드 보장) ===');
      console.log(JSON.stringify(finalSubmitData, null, 2));
      console.log('필수 필드 확인:', {
        sku: finalSubmitData.sku ? '✓' : '✗',
        courseName: finalSubmitData.courseName ? '✓' : '✗',
        instructorId: finalSubmitData.instructorId ? '✓' : '✗',
        instructorName: finalSubmitData.instructorName ? '✓' : '✗',
        grade: finalSubmitData.grade ? '✓' : '✗',
        courseCount: finalSubmitData.courseCount !== undefined ? '✓' : '✗',
        textbook: finalSubmitData.textbook ? '✓' : '✗',
      });
      
      let response;
      if (isEditMode) {
        // 수정 모드: PUT 요청
        response = await api.put(`/courses/${courseId}`, finalSubmitData);
        if (response.data.success) {
          alert('강좌 정보가 성공적으로 수정되었습니다!');
          navigate('/admin', { state: { refresh: true } });
        } else {
          alert(response.data.error || '강좌 수정 중 오류가 발생했습니다');
        }
      } else {
        // 등록 모드: POST 요청
        response = await api.post('/courses', finalSubmitData);
        if (response.data.success) {
          alert('강좌가 성공적으로 등록되었습니다!');
          navigate('/admin', { state: { refresh: true } });
        } else {
          alert(response.data.error || '강좌 등록 중 오류가 발생했습니다');
        }
      }
    } catch (error) {
      console.error(isEditMode ? '강좌 수정 오류:' : '강좌 등록 오류:', error);
      console.error('에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: submitData,
      });
      
      let errorMessage = isEditMode ? '강좌 수정 중 오류가 발생했습니다' : '강좌 등록 중 오류가 발생했습니다';
      if (error.response) {
        const responseError = error.response.data;
        console.error('서버 응답 에러:', responseError);
        if (responseError?.error) {
          errorMessage = Array.isArray(responseError.error) 
            ? responseError.error.join(', ') 
            : responseError.error;
        } else if (responseError?.message) {
          errorMessage = responseError.message;
        } else if (responseError?.details) {
          errorMessage = Array.isArray(responseError.details)
            ? responseError.details.join(', ')
            : responseError.details;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || courseLoading) {
    return (
      <div className="course-register-page">
        <Header />
        <div className="course-register-container">
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
    <div className="course-register-page">
      <Header />
      <div className="course-register-container">
        <div className="course-register-content">
          <h1 className="course-register-title">{isEditMode ? '강좌 정보 수정' : '강좌 등록'}</h1>

          <form onSubmit={handleSubmit} className="course-register-form">
            {/* 강좌 개요 등록 및 수정 */}
            <div className="form-section">
              <h2 className="section-title">강좌 개요 등록 및 수정</h2>
              
              <div className="form-fields-container">
                <div className="form-field-box">
                  <label className="form-label">강좌명</label>
                  <input
                    type="text"
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleChange}
                    className={`form-input ${errors.courseName ? 'input-error' : ''}`}
                    placeholder="강좌명을 입력하세요"
                  />
                  {errors.courseName && <span className="error-message">{errors.courseName}</span>}
                </div>

                <div className="form-field-box">
                  <label className="form-label">강사</label>
                  <select
                    name="instructorId"
                    value={formData.instructorId}
                    onChange={handleChange}
                    className={`form-input form-select ${errors.instructorId ? 'input-error' : ''}`}
                  >
                    <option value="">강사를 선택하세요</option>
                    {instructors.map((instructor) => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.name}
                      </option>
                    ))}
                  </select>
                  {errors.instructorId && <span className="error-message">{errors.instructorId}</span>}
                </div>

                <div className="form-field-box">
                  <label className="form-label">학년</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className={`form-input form-select ${errors.grade ? 'input-error' : ''}`}
                  >
                    <option value="">학년을 선택하세요</option>
                    <option value="중1">중1</option>
                    <option value="중2">중2</option>
                    <option value="중3">중3</option>
                    <option value="고1">고1</option>
                    <option value="고2">고2</option>
                    <option value="고3/N수">고3/N수</option>
                  </select>
                  {errors.grade && <span className="error-message">{errors.grade}</span>}
                </div>

                <div className="form-field-box">
                  <label className="form-label">강의 수</label>
                  <input
                    type="number"
                    name="courseCount"
                    value={formData.courseCount}
                    readOnly
                    className={`form-input form-input-readonly ${errors.courseCount ? 'input-error' : ''}`}
                    placeholder="강의 목차에서 자동으로 계산됩니다"
                    min="1"
                  />
                  {errors.courseCount && <span className="error-message">{errors.courseCount}</span>}
                </div>

                <div className="form-field-box">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className={`form-input ${errors.sku ? 'input-error' : ''}`}
                    placeholder="SKU를 입력하세요 (유니크)"
                  />
                  {errors.sku && <span className="error-message">{errors.sku}</span>}
                </div>

                <div className="form-field-box">
                  <label className="form-label">교재</label>
                  <input
                    type="text"
                    name="textbook"
                    value={formData.textbook}
                    onChange={handleChange}
                    className={`form-input ${errors.textbook ? 'input-error' : ''}`}
                    placeholder="교재명을 입력하세요"
                  />
                  {errors.textbook && <span className="error-message">{errors.textbook}</span>}
                </div>

                <div className="form-field-box">
                  <label className="form-label">교재 유형</label>
                  <div className="tag-buttons">
                    <button
                      type="button"
                      className={`tag-button ${formData.textbookType === '자체교재' ? 'active' : ''}`}
                      onClick={() => handleTagClick('textbookType', '자체교재')}
                    >
                      자체교재
                    </button>
                    <button
                      type="button"
                      className={`tag-button ${formData.textbookType === '시중교재' ? 'active' : ''}`}
                      onClick={() => handleTagClick('textbookType', '시중교재')}
                    >
                      시중교재
                    </button>
                  </div>
                </div>

                <div className="form-field-box">
                  <label className="form-label">강좌 상태</label>
                  <div className="tag-buttons">
                    <button
                      type="button"
                      className={`tag-button ${formData.courseStatus === '완강' ? 'active' : ''}`}
                      onClick={() => handleTagClick('courseStatus', '완강')}
                    >
                      완강
                    </button>
                    <button
                      type="button"
                      className={`tag-button ${formData.courseStatus === '진행중' ? 'active' : ''}`}
                      onClick={() => handleTagClick('courseStatus', '진행중')}
                    >
                      진행중
                    </button>
                  </div>
                </div>

                <div className="form-field-box">
                  <label className="form-label">강좌 유형</label>
                  <div className="tag-buttons">
                    <button
                      type="button"
                      className={`tag-button ${formData.courseType === '정규' ? 'active' : ''}`}
                      onClick={() => handleTagClick('courseType', '정규')}
                    >
                      정규
                    </button>
                    <button
                      type="button"
                      className={`tag-button ${formData.courseType === '특강' ? 'active' : ''}`}
                      onClick={() => handleTagClick('courseType', '특강')}
                    >
                      특강
                    </button>
                  </div>
                </div>

                <div className="form-field-box form-field-box-full">
                  <label className="form-label">강좌 범위</label>
                  <textarea
                    name="courseRange"
                    value={formData.courseRange}
                    onChange={handleChange}
                    className={`form-input form-textarea ${errors.courseRange ? 'input-error' : ''}`}
                    placeholder="강좌 범위를 입력하세요"
                    rows="3"
                  />
                  {errors.courseRange && <span className="error-message">{errors.courseRange}</span>}
                </div>

                <div className="form-field-box form-field-box-full">
                  <label className="form-label">내용 및 특징</label>
                  <textarea
                    name="courseDescription"
                    value={formData.courseDescription}
                    onChange={handleChange}
                    className={`form-input form-textarea ${errors.courseDescription ? 'input-error' : ''}`}
                    placeholder="내용 및 특징을 입력하세요"
                    rows="4"
                  />
                  {errors.courseDescription && <span className="error-message">{errors.courseDescription}</span>}
                </div>

              </div>
            </div>

            {/* 강의 목차 등록 및 수정 */}
            <div className="form-section">
              <h2 className="section-title">강의 목차 등록 및 수정</h2>

              {/* 기존 강의 목록 */}
              {lectures.length > 0 && (
                <div className="lectures-table-container">
                  <table className="lectures-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>순서</th>
                        <th style={{ width: 'auto' }}>강의명</th>
                        <th style={{ width: '120px' }}>시간</th>
                        <th style={{ width: '80px' }}>위로</th>
                        <th style={{ width: '80px' }}>아래로</th>
                        <th style={{ width: '80px' }}>수정</th>
                        <th style={{ width: '80px' }}>삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...lectures].sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0)).map((lecture, index) => {
                        const sortedLectures = [...lectures].sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
                        const currentIndex = sortedLectures.findIndex(l => l === lecture);
                        const canMoveUp = currentIndex > 0;
                        const canMoveDown = currentIndex < sortedLectures.length - 1;
                        const originalIndex = lectures.findIndex(l => l === lecture);
                        
                        return (
                          <tr key={index}>
                            <td>{lecture.lectureNumber ? `${lecture.lectureNumber}강` : `${index + 1}강`}</td>
                            <td style={{ textAlign: 'left' }}>{lecture.lectureTitle}</td>
                            <td>{lecture.duration || '-'}</td>
                            <td>
                              <button
                                type="button"
                                className="btn-move-lecture"
                                onClick={() => {
                                  if (canMoveUp) {
                                    // 정렬된 배열에서 이전 강의와 위치 교환
                                    const updatedLectures = [...sortedLectures];
                                    const temp = updatedLectures[currentIndex];
                                    updatedLectures[currentIndex] = updatedLectures[currentIndex - 1];
                                    updatedLectures[currentIndex - 1] = temp;
                                    
                                    // 1부터 연속적으로 재정렬
                                    const reorderedLectures = updatedLectures.map((l, i) => ({
                                      ...l,
                                      lectureNumber: i + 1
                                    }));
                                    
                                    setLectures(reorderedLectures);
                                  }
                                }}
                                disabled={!canMoveUp}
                                style={{ 
                                  opacity: canMoveUp ? 1 : 0.5,
                                  cursor: canMoveUp ? 'pointer' : 'not-allowed'
                                }}
                              >
                                ↑
                              </button>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-move-lecture"
                                onClick={() => {
                                  if (canMoveDown) {
                                    // 정렬된 배열에서 다음 강의와 위치 교환
                                    const updatedLectures = [...sortedLectures];
                                    const temp = updatedLectures[currentIndex];
                                    updatedLectures[currentIndex] = updatedLectures[currentIndex + 1];
                                    updatedLectures[currentIndex + 1] = temp;
                                    
                                    // 1부터 연속적으로 재정렬
                                    const reorderedLectures = updatedLectures.map((l, i) => ({
                                      ...l,
                                      lectureNumber: i + 1
                                    }));
                                    
                                    setLectures(reorderedLectures);
                                  }
                                }}
                                disabled={!canMoveDown}
                                style={{ 
                                  opacity: canMoveDown ? 1 : 0.5,
                                  cursor: canMoveDown ? 'pointer' : 'not-allowed'
                                }}
                              >
                                ↓
                              </button>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-edit-lecture"
                                onClick={() => {
                                  setEditingLectureIndex(originalIndex);
                                  setNewLecture({
                                    lectureNumber: lecture.lectureNumber || (originalIndex + 1),
                                    lectureTitle: lecture.lectureTitle,
                                    duration: lecture.duration,
                                    videoLink: lecture.videoLink,
                                  });
                                  setShowLectureModal(true);
                                }}
                              >
                                수정
                              </button>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-delete-lecture"
                                onClick={() => {
                                  if (window.confirm('정말 이 강의를 삭제하시겠습니까?')) {
                                    const updatedLectures = lectures.filter((_, i) => i !== originalIndex);
                                    // 순서 재정렬
                                    const reorderedLectures = updatedLectures.map((l, i) => ({
                                      ...l,
                                      lectureNumber: i + 1
                                    }));
                                    setLectures(reorderedLectures);
                                  }
                                }}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 새 강의 추가 버튼 */}
              <div className="add-lecture-button-container">
                <button
                  type="button"
                  className="btn-add-lecture"
                  onClick={() => {
                    setEditingLectureIndex(null);
                    setShowLectureModal(true);
                    // 항상 마지막 순서로 추가 (현재 강의 개수 + 1)
                    setNewLecture({
                      lectureNumber: lectures.length + 1,
                      lectureTitle: '',
                      duration: '',
                      videoLink: '',
                    });
                  }}
                >
                  <i className="fas fa-plus"></i>
                  강의 추가
                </button>
              </div>
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
                {isSubmitting ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '강좌 수정' : '강좌 등록')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 강의 추가/수정 모달 */}
      {showLectureModal && (
        <div className="modal-overlay" onClick={() => {
          setShowLectureModal(false);
          setNewLecture({ lectureNumber: '', lectureTitle: '', duration: '', videoLink: '' });
          setEditingLectureIndex(null);
        }}>
          <div className="modal-container lecture-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingLectureIndex !== null ? '강의 수정' : '강의 추가'}
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowLectureModal(false);
                  setNewLecture({ lectureNumber: '', lectureTitle: '', duration: '', videoLink: '' });
                  setEditingLectureIndex(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="lecture-form">
                    <div className="form-group">
                      <label className="form-label">순서 (회차)</label>
                      <input
                        type="number"
                        min="1"
                        value={newLecture.lectureNumber}
                        onChange={(e) => setNewLecture({ ...newLecture, lectureNumber: parseInt(e.target.value) || '' })}
                        className="form-input"
                        placeholder="강의 순서를 입력하세요"
                      />
                  </div>

                    <div className="form-group">
                      <label className="form-label">영상제목</label>
                      <input
                        type="text"
                        value={newLecture.lectureTitle}
                        onChange={(e) => setNewLecture({ ...newLecture, lectureTitle: e.target.value })}
                        className="form-input"
                        placeholder="영상제목을 입력하세요"
                      />
                  </div>

                    <div className="form-group">
                      <label className="form-label">시간</label>
                      <input
                        type="text"
                        value={newLecture.duration}
                        onChange={(e) => setNewLecture({ ...newLecture, duration: e.target.value })}
                        className="form-input"
                        placeholder="예: 1:16:57 (선택사항)"
                      />
                  </div>

                    <div className="form-group">
                      <label className="form-label">영상링크</label>
                      <input
                        type="url"
                        value={newLecture.videoLink}
                        onChange={(e) => setNewLecture({ ...newLecture, videoLink: e.target.value })}
                        className="form-input"
                        placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                      />
                    </div>
                  </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel-lecture"
                onClick={() => {
                  setShowLectureModal(false);
                  setNewLecture({ lectureNumber: '', lectureTitle: '', duration: '', videoLink: '' });
                  setEditingLectureIndex(null);
                }}
              >
                취소
              </button>
                    <button
                      type="button"
                      className="btn-save-lecture"
                      onClick={() => {
                        if (!newLecture.lectureNumber || newLecture.lectureNumber < 1) {
                          alert('순서(회차)를 입력해주세요.');
                          return;
                        }
                        if (!newLecture.lectureTitle.trim()) {
                          alert('영상제목을 입력해주세요.');
                          return;
                        }
                        if (!newLecture.videoLink.trim()) {
                          alert('영상링크를 입력해주세요.');
                          return;
                        }
                        if (editingLectureIndex !== null) {
                          // 수정
                          const updatedLectures = [...lectures];
                          updatedLectures[editingLectureIndex] = {
                            lectureNumber: Number(newLecture.lectureNumber),
                            lectureTitle: newLecture.lectureTitle.trim(),
                            duration: newLecture.duration ? newLecture.duration.trim() : '',
                            videoLink: newLecture.videoLink.trim(),
                          };
                          // lectureNumber 기준으로 정렬 후 1부터 연속적으로 재정렬
                          const sortedLectures = [...updatedLectures].sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
                          const reorderedLectures = sortedLectures.map((l, i) => ({
                            ...l,
                            lectureNumber: i + 1
                          }));
                          setLectures(reorderedLectures);
                        } else {
                          // 추가
                          const newLectures = [...lectures, {
                            lectureNumber: Number(newLecture.lectureNumber),
                            lectureTitle: newLecture.lectureTitle.trim(),
                            duration: newLecture.duration ? newLecture.duration.trim() : '',
                            videoLink: newLecture.videoLink.trim(),
                          }];
                          // lectureNumber 기준으로 정렬 후 1부터 연속적으로 재정렬
                          const sortedLectures = [...newLectures].sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));
                          const reorderedLectures = sortedLectures.map((l, i) => ({
                            ...l,
                            lectureNumber: i + 1
                          }));
                          setLectures(reorderedLectures);
                        }
                        setNewLecture({ lectureNumber: '', lectureTitle: '', duration: '', videoLink: '' });
                        setEditingLectureIndex(null);
                  setShowLectureModal(false);
                      }}
                    >
                      {editingLectureIndex !== null ? '수정 완료' : '추가'}
                    </button>
                  </div>
                </div>
            </div>
      )}

      <Footer />
    </div>
  );
}

export default CourseRegister;

