import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './ClassRecordManage.css';

// 과목별 대단원/소단원 데이터 구조
const subjectData = {
  '중1-1': {
    mainUnits: [
      {
        name: '수와 연산',
        subUnits: ['소인수분해', '최대공약수와 최소공배수']
      },
      {
        name: '정수와 유리수',
        subUnits: ['정수와 유리수', '정수와 유리수의 계산']
      },
      {
        name: '문자와 식',
        subUnits: ['문자의 사용과 식의 계산', '일차방정식', '일차방정식의 활용']
      },
      {
        name: '좌표평면과 그래프',
        subUnits: ['좌표평면과 그래프', '정비례와 반비례']
      }
    ]
  },
  '중1-2': {
    mainUnits: [
      {
        name: '기본 도형과 작도',
        subUnits: ['기본 도형', '위치 관계', '작도와 합동']
      },
      {
        name: '평면도형의 성질',
        subUnits: ['다각형', '원과 부채꼴']
      },
      {
        name: '입체도형의 성질',
        subUnits: ['다면체와 회전체', '입체도형의 겉넓이와 부피']
      },
      {
        name: '자료의 정리와 해석',
        subUnits: ['자료의 정리와 해석']
      }
    ]
  },
  '중2-1': {
    mainUnits: [
      {
        name: '수와 식',
        subUnits: ['유리수와 순환소수', '식의 계산']
      },
      {
        name: '부등식',
        subUnits: ['일차부등식', '일차부등식의 활용']
      },
      {
        name: '방정식',
        subUnits: ['연립일차방정식', '연립방정식의 풀이', '연립방정식의 활용']
      },
      {
        name: '함수',
        subUnits: ['일차함수와 그래프(1)', '일차함수와 그래프(2)', '일차함수와 일차방정식의 관계']
      }
    ]
  },
  '중2-2': {
    mainUnits: [
      {
        name: '도형의 성질',
        subUnits: ['삼각형의 성질', '사각형의 성질']
      },
      {
        name: '도형의 닮음',
        subUnits: ['도형의 닮음', '닮은 도형의 성질', '피타고라스 정리']
      },
      {
        name: '확률',
        subUnits: ['경우의 수와 확률']
      }
    ]
  },
  '중3-1': {
    mainUnits: [
      {
        name: '실수와 그 계산',
        subUnits: ['제곱근과 실수', '근호를 포함한 식의 계산']
      },
      {
        name: '다항식의 곱셈과 인수분해',
        subUnits: ['다항식의 곱셈', '다항식의 인수분해']
      },
      {
        name: '이차방정식',
        subUnits: ['이차방정식의 풀이', '이차방정식의 활용']
      },
      {
        name: '이차함수',
        subUnits: ['이차함수의 그래프', '이차함수의 활용']
      }
    ]
  },
  '중3-2': {
    mainUnits: [
      {
        name: '삼각비',
        subUnits: ['삼각비', '삼각비의 활용']
      },
      {
        name: '원의 성질',
        subUnits: ['원과 직선', '원주각', '원주각의 활용']
      },
      {
        name: '통계',
        subUnits: ['대푯값과 산포도', '상관관계']
      }
    ]
  },
  '공통수학1': {
    mainUnits: [
      {
        name: '다항식',
        subUnits: ['다항식의 연산', '나머지정리', '인수분해']
      },
      {
        name: '방정식과 부등식',
        subUnits: ['복소수와 이차방정식', '이차방정식과 이차함수', '여러 가지 방정식과 부등식']
      },
      {
        name: '경우의 수',
        subUnits: ['합의 법칙과 곱의 법칙', '순열과 조합']
      },
      {
        name: '행렬',
        subUnits: ['행렬과 그 연산']
      }
    ]
  },
  '공통수학2': {
    mainUnits: [
      {
        name: '도형의 방정식',
        subUnits: ['평면좌표', '직선의 방정식', '원의 방정식', '도형의 이동']
      },
      {
        name: '집합과 명제',
        subUnits: ['집합', '명제']
      },
      {
        name: '함수와 그래프',
        subUnits: ['함수', '유무리함수']
      }
    ]
  },
  '대수': {
    mainUnits: [
      {
        name: '지수함수와 로그함수',
        subUnits: ['지수와 로그', '지수함수와 로그함수']
      },
      {
        name: '삼각함수',
        subUnits: ['삼각함수', '사인법칙과 코사인법칙']
      },
      {
        name: '수열',
        subUnits: ['등차수열과 등비수열', '수열의 합', '수학적 귀납법']
      }
    ]
  },
  '미적분1': {
    mainUnits: [
      {
        name: '함수의 극한과 연속',
        subUnits: ['함수의 극한', '함수의 연속']
      },
      {
        name: '미분',
        subUnits: ['미분계수와 도함수', '도함수의 활용']
      },
      {
        name: '적분',
        subUnits: ['부정적분과 정적분', '정적분의 활용']
      }
    ]
  },
  '미적분2': {
    mainUnits: [
      {
        name: '수열의극한',
        subUnits: ['수열의 극한', '급수']
      },
      {
        name: '미분법',
        subUnits: ['지수함수와 로그함수의 미분', '삼각함수의 미분', '여러가지 미분법', '도함수의 활용']
      },
      {
        name: '적분법',
        subUnits: ['여러가지 함수의 적분', '치환적분과 부분적분법', '정적분의 활용']
      }
    ]
  },
  '확률과통계': {
    mainUnits: [
      {
        name: '순열과 조합',
        subUnits: ['순열', '조합']
      },
      {
        name: '확률',
        subUnits: ['확률의 뜻과 활용', '조건부확률']
      },
      {
        name: '통계',
        subUnits: ['확률분포', '통계적추정']
      }
    ]
  },
  '기하': {
    mainUnits: [
      {
        name: '이차곡선',
        subUnits: ['포물선, 타원, 쌍곡선', '이차곡선의 접선']
      },
      {
        name: '공간도형과 공간좌표',
        subUnits: ['직선과 평면의 위치관계', '삼수선 정리', '정사영', '좌표공간의 거리 및 내분점', '구의 방정식']
      },
      {
        name: '벡터',
        subUnits: ['백터의 덧셈, 뺄셈, 실수배', '내적 계산', '평면의 방정식']
      }
    ]
  }
};

const subjects = ['중1-1', '중1-2', '중2-1', '중2-2', '중3-1', '중3-2', '공통수학1', '공통수학2', '대수', '미적분1', '미적분2', '확률과통계', '기하'];

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
    subject: '',
    mainUnit: '',
    subUnit: '',
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
        subject: '',
        mainUnit: '',
        subUnit: '',
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
            subject: record.subject || '',
            mainUnit: record.mainUnit || '',
            subUnit: record.subUnit || '',
          });
        } else {
          setEditingRecord(null);
          setFormData({
            className: classData.className,
            progress: '',
            assignment: '',
            hasVideo: false,
            subject: '',
            mainUnit: '',
            subUnit: '',
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
    
    // 과목이 변경되면 대단원과 소단원 초기화
    if (name === 'subject') {
      setFormData((prev) => ({
        ...prev,
        subject: value,
        mainUnit: '',
        subUnit: '',
      }));
    }
    // 대단원이 변경되면 소단원 초기화
    else if (name === 'mainUnit') {
      setFormData((prev) => ({
        ...prev,
        mainUnit: value,
        subUnit: '',
      }));
    }
    else {
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    }
    
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
        progress: formData.progress ? formData.progress.trim() : '',
        assignment: formData.assignment ? formData.assignment.trim() : '',
        hasVideo: formData.hasVideo,
        subject: formData.subject ? formData.subject.trim() : '',
        mainUnit: formData.mainUnit ? formData.mainUnit.trim() : '',
        subUnit: formData.subUnit ? formData.subUnit.trim() : '',
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
          subject: '',
          mainUnit: '',
          subUnit: '',
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

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">과목</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">과목 선택</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">대단원</label>
                  <select
                    name="mainUnit"
                    value={formData.mainUnit}
                    onChange={handleChange}
                    className="form-input"
                    disabled={!formData.subject}
                  >
                    <option value="">대단원 선택</option>
                    {formData.subject && subjectData[formData.subject]?.mainUnits.map((unit, index) => (
                      <option key={index} value={unit.name}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">소단원</label>
                  <select
                    name="subUnit"
                    value={formData.subUnit}
                    onChange={handleChange}
                    className="form-input"
                    disabled={!formData.mainUnit}
                  >
                    <option value="">소단원 선택</option>
                    {formData.subject && formData.mainUnit && subjectData[formData.subject]?.mainUnits
                      .find(unit => unit.name === formData.mainUnit)?.subUnits.map((subUnit, index) => (
                        <option key={index} value={subUnit}>
                          {subUnit}
                        </option>
                      ))}
                  </select>
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
