import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './ClassRecordManage.css';

function ClassRecordManage() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    className: '',
    progress: '',
    assignment: '',
    hasVideo: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentUsers, setStudentUsers] = useState([]); // 학생만
  const [usersLoading, setUsersLoading] = useState(false);
  const [studentRecords, setStudentRecords] = useState({}); // { userId: record }
  const [studentRecordsLoading, setStudentRecordsLoading] = useState(false);
  const [studentFormData, setStudentFormData] = useState({}); // { userId: { attendance, assignment, dailyTestScore, monthlyEvaluationScore, hasClinic } }
  const [savingUsers, setSavingUsers] = useState({}); // { userId: boolean }
  const [dailyTestTotal, setDailyTestTotal] = useState(''); // 리뷰TEST 총 문제수
  const [monthlyEvalTotal, setMonthlyEvalTotal] = useState(''); // 실전TEST 총 문제수

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
      } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        alert('사용자 정보를 확인할 수 없습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
    
    if (classId) {
      fetchClassData();
    }
  }, [navigate, classId]);

  useEffect(() => {
    if (classData && selectedDate) {
      // 날짜가 변경될 때 폼 데이터 초기화
      setStudentFormData({});
      setFormData({
        className: classData.className,
        progress: '',
        assignment: '',
        hasVideo: false,
      });
      setEditingRecord(null);
      setStudentRecords({});
      setDailyTestTotal('');
      setMonthlyEvalTotal('');
      
      // 해당 날짜의 데이터 불러오기
      fetchRecords();
      fetchStudentRecords();
    }
  }, [classData, selectedDate]);

  const fetchClassData = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get(`/classes/${classId}`);
      if (response.data.success) {
        setClassData(response.data.data);
        setFormData((prev) => ({
          ...prev,
          className: response.data.data.className,
        }));
        if (response.data.data.students && Array.isArray(response.data.data.students)) {
          // 학생만 필터링
          const students = [];
          const initialFormData = {};
          
          response.data.data.students.forEach((user) => {
            const userId = user._id || user;
            const userType = user.userType || (typeof user === 'object' ? user.userType : null);
            
            if (userType === '학생') {
              students.push(user);
              // 학생에 대한 폼 데이터 초기화 (기본값 없음)
              initialFormData[userId] = {
                attendance: undefined,
                assignment: undefined,
                dailyTestScore: '',
                monthlyEvaluationScore: '',
                hasClinic: undefined,
              };
            }
          });
          
          setStudentUsers(students);
          setStudentFormData(initialFormData);
        } else {
          setStudentUsers([]);
          setParentUsers([]);
        }
      }
    } catch (error) {
      console.error('반 정보 가져오기 오류:', error);
      alert('반 정보를 불러오는 중 오류가 발생했습니다.');
      navigate('/admin');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setRecordsLoading(true);
      const response = await api.get(`/class-records?classId=${classId}&date=${selectedDate}`);
      if (response.data.success) {
        const records = response.data.data || [];
        if (records.length > 0) {
          const record = records[0];
          setEditingRecord(record);
          setFormData({
            className: record.className,
            progress: record.progress || '',
            assignment: record.assignment || '',
            hasVideo: record.hasVideo || false,
          });
        } else {
          setEditingRecord(null);
          setFormData({
            className: classData.className,
            progress: '',
            assignment: '',
            hasVideo: false,
          });
        }
      }
    } catch (error) {
      console.error('교실관리 기록 가져오기 오류:', error);
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchStudentRecords = async () => {
    try {
      setStudentRecordsLoading(true);
      const response = await api.get(`/student-records?classId=${classId}&date=${selectedDate}`);
      if (response.data.success) {
        const recordsMap = {};
        const formDataMap = {};
        let foundDailyTestTotal = '';
        let foundMonthlyEvalTotal = '';
        
        response.data.data.forEach((record) => {
          const studentId = record.studentId._id || record.studentId;
          recordsMap[studentId] = record;
          
          // 리뷰TEST 점수 처리 (맞은개수/총문항수 형식에서 맞은 개수만 추출)
          let dailyTestCorrect = '';
          if (record.dailyTestScore !== null && record.dailyTestScore !== undefined) {
            const dailyTestStr = String(record.dailyTestScore);
            if (dailyTestStr.includes('/')) {
              const [correct, total] = dailyTestStr.split('/').map(Number);
              dailyTestCorrect = String(correct);
              if (!foundDailyTestTotal && total) {
                foundDailyTestTotal = String(total);
              }
            } else {
              dailyTestCorrect = dailyTestStr;
            }
          }
          
          // 실전TEST 점수 처리 (맞은개수/총문항수 형식에서 맞은 개수만 추출)
          let monthlyEvalCorrect = '';
          if (record.monthlyEvaluationScore !== null && record.monthlyEvaluationScore !== undefined) {
            const monthlyEvalStr = String(record.monthlyEvaluationScore);
            if (monthlyEvalStr.includes('/')) {
              const [correct, total] = monthlyEvalStr.split('/').map(Number);
              monthlyEvalCorrect = String(correct);
              if (!foundMonthlyEvalTotal && total) {
                foundMonthlyEvalTotal = String(total);
              }
            } else {
              monthlyEvalCorrect = monthlyEvalStr;
            }
          }
          
          formDataMap[studentId] = {
            attendance: record.attendance !== undefined && record.attendance !== null ? record.attendance : undefined,
            assignment: record.assignment !== undefined && record.assignment !== null ? record.assignment : undefined,
            dailyTestScore: dailyTestCorrect,
            monthlyEvaluationScore: monthlyEvalCorrect,
            hasClinic: record.hasClinic !== undefined && record.hasClinic !== null ? record.hasClinic : undefined,
          };
        });
        
        // 총 문제수 설정
        if (foundDailyTestTotal) {
          setDailyTestTotal(foundDailyTestTotal);
        }
        if (foundMonthlyEvalTotal) {
          setMonthlyEvalTotal(foundMonthlyEvalTotal);
        }
        setStudentRecords(recordsMap);
        // 해당 날짜의 데이터만 설정 (기존 데이터와 병합하지 않음)
        const newFormData = {};
        studentUsers.forEach((user) => {
          const userId = user._id || user;
          if (formDataMap[userId]) {
            // 해당 날짜에 데이터가 있는 경우
            newFormData[userId] = formDataMap[userId];
          } else {
            // 해당 날짜에 데이터가 없는 경우 빈 값으로 초기화
            newFormData[userId] = {
              attendance: undefined,
              assignment: undefined,
              dailyTestScore: '',
              monthlyEvaluationScore: '',
              hasClinic: undefined,
            };
          }
        });
        setStudentFormData(newFormData);
      }
    } catch (error) {
      console.error('학생 기록 가져오기 오류:', error);
    } finally {
      setStudentRecordsLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.className.trim()) {
      newErrors.className = '반명을 입력해주세요';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClassRecord = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        date: selectedDate,
        classId: classId,
        className: formData.className.trim(),
        progress: formData.progress.trim(),
        assignment: formData.assignment.trim(),
        hasVideo: formData.hasVideo,
      };

      let response;
      if (editingRecord) {
        response = await api.put(`/class-records/${editingRecord._id}`, submitData);
      } else {
        response = await api.post('/class-records', submitData);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || '교실관리 기록 저장 중 오류가 발생했습니다.');
      }
      return true;
    } catch (error) {
      console.error('교실관리 기록 저장 오류:', error);
      let errorMessage = '교실관리 기록 저장 중 오류가 발생했습니다.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
        if (error.response.data?.details) {
          errorMessage += '\n' + error.response.data.details.join('\n');
        }
      }
      throw new Error(errorMessage);
    }
  };

  // 학생의 연동된 학부모 계정 찾기
  const findLinkedParent = async (student) => {
    try {
      // 부모님 연락처로 학부모 계정 찾기 (부모님 연락처가 학부모 userId)
      if (student.parentContact) {
        const response = await api.get(`/users/userId/${student.parentContact}`);
        if (response.data.success && response.data.data) {
          const parent = response.data.data;
          if (parent.userType === '학부모') {
            return parent;
          }
        }
      }
      return null;
    } catch (error) {
      // 학부모 계정을 찾지 못한 경우 (404 등)는 null 반환
      return null;
    }
  };

  const handleSaveUserRecord = async (userId) => {
    const formData = studentFormData[userId];
    if (!formData) return true;

    // 출결, 과제, 클리닉여부가 모두 선택되지 않았고, 점수도 입력되지 않았으면 저장하지 않음
    const hasAnyData = 
      formData.attendance !== undefined && formData.attendance !== null ||
      formData.assignment !== undefined && formData.assignment !== null ||
      formData.hasClinic !== undefined && formData.hasClinic !== null ||
      (formData.dailyTestScore && formData.dailyTestScore.trim() !== '') ||
      (formData.monthlyEvaluationScore && formData.monthlyEvaluationScore.trim() !== '');

    if (!hasAnyData) {
      // 기존 기록이 있으면 삭제
      const record = studentRecords[userId];
      if (record) {
        try {
          await api.delete(`/student-records/${record._id}`);
        } catch (error) {
          console.error('기록 삭제 오류:', error);
        }
      }
      return true;
    }

    try {
      const record = studentRecords[userId];
      // 리뷰TEST 점수 처리 (맞은 개수 + 총 문제수)
      let dailyTestScoreValue = null;
      if (formData.dailyTestScore && formData.dailyTestScore.trim() !== '' && dailyTestTotal && dailyTestTotal.trim() !== '') {
        dailyTestScoreValue = `${formData.dailyTestScore.trim()}/${dailyTestTotal.trim()}`;
      } else if (formData.dailyTestScore && formData.dailyTestScore.trim() !== '') {
        // 총 문제수가 없으면 맞은 개수만 저장 (기존 형식 유지)
        dailyTestScoreValue = formData.dailyTestScore.trim();
      }
      
      // 실전TEST 점수 처리 (맞은 개수 + 총 문제수)
      let monthlyEvalScoreValue = null;
      if (formData.monthlyEvaluationScore && formData.monthlyEvaluationScore.trim() !== '' && monthlyEvalTotal && monthlyEvalTotal.trim() !== '') {
        monthlyEvalScoreValue = `${formData.monthlyEvaluationScore.trim()}/${monthlyEvalTotal.trim()}`;
      } else if (formData.monthlyEvaluationScore && formData.monthlyEvaluationScore.trim() !== '') {
        // 총 문제수가 없으면 맞은 개수만 저장 (기존 형식 유지)
        monthlyEvalScoreValue = formData.monthlyEvaluationScore.trim();
      }
      
      const submitData = {
        date: selectedDate,
        studentId: userId,
        classId: classId,
        attendance: formData.attendance !== undefined && formData.attendance !== null ? formData.attendance : undefined,
        assignment: formData.assignment !== undefined && formData.assignment !== null ? formData.assignment : undefined,
        dailyTestScore: dailyTestScoreValue,
        monthlyEvaluationScore: monthlyEvalScoreValue,
        hasClinic: formData.hasClinic !== undefined && formData.hasClinic !== null ? formData.hasClinic : undefined,
      };

      let response;
      if (record) {
        response = await api.put(`/student-records/${record._id}`, submitData);
      } else {
        response = await api.post('/student-records', submitData);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || '기록 저장 중 오류가 발생했습니다.');
      }
      return true;
    } catch (error) {
      console.error('기록 저장 오류:', error);
      let errorMessage = '기록 저장 중 오류가 발생했습니다.';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
        if (error.response.data?.details) {
          errorMessage += '\n' + error.response.data.details.join('\n');
        }
      }
      throw new Error(errorMessage);
    }
  };

  // 일괄 초기화 함수
  const handleBatchReset = async () => {
    if (!selectedDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    // 확인 다이얼로그
    const confirmMessage = `정말로 ${selectedDate} 날짜의 모든 기록을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    const errors = [];

    try {
      // 1. 교실관리 기록 삭제
      if (editingRecord) {
        try {
          await api.delete(`/class-records/${editingRecord._id}`);
        } catch (error) {
          console.error('교실관리 기록 삭제 오류:', error);
          errors.push(`교실관리 기록 삭제: ${error.response?.data?.error || error.message}`);
        }
      }

      // 2. 모든 학생 기록 삭제
      for (const student of studentUsers) {
        const userId = student._id || student;
        const record = studentRecords[userId];
        
        if (record) {
          try {
            await api.delete(`/student-records/${record._id}`);
          } catch (error) {
            console.error(`학생 ${student.name || student.userId} 기록 삭제 오류:`, error);
            errors.push(`학생 ${student.name || student.userId} 기록 삭제: ${error.response?.data?.error || error.message}`);
          }
        }
      }

      // 3. 연동된 학부모 기록도 삭제
      for (const student of studentUsers) {
        const linkedParent = await findLinkedParent(student);
        if (linkedParent) {
          const parentId = linkedParent._id;
          // 학부모 기록 확인
          try {
            const parentRecordResponse = await api.get(`/student-records?classId=${classId}&date=${selectedDate}&studentId=${parentId}`);
            if (parentRecordResponse.data.success && parentRecordResponse.data.data.length > 0) {
              const parentRecord = parentRecordResponse.data.data[0];
              try {
                await api.delete(`/student-records/${parentRecord._id}`);
              } catch (error) {
                console.error(`학부모 ${linkedParent.name} 기록 삭제 오류:`, error);
                // 학부모 기록 삭제 실패는 에러에 포함하지 않음
              }
            }
          } catch (error) {
            console.error(`학부모 기록 조회 오류:`, error);
            // 조회 실패는 무시
          }
        }
      }

      // 결과 메시지
      if (errors.length === 0) {
        alert('모든 기록이 성공적으로 삭제되었습니다.');
        // 폼 데이터 초기화
        setFormData({
          className: classData.className || '',
          progress: '',
          assignment: '',
          hasVideo: false,
        });
        setEditingRecord(null);
        setStudentFormData({});
        setStudentRecords({});
        // 데이터 새로고침
        fetchRecords();
        fetchStudentRecords();
      } else {
        alert(`일부 기록 삭제 중 오류가 발생했습니다:\n\n${errors.join('\n')}`);
        // 일부라도 성공했으면 데이터 새로고침
        fetchRecords();
        fetchStudentRecords();
      }
    } catch (error) {
      console.error('일괄 초기화 오류:', error);
      alert('일괄 초기화 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 일괄 저장 함수
  const handleBatchSave = async () => {
    if (!selectedDate) {
      alert('날짜를 선택해주세요.');
      return;
    }

    if (!validateForm()) {
      alert('반명을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    const errors = [];

    try {
      // 1. 교실관리 기록 저장
      try {
        await handleSaveClassRecord();
      } catch (error) {
        errors.push(`교실관리 기록: ${error.message}`);
      }

      // 2. 모든 학생 기록 저장 및 연동된 학부모 계정에도 자동 저장
      // 학생 기록이 있는 경우에만 저장
      for (const student of studentUsers) {
        const userId = student._id || student;
        const studentData = studentFormData[userId];
        
        // 학생 기록이 입력된 경우에만 저장 (출결, 과제, 클리닉은 true/false 값이 있어야 하고, 점수는 빈 문자열이 아니어야 함)
        const hasAnyData = 
          (studentData.attendance !== undefined && studentData.attendance !== null) ||
          (studentData.assignment !== undefined && studentData.assignment !== null) ||
          (studentData.hasClinic !== undefined && studentData.hasClinic !== null) ||
          (studentData.dailyTestScore && studentData.dailyTestScore.trim() !== '') ||
          (studentData.monthlyEvaluationScore && studentData.monthlyEvaluationScore.trim() !== '');

        if (studentData && hasAnyData) {
          try {
            await handleSaveUserRecord(userId);
          
            // 연동된 학부모 계정 찾기 및 같은 데이터로 저장
            const linkedParent = await findLinkedParent(student);
            if (linkedParent) {
              const parentId = linkedParent._id;
              // 학생과 같은 폼 데이터를 학부모에도 적용
              const studentFormDataCopy = { ...studentFormData[userId] };
              
              // 학부모 기록 저장 (학생과 동일한 데이터)
              try {
                // 학부모의 기존 기록 확인
                const parentRecordResponse = await api.get(`/student-records?classId=${classId}&date=${selectedDate}&studentId=${parentId}`);
                const existingParentRecord = parentRecordResponse.data.success && parentRecordResponse.data.data.length > 0 
                  ? parentRecordResponse.data.data[0] 
                  : null;
                
                // 리뷰TEST 점수 처리 (맞은 개수 + 총 문제수)
                let parentDailyTestScoreValue = null;
                if (studentFormDataCopy.dailyTestScore && studentFormDataCopy.dailyTestScore.trim() !== '' && dailyTestTotal && dailyTestTotal.trim() !== '') {
                  parentDailyTestScoreValue = `${studentFormDataCopy.dailyTestScore.trim()}/${dailyTestTotal.trim()}`;
                } else if (studentFormDataCopy.dailyTestScore && studentFormDataCopy.dailyTestScore.trim() !== '') {
                  parentDailyTestScoreValue = studentFormDataCopy.dailyTestScore.trim();
                }
                
                // 실전TEST 점수 처리 (맞은 개수 + 총 문제수)
                let parentMonthlyEvalScoreValue = null;
                if (studentFormDataCopy.monthlyEvaluationScore && studentFormDataCopy.monthlyEvaluationScore.trim() !== '' && monthlyEvalTotal && monthlyEvalTotal.trim() !== '') {
                  parentMonthlyEvalScoreValue = `${studentFormDataCopy.monthlyEvaluationScore.trim()}/${monthlyEvalTotal.trim()}`;
                } else if (studentFormDataCopy.monthlyEvaluationScore && studentFormDataCopy.monthlyEvaluationScore.trim() !== '') {
                  parentMonthlyEvalScoreValue = studentFormDataCopy.monthlyEvaluationScore.trim();
                }
                
                const parentSubmitData = {
                  date: selectedDate,
                  studentId: parentId,
                  classId: classId,
                  attendance: studentFormDataCopy.attendance !== undefined && studentFormDataCopy.attendance !== null ? studentFormDataCopy.attendance : undefined,
                  assignment: studentFormDataCopy.assignment !== undefined && studentFormDataCopy.assignment !== null ? studentFormDataCopy.assignment : undefined,
                  dailyTestScore: parentDailyTestScoreValue,
                  monthlyEvaluationScore: parentMonthlyEvalScoreValue,
                  hasClinic: studentFormDataCopy.hasClinic !== undefined && studentFormDataCopy.hasClinic !== null ? studentFormDataCopy.hasClinic : undefined,
                };

                let parentResponse;
                if (existingParentRecord) {
                  parentResponse = await api.put(`/student-records/${existingParentRecord._id}`, parentSubmitData);
                } else {
                  parentResponse = await api.post('/student-records', parentSubmitData);
                }

                if (!parentResponse.data.success) {
                  throw new Error(parentResponse.data.error || '학부모 기록 저장 중 오류가 발생했습니다.');
                }
              } catch (parentError) {
                console.error(`학부모 ${linkedParent.name} 기록 저장 오류:`, parentError);
                // 학부모 기록 저장 실패는 에러에 포함하지 않음 (학생 기록은 성공)
              }
            }
          } catch (error) {
            const studentName = student.name || student.userId || '알 수 없음';
            errors.push(`학생 ${studentName}: ${error.message}`);
          }
        }
      }

      // 결과 메시지
      if (errors.length === 0) {
        alert('모든 기록이 성공적으로 저장되었습니다.');
        fetchRecords();
        fetchStudentRecords();
      } else {
        alert(`일부 기록 저장 중 오류가 발생했습니다:\n\n${errors.join('\n')}`);
        // 일부라도 성공했으면 데이터 새로고침
        fetchRecords();
        fetchStudentRecords();
      }
    } catch (error) {
      console.error('일괄 저장 오류:', error);
      alert('일괄 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentFieldChange = (userId, field, value) => {
    setStudentFormData((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  // 일괄 선택 함수 (토글 기능 포함)
  const handleBatchSelect = (field, value) => {
    const newFormData = { ...studentFormData };
    
    // 모든 학생이 이미 해당 값으로 설정되어 있는지 확인
    let allHaveSameValue = true;
    let hasAnyData = false;
    
    studentUsers.forEach((user) => {
      const userId = user._id || user;
      const currentData = newFormData[userId] || {
        attendance: undefined,
        assignment: undefined,
        dailyTestScore: '',
        monthlyEvaluationScore: '',
        hasClinic: undefined,
      };
      
      if (currentData[field] !== undefined && currentData[field] !== null) {
        hasAnyData = true;
      }
      
      if (currentData[field] !== value) {
        allHaveSameValue = false;
      }
    });
    
    // 모든 학생이 이미 해당 값으로 설정되어 있으면 미적용(undefined)으로 변경
    const newValue = (allHaveSameValue && hasAnyData) ? undefined : value;
    
    studentUsers.forEach((user) => {
      const userId = user._id || user;
      if (!newFormData[userId]) {
        newFormData[userId] = {
          attendance: undefined,
          assignment: undefined,
          dailyTestScore: '',
          monthlyEvaluationScore: '',
          hasClinic: undefined,
        };
      }
      newFormData[userId][field] = newValue;
    });
    
    setStudentFormData(newFormData);
  };

  // 사용자 목록을 테이블로 렌더링하는 함수
  const renderUserTable = (users, userTypeLabel) => {
    if (users.length === 0) {
      return (
        <div className="empty-state">
          <p>이 반에 등록된 {userTypeLabel}이 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="students-records-table-container">
        <table className="students-records-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>반명</th>
              <th>이름</th>
              <th>ID</th>
              <th>학교</th>
              <th>
                출결
                <div className="batch-select-buttons">
                  <button
                    type="button"
                    className="batch-select-btn batch-select-o"
                    onClick={() => handleBatchSelect('attendance', true)}
                    title="모든 학생 출결을 O로 설정"
                  >
                    전체 O
                  </button>
                  <button
                    type="button"
                    className="batch-select-btn batch-select-x"
                    onClick={() => handleBatchSelect('attendance', false)}
                    title="모든 학생 출결을 X로 설정"
                  >
                    전체 X
                  </button>
                </div>
              </th>
              <th>
                과제
                <div className="batch-select-buttons">
                  <button
                    type="button"
                    className="batch-select-btn batch-select-o"
                    onClick={() => handleBatchSelect('assignment', true)}
                    title="모든 학생 과제를 O로 설정"
                  >
                    전체 O
                  </button>
                  <button
                    type="button"
                    className="batch-select-btn batch-select-x"
                    onClick={() => handleBatchSelect('assignment', false)}
                    title="모든 학생 과제를 X로 설정"
                  >
                    전체 X
                  </button>
                </div>
              </th>
              <th>
                리뷰TEST
                <div className="total-questions-input-group">
                  <label className="total-questions-label">총 문제수:</label>
                  <input
                    type="number"
                    className="total-questions-input"
                    placeholder="총 문제수"
                    value={dailyTestTotal}
                    onChange={(e) => setDailyTestTotal(e.target.value)}
                    min="1"
                  />
                </div>
              </th>
              <th>
                실전TEST
                <div className="total-questions-input-group">
                  <label className="total-questions-label">총 문제수:</label>
                  <input
                    type="number"
                    className="total-questions-input"
                    placeholder="총 문제수"
                    value={monthlyEvalTotal}
                    onChange={(e) => setMonthlyEvalTotal(e.target.value)}
                    min="1"
                  />
                </div>
              </th>
              <th>
                클리닉
                <div className="batch-select-buttons">
                  <button
                    type="button"
                    className="batch-select-btn batch-select-o"
                    onClick={() => handleBatchSelect('hasClinic', true)}
                    title="모든 학생 클리닉을 O로 설정"
                  >
                    전체 O
                  </button>
                  <button
                    type="button"
                    className="batch-select-btn batch-select-x"
                    onClick={() => handleBatchSelect('hasClinic', false)}
                    title="모든 학생 클리닉을 X로 설정"
                  >
                    전체 X
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const userId = user._id || user;
              const userName = user.name || '알 수 없음';
              const userUserId = user.userId || '알 수 없음';
              const userSchoolName = user.schoolName || '-';
              const formData = studentFormData[userId] || {
                attendance: undefined,
                assignment: undefined,
                dailyTestScore: '',
                monthlyEvaluationScore: '',
                hasClinic: undefined,
              };
              return (
                <tr key={userId}>
                  <td>{classData.grade}</td>
                  <td>{classData.className}</td>
                  <td>{userName}</td>
                  <td>
                    <span className="student-id">{userUserId}</span>
                  </td>
                  <td>{userSchoolName}</td>
                  <td>
                    <div className="ox-buttons">
                      <button
                        type="button"
                        className={`ox-button ${formData.attendance === true ? 'active' : ''}`}
                        onClick={() => handleStudentFieldChange(userId, 'attendance', formData.attendance === true ? undefined : true)}
                      >
                        O
                      </button>
                      <button
                        type="button"
                        className={`ox-button ${formData.attendance === false ? 'active' : ''}`}
                        onClick={() => handleStudentFieldChange(userId, 'attendance', formData.attendance === false ? undefined : false)}
                      >
                        X
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="ox-buttons">
                      <button
                        type="button"
                        className={`ox-button ${formData.assignment === true ? 'active' : ''}`}
                        onClick={() => handleStudentFieldChange(userId, 'assignment', formData.assignment === true ? undefined : true)}
                      >
                        O
                      </button>
                      <button
                        type="button"
                        className={`ox-button ${formData.assignment === false ? 'active' : ''}`}
                        onClick={() => handleStudentFieldChange(userId, 'assignment', formData.assignment === false ? undefined : false)}
                      >
                        X
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="score-input-group">
                      <input
                        type="number"
                        className="score-input"
                        placeholder="맞은 개수"
                        value={formData.dailyTestScore}
                        onChange={(e) => handleStudentFieldChange(userId, 'dailyTestScore', e.target.value)}
                        min="0"
                        max={dailyTestTotal || undefined}
                      />
                      {dailyTestTotal && (
                        <span className="score-total">/ {dailyTestTotal}</span>
                      )}
                      <span className="score-unit">점</span>
                    </div>
                  </td>
                  <td>
                    <div className="score-input-group">
                      <input
                        type="number"
                        className="score-input"
                        placeholder="맞은 개수"
                        value={formData.monthlyEvaluationScore}
                        onChange={(e) => handleStudentFieldChange(userId, 'monthlyEvaluationScore', e.target.value)}
                        min="0"
                        max={monthlyEvalTotal || undefined}
                      />
                      {monthlyEvalTotal && (
                        <span className="score-total">/ {monthlyEvalTotal}</span>
                      )}
                      <span className="score-unit">점</span>
                    </div>
                  </td>
                  <td>
                    <div className="ox-buttons">
                      <button
                        type="button"
                        className={`ox-button ${formData.hasClinic === true ? 'active' : ''}`}
                        onClick={() => handleStudentFieldChange(userId, 'hasClinic', formData.hasClinic === true ? undefined : true)}
                      >
                        O
                      </button>
                      <button
                        type="button"
                        className={`ox-button ${formData.hasClinic === false ? 'active' : ''}`}
                        onClick={() => handleStudentFieldChange(userId, 'hasClinic', formData.hasClinic === false ? undefined : false)}
                      >
                        X
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="class-record-manage-page">
        <Header />
        <div className="loading">로딩 중...</div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin || !classData) {
    return null;
  }

  return (
    <div className="class-record-manage-page">
      <Header />
      <div className="class-record-manage-container">
        <div className="class-record-manage-content">
          <div className="page-header">
            <h1 className="page-title">교실관리 - {classData.grade} {classData.className}</h1>
            <button 
              className="btn-back"
              onClick={() => navigate('/admin')}
            >
              목록으로
            </button>
          </div>

          {/* 날짜 선택 */}
          <div className="date-selector-section">
            <label className="date-selector-label">날짜 선택</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="date-selector-input"
            />
          </div>

          {/* 일괄 저장 및 초기화 버튼 */}
          <div className="batch-save-section">
            <button
              type="button"
              className="btn-batch-save"
              onClick={handleBatchSave}
              disabled={isSubmitting || !selectedDate}
            >
              {isSubmitting ? '저장 중...' : '일괄 저장하기'}
            </button>
            <button
              type="button"
              className="btn-batch-reset"
              onClick={handleBatchReset}
              disabled={isSubmitting || !selectedDate}
            >
              {isSubmitting ? '초기화 중...' : '일괄 초기화'}
            </button>
          </div>

          {/* 섹션 1: 교실관리 기능 등록 */}
          <div className="record-form-section">
            <h2 className="section-title">교실관리 기능 등록</h2>
            <form className="record-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">반명</label>
                  <input
                    type="text"
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    className={`form-input ${errors.className ? 'input-error' : ''}`}
                    required
                  />
                  {errors.className && <span className="error-message">{errors.className}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">진도</label>
                <input
                  type="text"
                  name="progress"
                  value={formData.progress}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="진도를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label className="form-label">과제</label>
                <input
                  type="text"
                  name="assignment"
                  value={formData.assignment}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="과제를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label className="form-label">영상여부</label>
                <div className="video-options">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="hasVideo"
                      value="true"
                      checked={formData.hasVideo === true}
                      onChange={() => setFormData((prev) => ({ ...prev, hasVideo: true }))}
                    />
                    <span>O</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="hasVideo"
                      value="false"
                      checked={formData.hasVideo === false}
                      onChange={() => setFormData((prev) => ({ ...prev, hasVideo: false }))}
                    />
                    <span>X</span>
                  </label>
                </div>
              </div>

            </form>
          </div>

          {/* 섹션 2: 학생별 기록 관리 */}
          <div className="student-records-section">
            <h2 className="section-title">학생별 기록 관리</h2>
            {usersLoading ? (
              <div className="loading">학생 목록을 불러오는 중...</div>
            ) : (
              renderUserTable(studentUsers, '학생')
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ClassRecordManage;
