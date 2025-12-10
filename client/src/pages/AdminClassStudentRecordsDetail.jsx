import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './MonthlyStatisticsDetail.css';

function AdminClassStudentRecordsDetail() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [classData, setClassData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const tableWrapperRef = useRef(null);
  const monthlyTableWrapperRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMonthlyDragging, setIsMonthlyDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [monthlyDragStart, setMonthlyDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [activeTableRef, setActiveTableRef] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (classId && selectedYear && selectedMonth) {
      fetchMonthlyData();
    }
  }, [classId, selectedYear, selectedMonth]);

  // 전역 마우스 이벤트로 화면 드래그 지원
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging && tableWrapperRef.current && activeTableRef === tableWrapperRef) {
        e.preventDefault();
        const x = e.pageX - tableWrapperRef.current.getBoundingClientRect().left;
        const walk = (x - dragStart.x) * 2;
        tableWrapperRef.current.scrollLeft = dragStart.scrollLeft - walk;
      } else if (isMonthlyDragging && monthlyTableWrapperRef.current && activeTableRef === monthlyTableWrapperRef) {
        e.preventDefault();
        const x = e.pageX - monthlyTableWrapperRef.current.getBoundingClientRect().left;
        const walk = (x - monthlyDragStart.x) * 2;
        monthlyTableWrapperRef.current.scrollLeft = monthlyDragStart.scrollLeft - walk;
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging && tableWrapperRef.current) {
        setIsDragging(false);
        tableWrapperRef.current.style.cursor = 'grab';
        tableWrapperRef.current.style.userSelect = '';
        setActiveTableRef(null);
      }
      if (isMonthlyDragging && monthlyTableWrapperRef.current) {
        setIsMonthlyDragging(false);
        monthlyTableWrapperRef.current.style.cursor = 'grab';
        monthlyTableWrapperRef.current.style.userSelect = '';
        setActiveTableRef(null);
      }
    };

    if (isDragging || isMonthlyDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isMonthlyDragging, dragStart, monthlyDragStart, activeTableRef]);

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

      // 반 정보 가져오기
      const classResponse = await api.get(`/classes/${classId}`);
      if (classResponse.data.success) {
        setClassData(classResponse.data.data);
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

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const userData = JSON.parse(userStr);
      
      // 선택한 월의 첫날과 마지막날 계산
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      const daysInMonth = endDate.getDate();

      // 해당 월의 모든 날짜에 대해 데이터 가져오기
      const datePromises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        // 로컬 시간대 기준으로 날짜 문자열 생성 (YYYY-MM-DD 형식)
        const year = selectedYear;
        const month = String(selectedMonth).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        datePromises.push(
          api.get(`/student-records?classId=${classId}&date=${dateStr}`)
            .then(response => {
              if (response.data.success) {
                // 각 학생의 기록을 가져오기 (학생 회원만 필터링)
                const allRecords = (response.data.data || []).filter(record => 
                  record.studentId && 
                  record.studentId.userType === '학생'
                );
                
                // 반 평균 및 최고점 계산
                const dailyScores = [];
                
                allRecords.forEach(record => {
                  // 리뷰TEST 점수 처리
                  if (record.dailyTestScore && 
                      record.dailyTestScore !== null && 
                      record.dailyTestScore !== undefined && 
                      String(record.dailyTestScore).trim() !== '') {
                    let percentage = null;
                    if (typeof record.dailyTestScore === 'string' && record.dailyTestScore.includes('/')) {
                      const [correct, total] = record.dailyTestScore.split('/').map(Number);
                      if (total > 0 && !isNaN(correct) && !isNaN(total) && correct >= 0) {
                        percentage = Math.round((correct / total) * 100);
                      }
                    }
                    if (percentage !== null && percentage >= 0 && percentage <= 100) {
                      dailyScores.push(percentage);
                    }
                  }
                });
                
                const classAverage = dailyScores.length > 0 
                  ? Math.round(dailyScores.reduce((sum, score) => sum + score, 0) / dailyScores.length)
                  : null;
                const classMaxScore = dailyScores.length > 0 ? Math.max(...dailyScores) : null;
                
                return {
                  date: dateStr,
                  day: day,
                  allRecords: allRecords,
                  classAverage: classAverage,
                  classMaxScore: classMaxScore,
                };
              }
              return {
                date: dateStr,
                day: day,
                allRecords: [],
                classAverage: null,
                classMaxScore: null,
              };
            })
            .catch((error) => {
              console.error(`[${dateStr}] 데이터 가져오기 실패:`, error);
              return {
                date: dateStr,
                day: day,
                allRecords: [],
                classAverage: null,
                classMaxScore: null,
              };
            })
        );
      }

      const results = await Promise.all(datePromises);
      setMonthlyData(results);
    } catch (error) {
      console.error('월별 데이터 가져오기 오류:', error);
      setError('월별 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (scoreStr) => {
    if (!scoreStr || scoreStr === '') return '-';
    
    // 이미 숫자 형식인 경우 (백분율)
    if (typeof scoreStr === 'number') {
      return `${scoreStr}점`;
    }
    
    // 문자열 형식인 경우
    if (typeof scoreStr === 'string') {
      // "맞은개수/총문항수" 형식인 경우
      if (scoreStr.includes('/')) {
        const [correct, total] = scoreStr.split('/').map(Number);
        if (total > 0 && !isNaN(correct) && !isNaN(total)) {
          const percentage = Math.round((correct / total) * 100);
          return `${percentage}점`;
        }
      } else {
        // 이미 숫자 문자열인 경우 (예: "100")
        const num = Number(scoreStr);
        if (!isNaN(num)) {
          return `${num}점`;
        }
      }
    }
    
    return scoreStr;
  };

  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  // 보고서 생성 함수
  const handleGenerateReport = async (student) => {
    try {
      setReportLoading(true);
      setSelectedStudentForReport(student);
      setShowReportModal(true);
      setReportData(null);
      
      const studentId = student._id;
      const studentName = student.name || student.userId || '학생';
      
      // 선택한 월의 첫날과 마지막날 계산
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      const daysInMonth = endDate.getDate();
      
      // 해당 월의 모든 날짜에 대해 리뷰테스트 데이터와 class-records 가져오기
      const reportDataPromises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const year = selectedYear;
        const month = String(selectedMonth).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        
        reportDataPromises.push(
          Promise.all([
            // 학생 기록 가져오기 (관리자용 - 특정 학생 ID로 조회)
            api.get(`/student-records?classId=${classId}&date=${dateStr}&studentId=${studentId}`)
              .then(response => {
                if (response.data.success && response.data.data && response.data.data.length > 0) {
                  const studentRecord = response.data.data.find(r => 
                    r.studentId && r.studentId._id && r.studentId._id.toString() === studentId
                  );
                  return studentRecord || null;
                }
                return null;
              })
              .catch(() => null),
            // 교실관리 기록 가져오기
            api.get(`/class-records?classId=${classId}&date=${dateStr}`)
              .then(response => {
                if (response.data.success && response.data.data && response.data.data.length > 0) {
                  const sortedRecords = [...response.data.data].sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.createdAt || 0);
                    const dateB = new Date(b.updatedAt || b.createdAt || 0);
                    return dateB - dateA;
                  });
                  return sortedRecords[0];
                }
                return null;
              })
              .catch(() => null),
            // 반 전체 학생들의 리뷰테스트 점수 가져오기
            api.get(`/student-records?classId=${classId}&date=${dateStr}`)
              .then(response => {
                if (response.data.success) {
                  return response.data.data || [];
                }
                return [];
              })
              .catch(() => [])
          ]).then(([studentRecord, classRecord, allStudentRecords]) => {
            const dailyTestScore = studentRecord?.dailyTestScore;
            
            if (!dailyTestScore) {
              return null;
            }
            
            let correct = 0;
            let total = 0;
            if (typeof dailyTestScore === 'string' && dailyTestScore.includes('/')) {
              const [correctNum, totalNum] = dailyTestScore.split('/').map(Number);
              correct = correctNum || 0;
              total = totalNum || 0;
            } else {
              return null;
            }
            
            // 반 전체 학생들의 점수로 상위 퍼센트 계산
            const allScores = allStudentRecords
              .filter(r => r.dailyTestScore && typeof r.dailyTestScore === 'string' && r.dailyTestScore.includes('/'))
              .map(r => {
                const [c, t] = r.dailyTestScore.split('/').map(Number);
                return t > 0 ? (c / t) * 100 : 0;
              })
              .sort((a, b) => b - a);
            
            const myScore = total > 0 ? (correct / total) * 100 : 0;
            const rank = allScores.findIndex(score => score <= myScore);
            const percentile = allScores.length > 0 
              ? Math.round(((allScores.length - rank) / allScores.length) * 100)
              : 100;
            
            const subject = (classRecord?.subject && classRecord.subject.trim() !== '') 
              ? classRecord.subject.trim() 
              : '';
            const mainUnit = (classRecord?.mainUnit && classRecord.mainUnit.trim() !== '') 
              ? classRecord.mainUnit.trim() 
              : '';
            const subUnit = (classRecord?.subUnit && classRecord.subUnit.trim() !== '') 
              ? classRecord.subUnit.trim() 
              : '';
            
            return {
              date: dateStr,
              day: day,
              subject: subject,
              mainUnit: mainUnit,
              subUnit: subUnit,
              correct: correct,
              total: total,
              percentage: Math.round(myScore),
              percentile: percentile,
            };
          })
        );
      }
      
      const results = await Promise.all(reportDataPromises);
      const validResults = results.filter(r => r !== null);
      
      // 그래프 데이터 생성
      const chartDataPromises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const year = selectedYear;
        const month = String(selectedMonth).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        
        chartDataPromises.push(
          Promise.all([
            // 학생 기록 가져오기
            api.get(`/student-records?classId=${classId}&date=${dateStr}&studentId=${studentId}`)
              .then(response => {
                if (response.data.success && response.data.data && response.data.data.length > 0) {
                  const studentRecord = response.data.data.find(r => 
                    r.studentId && r.studentId._id && r.studentId._id.toString() === studentId
                  );
                  return studentRecord || null;
                }
                return null;
              })
              .catch(() => null),
            // 반 전체 학생들의 리뷰테스트 점수 가져오기
            api.get(`/student-records?classId=${classId}&date=${dateStr}`)
              .then(response => {
                if (response.data.success) {
                  return response.data.data || [];
                }
                return [];
              })
              .catch(() => [])
          ]).then(([studentRecord, allStudentRecords]) => {
            const dailyTestScore = studentRecord?.dailyTestScore;
            
            if (!dailyTestScore) {
              return null;
            }
            
            // 학생 점수 계산
            let myScore = null;
            if (typeof dailyTestScore === 'string' && dailyTestScore.includes('/')) {
              const [correct, total] = dailyTestScore.split('/').map(Number);
              if (total > 0 && !isNaN(correct) && !isNaN(total)) {
                myScore = Math.round((correct / total) * 100);
              }
            }
            
            if (myScore === null) {
              return null;
            }
            
            // 반 평균 및 최고점 계산
            const allScores = allStudentRecords
              .filter(r => r.dailyTestScore && typeof r.dailyTestScore === 'string' && r.dailyTestScore.includes('/'))
              .map(r => {
                const [c, t] = r.dailyTestScore.split('/').map(Number);
                return t > 0 ? Math.round((c / t) * 100) : 0;
              })
              .filter(score => score >= 0 && score <= 100);
            
            const classAverage = allScores.length > 0 
              ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
              : null;
            const classMaxScore = allScores.length > 0 ? Math.max(...allScores) : null;
            
            return {
              date: dateStr,
              myScore: myScore,
              classAverage: classAverage,
              maxScore: classMaxScore,
            };
          })
        );
      }
      
      const chartResults = await Promise.all(chartDataPromises);
      const chartData = chartResults.filter(r => r !== null).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // 소단원별로 그룹화
      const subUnitStats = {};
      let totalCorrect = 0;
      let totalQuestions = 0;
      
      validResults.forEach(result => {
        const key = `${result.subject}-${result.mainUnit}-${result.subUnit}`;
        if (!subUnitStats[key]) {
          subUnitStats[key] = {
            subject: result.subject,
            mainUnit: result.mainUnit,
            subUnit: result.subUnit,
            correct: 0,
            total: 0,
            count: 0,
            percentiles: [],
          };
        }
        subUnitStats[key].correct += result.correct;
        subUnitStats[key].total += result.total;
        subUnitStats[key].count += 1;
        subUnitStats[key].percentiles.push(result.percentile);
        totalCorrect += result.correct;
        totalQuestions += result.total;
      });
      
      // 소단원별 통계 계산
      const subUnitList = Object.values(subUnitStats).map(stat => ({
        ...stat,
        percentage: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
        avgPercentile: stat.percentiles.length > 0 
          ? Math.round(stat.percentiles.reduce((a, b) => a + b, 0) / stat.percentiles.length)
          : 0,
      }));
      
      // 과목, 대단원, 소단원 정렬 순서 정의
      const subjectOrder = {
        '중1-1': 1, '중1-2': 2, '중2-1': 3, '중2-2': 4, '중3-1': 5, '중3-2': 6,
        '공통수학1': 7, '공통수학2': 8, '대수': 9, '미적분1': 10, '미적분2': 11,
        '확률과통계': 12, '기하': 13
      };
      
      const mainUnitOrder = {
        '중1-1': {
          '수와 연산': 1, '정수와 유리수': 2, '문자와 식': 3, '좌표평면과 그래프': 4
        },
        '중1-2': {
          '기본 도형과 작도': 1, '평면도형의 성질': 2, '입체도형의 성질': 3, '자료의 정리와 해석': 4
        },
        '중2-1': {
          '수와 식': 1, '부등식': 2, '방정식': 3, '함수': 4
        },
        '중2-2': {
          '도형의 성질': 1, '도형의 닮음': 2, '확률': 3
        },
        '중3-1': {
          '실수와 그 계산': 1, '다항식의 곱셈과 인수분해': 2, '이차방정식': 3, '이차함수': 4
        },
        '중3-2': {
          '삼각비': 1, '원의 성질': 2, '통계': 3
        },
        '공통수학1': {
          '다항식': 1, '방정식과 부등식': 2, '경우의 수': 3, '행렬': 4
        },
        '공통수학2': {
          '도형의 방정식': 1, '집합과 명제': 2, '함수와 그래프': 3
        },
        '대수': {
          '지수함수와 로그함수': 1, '삼각함수': 2, '수열': 3
        },
        '미적분1': {
          '함수의 극한과 연속': 1, '미분': 2, '적분': 3
        },
        '미적분2': {
          '수열의극한': 1, '미분법': 2, '적분법': 3
        },
        '확률과통계': {
          '순열과 조합': 1, '확률': 2, '통계': 3
        },
        '기하': {
          '이차곡선': 1, '공간도형과 공간좌표': 2, '벡터': 3
        }
      };
      
      const subUnitOrder = {
        '중1-1': {
          '수와 연산': { '소인수분해': 1, '최대공약수와 최소공배수': 2 },
          '정수와 유리수': { '정수와 유리수': 1, '정수와 유리수의 계산': 2 },
          '문자와 식': { '문자의 사용과 식의 계산': 1, '일차방정식': 2, '일차방정식의 활용': 3 },
          '좌표평면과 그래프': { '좌표평면과 그래프': 1, '정비례와 반비례': 2 }
        },
        '중1-2': {
          '기본 도형과 작도': { '기본 도형': 1, '위치 관계': 2, '작도와 합동': 3 },
          '평면도형의 성질': { '다각형': 1, '원과 부채꼴': 2 },
          '입체도형의 성질': { '다면체와 회전체': 1, '입체도형의 겉넓이와 부피': 2 },
          '자료의 정리와 해석': { '자료의 정리와 해석': 1 }
        },
        '중2-1': {
          '수와 식': { '유리수와 순환소수': 1, '식의 계산': 2 },
          '부등식': { '일차부등식': 1, '일차부등식의 활용': 2 },
          '방정식': { '연립일차방정식': 1, '연립방정식의 풀이': 2, '연립방정식의 활용': 3 },
          '함수': { '일차함수와 그래프(1)': 1, '일차함수와 그래프(2)': 2, '일차함수와 일차방정식의 관계': 3 }
        },
        '중2-2': {
          '도형의 성질': { '삼각형의 성질': 1, '사각형의 성질': 2 },
          '도형의 닮음': { '도형의 닮음': 1, '닮은 도형의 성질': 2, '피타고라스 정리': 3 },
          '확률': { '경우의 수와 확률': 1 }
        },
        '중3-1': {
          '실수와 그 계산': { '제곱근과 실수': 1, '근호를 포함한 식의 계산': 2 },
          '다항식의 곱셈과 인수분해': { '다항식의 곱셈': 1, '다항식의 인수분해': 2 },
          '이차방정식': { '이차방정식의 풀이': 1, '이차방정식의 활용': 2 },
          '이차함수': { '이차함수의 그래프': 1, '이차함수의 활용': 2 }
        },
        '중3-2': {
          '삼각비': { '삼각비': 1, '삼각비의 활용': 2 },
          '원의 성질': { '원과 직선': 1, '원주각': 2, '원주각의 활용': 3 },
          '통계': { '대푯값과 산포도': 1, '상관관계': 2 }
        },
        '공통수학1': {
          '다항식': { '다항식의 연산': 1, '나머지정리': 2, '인수분해': 3 },
          '방정식과 부등식': { '복소수와 이차방정식': 1, '이차방정식과 이차함수': 2, '여러 가지 방정식과 부등식': 3 },
          '경우의 수': { '합의 법칙과 곱의 법칙': 1, '순열과 조합': 2 },
          '행렬': { '행렬과 그 연산': 1 }
        },
        '공통수학2': {
          '도형의 방정식': { '평면좌표': 1, '직선의 방정식': 2, '원의 방정식': 3, '도형의 이동': 4 },
          '집합과 명제': { '집합': 1, '명제': 2 },
          '함수와 그래프': { '함수': 1, '유무리함수': 2 }
        },
        '대수': {
          '지수함수와 로그함수': { '지수와 로그': 1, '지수함수와 로그함수': 2 },
          '삼각함수': { '삼각함수': 1, '사인법칙과 코사인법칙': 2 },
          '수열': { '등차수열과 등비수열': 1, '수열의 합': 2, '수학적 귀납법': 3 }
        },
        '미적분1': {
          '함수의 극한과 연속': { '함수의 극한': 1, '함수의 연속': 2 },
          '미분': { '미분계수와 도함수': 1, '도함수의 활용': 2 },
          '적분': { '부정적분과 정적분': 1, '정적분의 활용': 2 }
        },
        '미적분2': {
          '수열의극한': { '수열의 극한': 1, '급수': 2 },
          '미분법': { '지수함수와 로그함수의 미분': 1, '삼각함수의 미분': 2, '여러가지 미분법': 3, '도함수의 활용': 4 },
          '적분법': { '여러가지 함수의 적분': 1, '치환적분과 부분적분법': 2, '정적분의 활용': 3 }
        },
        '확률과통계': {
          '순열과 조합': { '순열': 1, '조합': 2 },
          '확률': { '확률의 뜻과 활용': 1, '조건부확률': 2 },
          '통계': { '확률분포': 1, '통계적추정': 2 }
        },
        '기하': {
          '이차곡선': { '포물선, 타원, 쌍곡선': 1, '이차곡선의 접선': 2 },
          '공간도형과 공간좌표': { '직선과 평면의 위치관계': 1, '삼수선 정리': 2, '정사영': 3, '좌표공간의 거리 및 내분점': 4, '구의 방정식': 5 },
          '벡터': { '백터의 덧셈, 뺄셈, 실수배': 1, '내적 계산': 2, '평면의 방정식': 3 }
        }
      };
      
      // 정렬 함수
      const sortSubUnits = (a, b) => {
        const subjectA = subjectOrder[a.subject] || 999;
        const subjectB = subjectOrder[b.subject] || 999;
        
        if (subjectA !== subjectB) {
          return subjectA - subjectB;
        }
        
        const mainUnitOrderMap = mainUnitOrder[a.subject] || {};
        const mainUnitA = mainUnitOrderMap[a.mainUnit] || 999;
        const mainUnitB = mainUnitOrderMap[b.mainUnit] || 999;
        
        if (mainUnitA !== mainUnitB) {
          return mainUnitA - mainUnitB;
        }
        
        const subUnitOrderMap = subUnitOrder[a.subject]?.[a.mainUnit] || {};
        const subUnitA = subUnitOrderMap[a.subUnit] || 999;
        const subUnitB = subUnitOrderMap[b.subUnit] || 999;
        
        return subUnitA - subUnitB;
      };
      
      // 정답률 70% 이상인 단원 (강점 단원) - 정답률 높은 순으로 정렬
      const strongUnitsList = subUnitList
        .filter(unit => unit.percentage >= 70)
        .sort((a, b) => b.percentage - a.percentage);
      
      // 정답률 70% 미만인 단원 (취약 단원) - 정답률 낮은 순으로 정렬, 최대 5개
      const weakUnitsList = subUnitList
        .filter(unit => unit.percentage < 70)
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 5);
      
      // 모든 소단원 리스트 (과목/대단원/소단원 순서로 정렬)
      const allSubUnitsList = [...subUnitList].sort(sortSubUnits);
      
      // 전체 평균 상위 퍼센트
      const allPercentiles = validResults.map(r => r.percentile);
      const avgPercentile = allPercentiles.length > 0
        ? Math.round(allPercentiles.reduce((a, b) => a + b, 0) / allPercentiles.length)
        : 0;
      
      setReportData({
        year: selectedYear,
        month: selectedMonth,
        className: classData?.className || '',
        studentName: studentName,
        totalCorrect,
        totalQuestions,
        totalPercentage: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        avgPercentile,
        subUnitList: allSubUnitsList,
        weakUnits: weakUnitsList,
        strongUnits: strongUnitsList,
        chartData: chartData, // 그래프 데이터 추가
      });
    } catch (error) {
      console.error('보고서 생성 오류:', error);
      alert('보고서 생성 중 오류가 발생했습니다.');
      setShowReportModal(false);
    } finally {
      setReportLoading(false);
    }
  };

  // 리뷰TEST 점수를 백분율로 변환
  const convertDailyTestScoreToPercentage = (scoreStr) => {
    if (!scoreStr || scoreStr === '') return null;
    if (typeof scoreStr === 'string' && scoreStr.includes('/')) {
      const [correct, total] = scoreStr.split('/').map(Number);
      if (total > 0 && !isNaN(correct) && !isNaN(total)) {
        return Math.round((correct / total) * 100);
      }
    }
    return null;
  };

  if (loading && !monthlyData.length) {
    return (
      <div className="monthly-statistics-detail-page">
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
      <div className="monthly-statistics-detail-page">
        <Header />
        <div className="error-container">
          <p>{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // 연도 선택 옵션 (최근 3년)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = 0; i < 3; i++) {
    yearOptions.push(currentYear - i);
  }

  // 월 선택 옵션
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // 모든 학생 ID 수집 (학생 회원만)
  const allStudentIds = new Set();
  monthlyData.forEach(item => {
    if (item.allRecords) {
      item.allRecords.forEach(record => {
        if (record.studentId && 
            record.studentId._id && 
            record.studentId.userType === '학생') {
          allStudentIds.add(record.studentId._id.toString());
        }
      });
    }
  });

  const allStudents = Array.from(allStudentIds).map(studentId => {
    // 해당 학생의 첫 번째 기록에서 이름 가져오기
    for (let item of monthlyData) {
      if (item.allRecords) {
        const studentRecord = item.allRecords.find(r => 
          r.studentId && 
          r.studentId._id && 
          r.studentId._id.toString() === studentId &&
          r.studentId.userType === '학생'
        );
        if (studentRecord && studentRecord.studentId) {
          return {
            _id: studentId,
            name: studentRecord.studentId.name || '알 수 없음',
            userId: studentRecord.studentId.userId || ''
          };
        }
      }
    }
    return { _id: studentId, name: '알 수 없음', userId: '' };
  }).filter(student => student.name !== '알 수 없음' || student.userId !== '');

  // 검색어로 학생 필터링
  const filteredStudents = searchQuery.trim() === '' 
    ? allStudents 
    : allStudents.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.userId.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // 데이터가 있는 날짜만 필터링
  const datesWithData = monthlyData.filter(item => item.allRecords && item.allRecords.length > 0);

  return (
    <div className="monthly-statistics-detail-page">
      <Header />
      <section className="monthly-statistics-detail-section">
        <div className="container">
          <div className="page-header">
            <button
              className="btn-back"
              onClick={() => navigate('/admin/class-student-records')}
            >
              목록으로
            </button>
            <div className="page-header-content">
              <div className="page-header-icon">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <h1 className="page-title">{classData?.className || '학생 기록 조회'}</h1>
              <p className="page-description">
                {classData?.className} 반의 모든 학생들의 기록을 확인할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 연도/월 선택 및 검색 */}
          <div className="month-selector-container">
            <div className="month-selector">
              <label htmlFor="year-select">연도:</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="month-select"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <label htmlFor="month-select">월:</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="month-select"
              >
                {monthOptions.map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
            <div className="student-search-container">
              <div className="search-input-wrapper">
                <i className="fas fa-search search-icon-input"></i>
                <input
                  type="text"
                  placeholder="학생명 또는 아이디로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="student-search-input"
                />
                {searchQuery && (
                  <button
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    type="button"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="search-result-info">
                  검색 결과: {filteredStudents.length}명
                </div>
              )}
            </div>
          </div>

          {/* 전체 학생별 월별 통계 테이블 */}
          <div 
            className="monthly-table-container admin-table-wrapper"
            ref={tableWrapperRef}
            onMouseDown={(e) => {
              if (tableWrapperRef.current && e.button === 0) {
                setIsDragging(true);
                setActiveTableRef(tableWrapperRef);
                const rect = tableWrapperRef.current.getBoundingClientRect();
                setDragStart({
                  x: e.pageX - rect.left,
                  scrollLeft: tableWrapperRef.current.scrollLeft,
                });
                tableWrapperRef.current.style.cursor = 'grabbing';
                tableWrapperRef.current.style.userSelect = 'none';
              }
            }}
            onTouchStart={(e) => {
              if (tableWrapperRef.current && e.touches.length === 1) {
                setIsDragging(true);
                setActiveTableRef(tableWrapperRef);
                const rect = tableWrapperRef.current.getBoundingClientRect();
                setDragStart({
                  x: e.touches[0].pageX - rect.left,
                  scrollLeft: tableWrapperRef.current.scrollLeft,
                });
              }
            }}
            onTouchMove={(e) => {
              if (!isDragging || !tableWrapperRef.current || e.touches.length !== 1) return;
              e.preventDefault();
              const rect = tableWrapperRef.current.getBoundingClientRect();
              const x = e.touches[0].pageX - rect.left;
              const walk = (x - dragStart.x) * 2;
              tableWrapperRef.current.scrollLeft = dragStart.scrollLeft - walk;
            }}
            onTouchEnd={() => {
              setIsDragging(false);
              setActiveTableRef(null);
            }}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <table className="monthly-table admin-monthly-table">
              <thead>
                <tr>
                  <th>학생명</th>
                  {datesWithData.map((item) => (
                    <th key={item.date}>
                      {item.day}일<br/>({getDayOfWeek(item.date)})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={datesWithData.length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                      {searchQuery ? '검색 결과가 없습니다.' : '학생 데이터가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td style={{ fontWeight: 700, textAlign: 'left', paddingLeft: '1rem', verticalAlign: 'top' }}>
                        <div style={{ marginBottom: '0.5rem' }}>{student.name}</div>
                        <button
                          className="btn-report-small"
                          onClick={() => handleGenerateReport(student)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.875rem',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          <i className="fas fa-file-alt" style={{ marginRight: '0.25rem' }}></i>
                          보고서
                        </button>
                      </td>
                      {datesWithData.map((item) => {
                        const studentRecord = item.allRecords.find(r => 
                          r.studentId && r.studentId._id && r.studentId._id.toString() === student._id
                        );
                        
                        if (!studentRecord) {
                          return <td key={item.date}>-</td>;
                        }
                        
                        const dailyScore = studentRecord.dailyTestScore ? formatScore(studentRecord.dailyTestScore) : '-';
                        const attendance = studentRecord.attendance ? (
                          <span className="status-badge status-present">출석</span>
                        ) : (
                          <span className="status-badge status-absent">결석</span>
                        );
                        const assignment = studentRecord.assignment ? (
                          <span className="status-badge status-complete">완료</span>
                        ) : (
                          <span className="status-badge status-incomplete">미완료</span>
                        );
                        
                        return (
                          <td key={item.date} className="admin-student-cell">
                            <div className="cell-item">
                              <span className="cell-label">출결:</span>
                              {attendance}
                            </div>
                            <div className="cell-item">
                              <span className="cell-label">과제:</span>
                              {assignment}
                            </div>
                            <div className="cell-item">
                              <span className="cell-label">리뷰TEST:</span>
                              <span className="cell-value">{dailyScore}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="class-stats-row">
                  <td style={{ fontWeight: 700, textAlign: 'left', paddingLeft: '1rem', background: '#f8f9fa' }}>
                    반평균/최고점
                  </td>
                  {datesWithData.map((item) => (
                    <td key={item.date} className="class-stats-cell">
                      <div className="cell-item">
                        <span className="cell-label">반평균:</span>
                        <span className="cell-value class-average">
                          {item.classAverage !== null ? `${item.classAverage}점` : '-'}
                        </span>
                      </div>
                      <div className="cell-item">
                        <span className="cell-label">최고점:</span>
                        <span className="cell-value class-max">
                          {item.classMaxScore !== null ? `${item.classMaxScore}점` : '-'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 실전TEST 별도 섹션 */}
          {monthlyData.some(item => 
            item.allRecords && 
            item.allRecords.some(record => record.monthlyEvaluationScore)
          ) && (
            <div className="monthly-evaluation-section">
              <h2 className="section-title">실전TEST</h2>
              <div 
                className="monthly-table-container admin-table-wrapper"
                ref={monthlyTableWrapperRef}
                onMouseDown={(e) => {
                  if (monthlyTableWrapperRef.current && e.button === 0) {
                    setIsMonthlyDragging(true);
                    setActiveTableRef(monthlyTableWrapperRef);
                    const rect = monthlyTableWrapperRef.current.getBoundingClientRect();
                    setMonthlyDragStart({
                      x: e.pageX - rect.left,
                      scrollLeft: monthlyTableWrapperRef.current.scrollLeft,
                    });
                    monthlyTableWrapperRef.current.style.cursor = 'grabbing';
                    monthlyTableWrapperRef.current.style.userSelect = 'none';
                  }
                }}
                onTouchStart={(e) => {
                  if (monthlyTableWrapperRef.current && e.touches.length === 1) {
                    setIsMonthlyDragging(true);
                    setActiveTableRef(monthlyTableWrapperRef);
                    const rect = monthlyTableWrapperRef.current.getBoundingClientRect();
                    setMonthlyDragStart({
                      x: e.touches[0].pageX - rect.left,
                      scrollLeft: monthlyTableWrapperRef.current.scrollLeft,
                    });
                  }
                }}
                onTouchMove={(e) => {
                  if (!isMonthlyDragging || !monthlyTableWrapperRef.current || e.touches.length !== 1) return;
                  e.preventDefault();
                  const rect = monthlyTableWrapperRef.current.getBoundingClientRect();
                  const x = e.touches[0].pageX - rect.left;
                  const walk = (x - monthlyDragStart.x) * 2;
                  monthlyTableWrapperRef.current.scrollLeft = monthlyDragStart.scrollLeft - walk;
                }}
                onTouchEnd={() => {
                  setIsMonthlyDragging(false);
                  setActiveTableRef(null);
                }}
                style={{ cursor: isMonthlyDragging ? 'grabbing' : 'grab' }}
              >
                <table className="monthly-table admin-monthly-table">
                  <thead>
                    <tr>
                      <th>학생명</th>
                      {monthlyData
                        .filter(item => 
                          item.allRecords && 
                          item.allRecords.some(record => record.monthlyEvaluationScore)
                        )
                        .map((item) => (
                          <th key={item.date}>
                            {item.day}일<br/>({getDayOfWeek(item.date)})
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={monthlyData.filter(item => 
                          item.allRecords && 
                          item.allRecords.some(record => record.monthlyEvaluationScore)
                        ).length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                          {searchQuery ? '검색 결과가 없습니다.' : '학생 데이터가 없습니다.'}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student._id}>
                          <td style={{ fontWeight: 700, textAlign: 'left', paddingLeft: '1rem' }}>
                            {student.name}
                          </td>
                          {monthlyData
                            .filter(item => 
                              item.allRecords && 
                              item.allRecords.some(record => record.monthlyEvaluationScore)
                            )
                            .map((item) => {
                              const studentRecord = item.allRecords.find(r => 
                                r.studentId && 
                                r.studentId._id && 
                                r.studentId._id.toString() === student._id &&
                                r.monthlyEvaluationScore
                              );
                              
                              if (!studentRecord) {
                                return <td key={item.date}>-</td>;
                              }
                              
                              return (
                                <td key={item.date} className="admin-student-cell">
                                  <div className="cell-item monthly-eval">
                                    <span className="cell-label">내점수:</span>
                                    <span className="cell-value monthly-score">
                                      {formatScore(studentRecord.monthlyEvaluationScore)}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="class-stats-row">
                      <td style={{ fontWeight: 700, textAlign: 'left', paddingLeft: '1rem', background: '#f8f9fa' }}>
                        반평균/최고점
                      </td>
                      {monthlyData
                        .filter(item => 
                          item.allRecords && 
                          item.allRecords.some(record => record.monthlyEvaluationScore)
                        )
                        .map((item) => {
                          // 실전TEST 평균 및 최고점 계산
                          const monthlyScores = [];
                          item.allRecords.forEach(record => {
                            if (record.monthlyEvaluationScore !== null && 
                                record.monthlyEvaluationScore !== undefined &&
                                String(record.monthlyEvaluationScore).trim() !== '') {
                              let percentage = null;
                              if (typeof record.monthlyEvaluationScore === 'string' && record.monthlyEvaluationScore.includes('/')) {
                                const [correct, total] = record.monthlyEvaluationScore.split('/').map(Number);
                                if (total > 0 && !isNaN(correct) && !isNaN(total) && correct >= 0) {
                                  percentage = Math.round((correct / total) * 100);
                                }
                              } else if (typeof record.monthlyEvaluationScore === 'number') {
                                if (record.monthlyEvaluationScore >= 0 && record.monthlyEvaluationScore <= 100) {
                                  percentage = Math.round(record.monthlyEvaluationScore);
                                }
                              }
                              if (percentage !== null && percentage >= 0 && percentage <= 100) {
                                monthlyScores.push(percentage);
                              }
                            }
                          });
                          
                          const monthlyAverage = monthlyScores.length > 0
                            ? Math.round(monthlyScores.reduce((sum, score) => sum + score, 0) / monthlyScores.length)
                            : null;
                          const monthlyMax = monthlyScores.length > 0 ? Math.max(...monthlyScores) : null;

                          return (
                            <td key={item.date} className="class-stats-cell">
                              <div className="cell-item">
                                <span className="cell-label">반평균:</span>
                                <span className="cell-value class-average">
                                  {monthlyAverage !== null ? `${monthlyAverage}점` : '-'}
                                </span>
                              </div>
                              <div className="cell-item">
                                <span className="cell-label">최고점:</span>
                                <span className="cell-value class-max">
                                  {monthlyMax !== null ? `${monthlyMax}점` : '-'}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
      
      {/* 보고서 모달 */}
      {showReportModal && (
        <MonthlyReportModal
          reportData={reportData}
          loading={reportLoading}
          onClose={() => {
            setShowReportModal(false);
            setReportData(null);
            setSelectedStudentForReport(null);
          }}
        />
      )}
    </div>
  );
}

// 월별보고서 모달 컴포넌트 (MyMonthlyStatisticsDetail.jsx에서 복사)
function MonthlyReportModal({ reportData, loading, onClose }) {
  const modalContentRef = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // PDF 다운로드 함수
  const handleDownloadPDF = async () => {
    if (!reportData || !modalContentRef.current) return;
    
    try {
      setIsGeneratingPDF(true);
      
      const element = modalContentRef.current;
      const modalBody = element.querySelector('.report-modal-body');
      const modalHeader = element.querySelector('.report-modal-header');
      const modal = element.closest('.report-modal');
      const closeButton = element.querySelector('.report-modal-close');
      
      const minWidth = 900;
      
      const originalBodyHeight = modalBody ? modalBody.style.height : '';
      const originalBodyOverflow = modalBody ? modalBody.style.overflow : '';
      const originalBodyMaxHeight = modalBody ? modalBody.style.maxHeight : '';
      const originalModalMaxHeight = modal ? modal.style.maxHeight : '';
      const originalModalOverflow = modal ? modal.style.overflow : '';
      const originalCloseButtonDisplay = closeButton ? closeButton.style.display : '';
      
      // 닫기 버튼 숨기기
      if (closeButton) {
        closeButton.style.display = 'none';
      }
      
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
      if (modal) {
        modal.scrollTop = 0;
      }
      
      let totalHeight = 0;
      if (modalHeader) {
        totalHeight += modalHeader.offsetHeight;
      }
      if (modalBody) {
        totalHeight += modalBody.scrollHeight;
      }
      
      const contentWidth = Math.max(element.scrollWidth, minWidth);
      
      if (modal) {
        modal.style.maxHeight = 'none';
        modal.style.overflow = 'visible';
      }
      if (modalBody) {
        modalBody.style.height = 'auto';
        modalBody.style.maxHeight = 'none';
        modalBody.style.overflow = 'visible';
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: contentWidth,
        height: totalHeight,
        windowWidth: contentWidth,
        windowHeight: totalHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        allowTaint: true,
        removeContainer: false,
        onclone: (clonedDoc) => {
          const clonedModal = clonedDoc.querySelector('.report-modal');
          const clonedBody = clonedDoc.querySelector('.report-modal-body');
          const clonedElement = clonedDoc.querySelector('[class*="report-modal"]');
          const clonedCloseButton = clonedDoc.querySelector('.report-modal-close');
          
          // 복제된 문서에서도 닫기 버튼 숨기기
          if (clonedCloseButton) {
            clonedCloseButton.style.display = 'none';
          }
          
          if (clonedModal) {
            clonedModal.style.maxHeight = 'none';
            clonedModal.style.overflow = 'visible';
            clonedModal.scrollTop = 0;
            clonedModal.scrollLeft = 0;
          }
          if (clonedBody) {
            clonedBody.style.height = 'auto';
            clonedBody.style.maxHeight = 'none';
            clonedBody.style.overflow = 'visible';
            clonedBody.scrollTop = 0;
          }
          if (clonedElement) {
            clonedElement.scrollTop = 0;
            clonedElement.scrollLeft = 0;
          }
        },
      });
      
      if (modal) {
        modal.style.maxHeight = originalModalMaxHeight;
        modal.style.overflow = originalModalOverflow;
      }
      if (modalBody) {
        modalBody.style.height = originalBodyHeight;
        modalBody.style.maxHeight = originalBodyMaxHeight;
        modalBody.style.overflow = originalBodyOverflow;
      }
      // 닫기 버튼 다시 보이기
      if (closeButton) {
        closeButton.style.display = originalCloseButtonDisplay || '';
      }
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      
      const totalPages = Math.ceil(imgScaledHeight / pdfHeight);
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yPosition = -(i * pdfHeight) + 5;
        pdf.addImage(imgData, 'PNG', 5, yPosition, imgScaledWidth, imgScaledHeight, undefined, 'FAST');
      }
      
      const fileName = `${reportData.year}년_${reportData.month}월_${reportData.studentName || '학생'}_보고서.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="report-modal-overlay" onClick={onClose}>
        <div className="report-modal" onClick={(e) => e.stopPropagation()}>
          <div className="report-modal-header">
            <h2>월별보고서</h2>
            <button className="report-modal-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="report-modal-body">
            <div className="report-loading">
              <div className="loading-spinner"></div>
              <p>보고서를 생성하는 중입니다...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!reportData) {
    return (
      <div className="report-modal-overlay" onClick={onClose}>
        <div className="report-modal" onClick={(e) => e.stopPropagation()}>
          <div className="report-modal-header">
            <h2>월별보고서</h2>
            <button className="report-modal-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="report-modal-body">
            <div className="report-empty">
              <p>해당 월에 리뷰테스트 데이터가 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div ref={modalContentRef}>
          <div className="report-modal-header">
            <h2>{reportData.year}년 {reportData.month}월 {reportData.studentName || '학생'} 보고서</h2>
            <button className="report-modal-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="report-pdf-hint">
            <i className="fas fa-info-circle"></i>
            <span>모바일에서는 PDF로 다운로드하여 보시면 더 편리하게 확인하실 수 있습니다.</span>
          </div>
          <div className="report-modal-body">
          <div className="report-summary">
            <div className="report-summary-card">
              <div className="report-summary-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="report-summary-content">
                <div className="report-summary-label">반명</div>
                <div className="report-summary-value">{reportData.className}</div>
              </div>
            </div>
            <div className="report-summary-card">
              <div className="report-summary-icon">
                <i className="fas fa-list-check"></i>
              </div>
              <div className="report-summary-content">
                <div className="report-summary-label">전체 푼 문제 수</div>
                <div className="report-summary-value">{reportData.totalQuestions}<span className="report-summary-unit">문제</span></div>
              </div>
            </div>
            <div className="report-summary-card">
              <div className="report-summary-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="report-summary-content">
                <div className="report-summary-label">전체 맞은 문제 수</div>
                <div className="report-summary-value">{reportData.totalCorrect}<span className="report-summary-unit">문제</span></div>
              </div>
            </div>
            <div className="report-summary-card report-summary-card-highlight">
              <div className="report-summary-icon">
                <i className="fas fa-percent"></i>
              </div>
              <div className="report-summary-content">
                <div className="report-summary-label">전체 정답률</div>
                <div className="report-summary-value">{reportData.totalPercentage}<span className="report-summary-unit">%</span></div>
              </div>
            </div>
          </div>
          
          {/* 리뷰TEST 그래프 */}
          {reportData.chartData && reportData.chartData.length > 0 && (
            <div className="report-section">
              <h3 className="report-section-title">
                <i className="fas fa-chart-line"></i>
                리뷰TEST 점수 추이
              </h3>
              <div className="report-chart-container">
                <ChartComponent data={reportData.chartData} />
              </div>
            </div>
          )}
          
          <div className="report-section">
            <h3 className="report-section-title">
              <i className="fas fa-list"></i>
              소단원별 상세 통계
            </h3>
            <div className="report-subunit-table-container">
              <table className="report-subunit-table">
                <thead>
                  <tr>
                    <th className="col-subject">과목</th>
                    <th className="col-main-unit">대단원</th>
                    <th className="col-sub-unit">소단원</th>
                    <th className="col-total">전체</th>
                    <th className="col-correct">맞은</th>
                    <th className="col-percentage">정답률</th>
                    <th className="col-percentile">반 내 상위</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.subUnitList.map((unit, index) => (
                    <tr key={index}>
                      <td className="col-subject">{unit.subject || '-'}</td>
                      <td className="col-main-unit">{unit.mainUnit || '-'}</td>
                      <td className="col-sub-unit">{unit.subUnit || '-'}</td>
                      <td className="col-total">{unit.total}</td>
                      <td className="col-correct">{unit.correct}</td>
                      <td className="col-percentage">
                        <span className={`report-percentage ${unit.percentage < 60 ? 'low' : unit.percentage < 80 ? 'medium' : 'high'}`}>
                          {unit.percentage}%
                        </span>
                      </td>
                      <td className="col-percentile">상위 {unit.avgPercentile}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {reportData.strongUnits && reportData.strongUnits.length > 0 && (
            <div className="report-section">
              <h3 className="report-section-title">
                <i className="fas fa-check-circle"></i>
                강점 단원
              </h3>
              <div className="report-units-table-container">
                <table className="report-units-table report-units-table-strong">
                  <thead>
                    <tr>
                      <th className="col-rank">순위</th>
                      <th className="col-unit">단원</th>
                      <th className="col-score">정답률</th>
                      <th className="col-problems">맞은 문제</th>
                      <th className="col-percentile">반 내 상위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.strongUnits.map((unit, index) => (
                      <tr key={index}>
                        <td className="col-rank">{index + 1}</td>
                        <td className="col-unit">{unit.subject}/{unit.mainUnit}/{unit.subUnit}</td>
                        <td className="col-score">
                          <span className="report-score-badge report-score-high">{unit.percentage}%</span>
                        </td>
                        <td className="col-problems">{unit.correct}/{unit.total}</td>
                        <td className="col-percentile">상위 {unit.avgPercentile}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {reportData.weakUnits && reportData.weakUnits.length > 0 && (
            <div className="report-section">
              <h3 className="report-section-title">
                <i className="fas fa-exclamation-circle"></i>
                취약 단원
              </h3>
              <div className="report-units-table-container">
                <table className="report-units-table report-units-table-weak">
                  <thead>
                    <tr>
                      <th className="col-rank">순위</th>
                      <th className="col-unit">단원</th>
                      <th className="col-score">정답률</th>
                      <th className="col-problems">맞은 문제</th>
                      <th className="col-percentile">반 내 상위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.weakUnits.slice(0, 5).map((unit, index) => (
                      <tr key={index}>
                        <td className="col-rank">{index + 1}</td>
                        <td className="col-unit">{unit.subject}/{unit.mainUnit}/{unit.subUnit}</td>
                        <td className="col-score">
                          <span className="report-score-badge report-score-low">{unit.percentage}%</span>
                        </td>
                        <td className="col-problems">{unit.correct}/{unit.total}</td>
                        <td className="col-percentile">상위 {unit.avgPercentile}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        </div>
        <div className="report-modal-footer">
          <button 
            className="btn-report-download" 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                PDF 생성 중...
              </>
            ) : (
              <>
                <i className="fas fa-download"></i>
                PDF 다운로드
              </>
            )}
          </button>
          <button className="btn-report-close" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// 그래프 컴포넌트 (MyMonthlyStatisticsDetail.jsx에서 복사)
function ChartComponent({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartWrapperRef = useRef(null);
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0, time: 0 });
  const [isTouchTooltip, setIsTouchTooltip] = useState(false);
  const [touchStartIndex, setTouchStartIndex] = useState(null);
  const [dragDirection, setDragDirection] = useState(null);

  if (!data || data.length === 0) return null;

  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

  const validScores = sortedData.flatMap(d => [
    d.myScore !== null && d.myScore !== undefined ? d.myScore : null,
    d.classAverage !== null && d.classAverage !== undefined ? d.classAverage : null,
    d.maxScore !== null && d.maxScore !== undefined ? d.maxScore : null
  ]).filter(score => score !== null);

  if (validScores.length === 0) return null;

  const maxScore = Math.max(...validScores);
  const minScore = Math.min(...validScores);
  const scoreRange = maxScore - minScore || 100;
  const padding = Math.max(5, scoreRange * 0.1);
  const chartMax = Math.min(100, Math.ceil(maxScore + padding));
  const chartMin = Math.max(0, Math.floor(minScore - padding));

  const chartHeight = 300;
  const topPadding = 20;
  const minBarWidth = 80;
  const chartContentWidth = Math.max(600, sortedData.length * minBarWidth);
  const sidePadding = 100;
  const chartWidth = chartContentWidth + (sidePadding * 2);
  const xStep = sortedData.length > 1 ? chartContentWidth / (sortedData.length - 1) : 0;
  const yStep = (chartHeight - topPadding) / (chartMax - chartMin || 100);

  const getY = (score) => {
    if (score === null || score === undefined) return null;
    return (chartHeight - topPadding) - ((score - chartMin) * yStep) + topPadding;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    return `${year}.${month}.${day} (${dayOfWeek})`;
  };

  const handleMouseEnter = (index, event) => {
    setHoveredIndex(index);
    if (chartWrapperRef.current && svgRef.current) {
      const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
      const x = event.clientX - wrapperRect.left;
      const y = event.clientY - wrapperRect.top;
      setTooltipPosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleMouseDown = (e) => {
    if (chartWrapperRef.current && e.button === 0) {
      setIsDragging(true);
      setHoveredIndex(null);
      setDragStart({
        x: e.pageX - chartWrapperRef.current.offsetLeft,
        scrollLeft: chartWrapperRef.current.scrollLeft,
      });
      chartWrapperRef.current.style.cursor = 'grabbing';
      chartWrapperRef.current.style.userSelect = 'none';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !chartWrapperRef.current) return;
    e.preventDefault();
    const x = e.pageX - chartWrapperRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2;
    chartWrapperRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    if (chartWrapperRef.current) {
      setIsDragging(false);
      chartWrapperRef.current.style.cursor = 'grab';
      chartWrapperRef.current.style.userSelect = '';
    }
  };

  const handleTouchStart = (e) => {
    const target = e.target;
    if (target.closest('.hover-area-mobile') || target.closest('.hover-area-pc') || 
        target.tagName === 'circle' || target.closest('circle')) {
      return;
    }
    
    if (chartWrapperRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStartPos({ x: touch.pageX, y: touch.pageY, time: Date.now() });
      setIsDragging(false);
      setIsTouchTooltip(false);
      setHoveredIndex(null);
      setTouchStartIndex(null);
      setDragDirection(null);
    }
  };

  const handleTouchMove = (e) => {
    if (!chartWrapperRef.current || e.touches.length !== 1) return;
    
    if (dragDirection === 'vertical') {
      return;
    }
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.pageX - touchStartPos.x);
    const deltaY = Math.abs(touch.pageY - touchStartPos.y);
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (moveDistance > 10) {
      if (!dragDirection) {
        if (deltaY > deltaX) {
          setDragDirection('vertical');
          setHoveredIndex(null);
          setIsTouchTooltip(false);
          return;
        } else {
          setDragDirection('horizontal');
        }
      }
      
      if (dragDirection === 'horizontal') {
        setIsDragging(true);
        setHoveredIndex(null);
        setIsTouchTooltip(false);
        if (e.cancelable) {
          e.preventDefault();
        }
        const x = touch.pageX - chartWrapperRef.current.offsetLeft;
        const walk = (x - touchStartPos.x) * 2;
        chartWrapperRef.current.scrollLeft = chartWrapperRef.current.scrollLeft - walk;
      }
    }
  };

  const handleTouchEnd = (e) => {
    const target = e.target;
    if (target.tagName === 'circle' || target.closest('circle') || target.closest('.hover-area-pc') || target.closest('.hover-area-mobile')) {
      return;
    }
    
    if (!isDragging && touchStartIndex === null) {
      setHoveredIndex(null);
      setIsTouchTooltip(false);
    }
    
    setIsDragging(false);
    setTouchStartPos({ x: 0, y: 0, time: 0 });
    setTouchStartIndex(null);
    setDragDirection(null);
  };

  useEffect(() => {
    if (!isTouchTooltip) return;
    
    const handleOutsideTouch = (e) => {
      if (!chartWrapperRef.current) return;
      
      const target = e.target;
      const isOutsideChart = !chartWrapperRef.current.contains(target);
      
      const touchedHoverArea = target.closest('.hover-area-mobile');
      const currentHoverArea = hoveredIndex !== null ? 
        document.querySelector(`.hover-area-mobile[data-index="${hoveredIndex}"]`) : null;
      const isOtherHoverArea = touchedHoverArea && touchedHoverArea !== currentHoverArea;
      
      const isOtherChartElement = chartWrapperRef.current.contains(target) && 
                                  !touchedHoverArea && 
                                  target.tagName !== 'circle' &&
                                  !target.closest('circle');
      
      if (isOutsideChart || isOtherHoverArea || isOtherChartElement) {
        setHoveredIndex(null);
        setIsTouchTooltip(false);
      }
    };
    
    document.addEventListener('touchstart', handleOutsideTouch);
    
    return () => {
      document.removeEventListener('touchstart', handleOutsideTouch);
    };
  }, [isTouchTooltip, hoveredIndex]);

  const handleMouseLeaveWrapper = () => {
    if (isDragging && chartWrapperRef.current) {
      setIsDragging(false);
      chartWrapperRef.current.style.cursor = 'grab';
      chartWrapperRef.current.style.userSelect = '';
    }
    setHoveredIndex(null);
  };

  useEffect(() => {
    if (chartWrapperRef.current) {
      setTimeout(() => {
        if (chartWrapperRef.current) {
          chartWrapperRef.current.scrollLeft = chartWrapperRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [sortedData]);

  const myScorePath = sortedData
    .map((d, i) => {
      const y = getY(d.myScore);
      if (y === null) return null;
      const x = sidePadding + (i * xStep);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .filter(p => p !== null)
    .join(' ');

  const averagePath = sortedData
    .map((d, i) => {
      const y = getY(d.classAverage);
      if (y === null) return null;
      const x = sidePadding + (i * xStep);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .filter(p => p !== null)
    .join(' ');

  const maxScorePath = sortedData
    .map((d, i) => {
      const y = getY(d.maxScore);
      if (y === null) return null;
      const x = sidePadding + (i * xStep);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .filter(p => p !== null)
    .join(' ');

  return (
    <div className="chart-container">
      <div 
        className="chart-svg-wrapper" 
        ref={chartWrapperRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeaveWrapper}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'pan-x pan-y' }}
      >
        {hoveredIndex !== null && sortedData[hoveredIndex] && !isDragging && (
          <div
            className={`chart-tooltip ${isTouchTooltip ? 'chart-tooltip-mobile' : ''}`}
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 120}px`,
            }}
          >
            <div className="tooltip-date">
              {formatFullDate(sortedData[hoveredIndex].date)}
            </div>
            <div className="tooltip-scores">
              {sortedData[hoveredIndex].myScore !== null && sortedData[hoveredIndex].myScore !== undefined && (
                <div className="tooltip-item tooltip-my-score">
                  <span className="tooltip-label">내 점수</span>
                  <span className="tooltip-value">{sortedData[hoveredIndex].myScore}점</span>
                </div>
              )}
              {sortedData[hoveredIndex].classAverage !== null && sortedData[hoveredIndex].classAverage !== undefined && (
                <div className="tooltip-item tooltip-average">
                  <span className="tooltip-label">반평균</span>
                  <span className="tooltip-value">{sortedData[hoveredIndex].classAverage}점</span>
                </div>
              )}
              {sortedData[hoveredIndex].maxScore !== null && sortedData[hoveredIndex].maxScore !== undefined && (
                <div className="tooltip-item tooltip-max">
                  <span className="tooltip-label">최고점</span>
                  <span className="tooltip-value">{sortedData[hoveredIndex].maxScore}점</span>
                </div>
              )}
            </div>
          </div>
        )}
        <svg
          ref={svgRef}
          width={chartWidth}
          height={chartHeight + 60}
          className="chart-svg"
          onMouseLeave={handleMouseLeave}
        >
          {[0, 25, 50, 75, 100].map((value) => {
            if (value < chartMin || value > chartMax) return null;
            const y = getY(value);
            if (y === null) return null;
            return (
              <g key={value}>
                <line
                  x1={sidePadding}
                  y1={y}
                  x2={chartWidth - sidePadding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.5"
                />
              </g>
            );
          })}

          {myScorePath && (
            <path
              d={myScorePath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {averagePath && (
            <path
              d={averagePath}
              fill="none"
              stroke="#42a5f5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="5,5"
            />
          )}

          {maxScorePath && (
            <path
              d={maxScorePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {sortedData.map((d, i) => {
            const x = sidePadding + (i * xStep);
            const myY = getY(d.myScore);
            const avgY = getY(d.classAverage);
            const maxY = getY(d.maxScore);

            return (
              <g key={i}>
                <rect
                  x={x - 40}
                  y={topPadding}
                  width="80"
                  height={chartHeight - topPadding}
                  fill="transparent"
                  data-index={i}
                  onMouseEnter={(e) => !isDragging && handleMouseEnter(i, e)}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (chartWrapperRef.current && e.touches.length === 1) {
                      const touch = e.touches[0];
                      setTouchStartPos({ x: touch.pageX, y: touch.pageY, time: Date.now() });
                      setTouchStartIndex(i);
                      setIsDragging(false);
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    if (e.cancelable) {
                      e.preventDefault();
                    }
                    if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                      const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                      const touch = e.changedTouches[0];
                      const xPos = touch.clientX - wrapperRect.left;
                      const yPos = touch.clientY - wrapperRect.top;
                      setHoveredIndex(i);
                      setIsTouchTooltip(true);
                      setTooltipPosition({ x: xPos, y: yPos });
                    }
                    setTouchStartIndex(null);
                  }}
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  className="hover-area-pc hover-area-mobile"
                />

                {myY !== null && (
                  <circle
                    cx={x}
                    cy={myY}
                    r="6"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2"
                    onMouseEnter={(e) => !isDragging && handleMouseEnter(i, e)}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (chartWrapperRef.current && e.touches.length === 1) {
                        const touch = e.touches[0];
                        setTouchStartPos({ x: touch.pageX, y: touch.pageY, time: Date.now() });
                        setTouchStartIndex(i);
                        setIsDragging(false);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      if (e.cancelable) {
                        e.preventDefault();
                      }
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const xPos = touch.clientX - wrapperRect.left;
                        const yPos = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x: xPos, y: yPos });
                      }
                      setTouchStartIndex(null);
                    }}
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
                  />
                )}

                {avgY !== null && (
                  <circle
                    cx={x}
                    cy={avgY}
                    r="5"
                    fill="#42a5f5"
                    stroke="white"
                    strokeWidth="2"
                    onMouseEnter={(e) => !isDragging && handleMouseEnter(i, e)}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (chartWrapperRef.current && e.touches.length === 1) {
                        const touch = e.touches[0];
                        setTouchStartPos({ x: touch.pageX, y: touch.pageY, time: Date.now() });
                        setTouchStartIndex(i);
                        setIsDragging(false);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      if (e.cancelable) {
                        e.preventDefault();
                      }
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const xPos = touch.clientX - wrapperRect.left;
                        const yPos = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x: xPos, y: yPos });
                      }
                      setTouchStartIndex(null);
                    }}
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
                  />
                )}

                {maxY !== null && (
                  <circle
                    cx={x}
                    cy={maxY}
                    r="5"
                    fill="#f59e0b"
                    stroke="white"
                    strokeWidth="2"
                    onMouseEnter={(e) => !isDragging && handleMouseEnter(i, e)}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (chartWrapperRef.current && e.touches.length === 1) {
                        const touch = e.touches[0];
                        setTouchStartPos({ x: touch.pageX, y: touch.pageY, time: Date.now() });
                        setTouchStartIndex(i);
                        setIsDragging(false);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      if (e.cancelable) {
                        e.preventDefault();
                      }
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const xPos = touch.clientX - wrapperRect.left;
                        const yPos = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x: xPos, y: yPos });
                      }
                      setTouchStartIndex(null);
                    }}
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
                  />
                )}

                <text
                  x={x}
                  y={chartHeight + 25}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                  fontWeight="500"
                >
                  {formatDate(d.date).split(' ')[0]}
                </text>
                <text
                  x={x}
                  y={chartHeight + 40}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#9ca3af"
                  fontWeight="400"
                >
                  {formatDate(d.date).split(' ')[1]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default AdminClassStudentRecordsDetail;

