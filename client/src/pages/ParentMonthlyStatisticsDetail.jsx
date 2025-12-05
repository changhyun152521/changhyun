import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './MonthlyStatisticsDetail.css';

function ParentMonthlyStatisticsDetail() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState([]);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (classId && selectedYear && selectedMonth) {
      fetchMonthlyData();
    }
  }, [classId, selectedYear, selectedMonth]);

  const checkAuthAndFetchData = async () => {
    try {
      // 초기화
      setMonthlyData([]);
      setError('');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !userStr) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const userData = JSON.parse(userStr);
      
      if (userData.userType !== '학부모') {
        alert('학부모회원만 접근할 수 있는 페이지입니다.');
        navigate('/');
        return;
      }

      // studentId가 없으면 이전 페이지로 리다이렉트
      if (!studentId) {
        alert('학생을 선택해주세요.');
        navigate('/parent-monthly-statistics');
        return;
      }

      // 학생 정보 가져오기 (이름 표시용)
      try {
        const studentResponse = await api.get(`/users/${studentId}`);
        if (studentResponse.data.success) {
          setStudentName(studentResponse.data.data.name || '학생');
        }
      } catch (studentError) {
        console.error('학생 정보 가져오기 오류:', studentError);
        setStudentName('학생');
      }

      // 반 정보 가져오기
      const classResponse = await api.get(`/classes/${classId}`);
      if (classResponse.data.success) {
        setClassData(classResponse.data.data);
      }
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setMonthlyData([]);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    } finally {
      // fetchMonthlyData가 실행될 때까지 loading을 유지하지 않음
      // fetchMonthlyData에서 자체적으로 loading을 관리
    }
  };

  const fetchMonthlyData = async () => {
    try {
      // 초기화
      setMonthlyData([]);
      setError('');
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
          api.get(`/student-records/my-records?classId=${classId}&date=${dateStr}&studentId=${studentId}`)
            .then(response => {
              if (response.data.success) {
                return {
                  date: dateStr,
                  day: day,
                  data: response.data.data,
                };
              }
              return {
                date: dateStr,
                day: day,
                data: null,
              };
            })
            .catch((error) => {
              console.error(`[${dateStr}] 데이터 가져오기 실패:`, error);
              return {
                date: dateStr,
                day: day,
                data: null,
              };
            })
        );
      }

      const results = await Promise.all(datePromises);
      setMonthlyData(results);
    } catch (error) {
      console.error('월별 데이터 가져오기 오류:', error);
      setError('월별 데이터를 불러오는 중 오류가 발생했습니다.');
      setMonthlyData([]);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
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

  // 월별 데이터를 그래프 형식으로 변환
  const getChartData = () => {
    const chartData = monthlyData
      .filter(item => item.data?.studentRecord?.dailyTestScore) // 리뷰TEST 데이터가 있는 날짜만
      .map(item => {
        const record = item.data?.studentRecord;
        const myScore = convertDailyTestScoreToPercentage(record?.dailyTestScore);
        const classAverage = item.data?.classAverage;
        const classMaxScore = item.data?.classMaxScore;
        
        return {
          date: item.date,
          myScore: myScore,
          classAverage: classAverage !== null && classAverage !== undefined && !isNaN(Number(classAverage)) ? Number(classAverage) : null,
          maxScore: classMaxScore !== null && classMaxScore !== undefined && !isNaN(Number(classMaxScore)) ? Number(classMaxScore) : null,
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // 날짜순 정렬
    
    return chartData;
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

  // 연도 선택 옵션 (최근 5년)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = 0; i < 5; i++) {
    yearOptions.push(currentYear - i);
  }

  // 월 선택 옵션
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="monthly-statistics-detail-page">
      <Header />
      <section className="monthly-statistics-detail-section">
        <div className="container">
          <div className="page-header">
            <button
              className="btn-back"
              onClick={() => navigate('/parent-class/statistics')}
            >
              목록으로
            </button>
            <div className="page-header-content">
              <div className="page-header-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <h1 className="page-title">{classData?.className || '월별통계'}</h1>
              <p className="page-description">
                {studentName ? `${studentName}학생의 월별 통계를 확인할 수 있습니다.` : '월별 통계를 확인할 수 있습니다.'}
              </p>
            </div>
          </div>

          {/* 연도/월 선택 */}
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
            <p className="month-selector-hint">표를 좌우로 스와이프하여 모든 정보를 확인하세요</p>
          </div>

          {/* 월별 통계 테이블 */}
          <div className="monthly-table-container">
            <table className="monthly-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>출결</th>
                  <th>과제</th>
                  <th>리뷰TEST</th>
                  <th>반평균</th>
                  <th>최고점</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData
                  .filter(item => item.data?.studentRecord) // 데이터가 있는 날짜만 필터링
                  .map((item) => {
                    const record = item.data?.studentRecord;
                    const classStats = item.data?.classAverage;
                    const classMaxScore = item.data?.classMaxScore;
                    
                    // 리뷰TEST 점수 포맷팅 (항상 "점" 포함)
                    const dailyScore = record?.dailyTestScore ? formatScore(record.dailyTestScore) : '-';
                    
                    // 반평균: null/undefined가 아니고 유효한 숫자인 경우만 표시
                    // 0도 유효한 값이므로 체크에 포함
                    const classAvg = (classStats !== null && classStats !== undefined && classStats !== '' && !isNaN(Number(classStats))) 
                      ? `${classStats}점` 
                      : '-';
                    
                    // 최고점: null/undefined가 아니고 유효한 숫자인 경우만 표시
                    // 0도 유효한 값이므로 체크에 포함
                    const classMax = (classMaxScore !== null && classMaxScore !== undefined && classMaxScore !== '' && !isNaN(Number(classMaxScore))) 
                      ? `${classMaxScore}점` 
                      : '-';

                    return (
                      <tr key={item.date} className="has-data">
                        <td>{item.day}일({getDayOfWeek(item.date)})</td>
                        <td>
                          {record?.attendance ? (
                            <span className="status-badge status-present">출석</span>
                          ) : (
                            <span className="status-badge status-absent">결석</span>
                          )}
                        </td>
                        <td>
                          {record?.assignment ? (
                            <span className="status-badge status-complete">완료</span>
                          ) : (
                            <span className="status-badge status-incomplete">미완료</span>
                          )}
                        </td>
                        <td className="score-cell">{dailyScore}</td>
                        <td className="score-cell">{classAvg}</td>
                        <td className="score-cell">{classMax}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* 리뷰TEST 점수 추이 그래프 */}
          {getChartData().length > 0 && (
            <div className="trend-chart-container">
              <h2 className="chart-title">리뷰TEST 점수 추이</h2>
              <p className="chart-hint">
                <span>좌우 스와이프로 전체 정보 확인</span>
                <span>점수 터치 시 상세 정보 표시</span>
              </p>
              <div className="chart-wrapper">
                <ChartComponent data={getChartData()} />
              </div>
            </div>
          )}

          {/* 실전TEST 별도 섹션 */}
          {monthlyData.some(item => item.data?.studentRecord?.monthlyEvaluationScore) && (
            <div className="monthly-evaluation-section">
              <h2 className="section-title">실전TEST</h2>
              <div className="monthly-table-container">
                <table className="monthly-table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>내점수</th>
                      <th>반평균</th>
                      <th>최고점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData
                      .filter(item => item.data?.studentRecord?.monthlyEvaluationScore) // 실전TEST 데이터가 있는 날짜만 필터링
                      .map((item) => {
                        const record = item.data?.studentRecord;
                        const monthlyScore = record?.monthlyEvaluationScore ? formatScore(record.monthlyEvaluationScore) : '-';
                        const monthlyAvg = item.data?.monthlyAverage !== null && item.data?.monthlyAverage !== undefined 
                          ? `${item.data.monthlyAverage}점` : '-';
                        const monthlyMax = item.data?.monthlyMax !== null && item.data?.monthlyMax !== undefined 
                          ? `${item.data.monthlyMax}점` : '-';

                        return (
                          <tr key={item.date} className="has-data">
                            <td>{item.day}일({getDayOfWeek(item.date)})</td>
                            <td className="score-cell">{monthlyScore}</td>
                            <td className="score-cell">{monthlyAvg}</td>
                            <td className="score-cell">{monthlyMax}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

// 그래프 컴포넌트
function ChartComponent({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartWrapperRef = useRef(null);
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0, time: 0 });
  const [isTouchTooltip, setIsTouchTooltip] = useState(false);
  const [touchStartIndex, setTouchStartIndex] = useState(null); // 터치 시작한 데이터 포인트 인덱스
  const [dragDirection, setDragDirection] = useState(null); // 'horizontal' 또는 'vertical'

  if (!data || data.length === 0) return null;

  // 날짜순 정렬 (오래된 것부터)
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 유효한 점수만 필터링
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
      const svgRect = svgRef.current.getBoundingClientRect();
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
    // hover-area나 circle에서 발생한 터치는 각각의 onTouchStart에서 처리
    const target = e.target;
    if (target.closest('.hover-area-mobile') || target.closest('.hover-area-pc') || 
        target.tagName === 'circle' || target.closest('circle')) {
      return;
    }
    
    // 차트 영역 내 다른 곳을 터치하면 툴팁 사라지기
    if (chartWrapperRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const startX = touch.pageX;
      const startY = touch.pageY;
      const startTime = Date.now();
      
      setTouchStartPos({ x: startX, y: startY, time: startTime });
      setIsDragging(false);
      setIsTouchTooltip(false);
      setHoveredIndex(null); // 기존 툴팁 숨기기
      setTouchStartIndex(null);
      setDragDirection(null); // 드래그 방향 초기화
      // 위아래 드래그를 위해 기본 동작을 방해하지 않음 (e.preventDefault() 호출 안 함)
    }
  };

  const handleTouchMove = (e) => {
    if (!chartWrapperRef.current || e.touches.length !== 1) return;
    
    // 이미 위아래 드래그로 판단되었으면 아무것도 하지 않고 기본 스크롤 허용
    if (dragDirection === 'vertical') {
      return;
    }
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.pageX - touchStartPos.x);
    const deltaY = Math.abs(touch.pageY - touchStartPos.y);
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 10px 이상 움직이면 드래그로 간주
    if (moveDistance > 10) {
      // 드래그 방향이 아직 결정되지 않았으면 방향 판단
      if (!dragDirection) {
        // 위아래 드래그가 좌우 드래그보다 더 크면 세로 드래그
        if (deltaY > deltaX) {
          setDragDirection('vertical');
          // 위아래 드래그로 판단되면 여기서 종료하여 기본 스크롤이 동작하도록 함
          setHoveredIndex(null);
          setIsTouchTooltip(false);
          return;
        } else {
          setDragDirection('horizontal');
        }
      }
      
      if (dragDirection === 'horizontal') {
        // 좌우 드래그: 차트 스크롤
        setIsDragging(true);
        setHoveredIndex(null); // 툴팁 숨기기
        setIsTouchTooltip(false);
        e.preventDefault(); // 기본 스크롤 방지
        const x = touch.pageX - chartWrapperRef.current.offsetLeft;
        const walk = (x - touchStartPos.x) * 2;
        chartWrapperRef.current.scrollLeft = chartWrapperRef.current.scrollLeft - walk;
      }
    }
  };

  const handleTouchEnd = (e) => {
    // hover-area나 circle에서 발생한 터치는 각각의 onTouchEnd에서 처리
    const target = e.target;
    if (target.tagName === 'circle' || target.closest('circle') || target.closest('.hover-area-pc') || target.closest('.hover-area-mobile')) {
      return;
    }
    
    // 드래그가 아니었으면 툴팁 사라지기
    if (!isDragging && touchStartIndex === null) {
      setHoveredIndex(null);
      setIsTouchTooltip(false);
    }
    
    setIsDragging(false);
    setTouchStartPos({ x: 0, y: 0, time: 0 });
    setTouchStartIndex(null);
    setDragDirection(null);
  };

  // 화면 밖 또는 차트 내 다른 영역 터치 시 툴팁 사라지기 (모바일 전용)
  useEffect(() => {
    if (!isTouchTooltip) return;
    
    const handleOutsideTouch = (e) => {
      if (!chartWrapperRef.current) return;
      
      const target = e.target;
      // 차트 영역 밖을 터치한 경우
      const isOutsideChart = !chartWrapperRef.current.contains(target);
      
      // 다른 hover-area를 터치한 경우
      const touchedHoverArea = target.closest('.hover-area-mobile');
      const currentHoverArea = hoveredIndex !== null ? 
        document.querySelector(`.hover-area-mobile[data-index="${hoveredIndex}"]`) : null;
      const isOtherHoverArea = touchedHoverArea && touchedHoverArea !== currentHoverArea;
      
      // 차트 내 다른 영역(rect, line, path 등)을 터치한 경우
      const isOtherChartElement = chartWrapperRef.current.contains(target) && 
                                  !touchedHoverArea && 
                                  target.tagName !== 'circle' &&
                                  !target.closest('circle');
      
      if (isOutsideChart || isOtherHoverArea || isOtherChartElement) {
        setHoveredIndex(null);
        setIsTouchTooltip(false);
      }
    };
    
    // 터치 이벤트 리스너 추가
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
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span>내 점수</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#42a5f5' }}></span>
          <span>반평균</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
          <span>최고점</span>
        </div>
      </div>
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
                {/* 호버 영역 (보이지 않지만 클릭 가능) - PC 및 모바일용 */}
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
                    e.preventDefault();
                    // 드래그가 아니었으면 정보 표시
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
                      e.preventDefault();
                      // 드래그가 아니었으면 정보 표시
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
                      e.preventDefault();
                      // 드래그가 아니었으면 정보 표시
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
                      e.preventDefault();
                      // 드래그가 아니었으면 정보 표시
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

export default ParentMonthlyStatisticsDetail;

