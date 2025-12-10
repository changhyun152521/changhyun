import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './ClassStatusDetail.css';

function ParentClassStatusDetail() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [latestDate, setLatestDate] = useState('');
  const [classRecord, setClassRecord] = useState(null);
  const [studentRecord, setStudentRecord] = useState(null);
  const [classAverage, setClassAverage] = useState(null);
  const [classMaxScore, setClassMaxScore] = useState(null);
  const [classMaxScoreStudent, setClassMaxScoreStudent] = useState(null);
  const [classMaxScoreCount, setClassMaxScoreCount] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(null);
  const [monthlyMax, setMonthlyMax] = useState(null);
  const [monthlyMaxStudent, setMonthlyMaxStudent] = useState(null);
  const [monthlyMaxScoreCount, setMonthlyMaxScoreCount] = useState(0);
  const [availableDates, setAvailableDates] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (classId && selectedDate) {
      fetchRecords();
    }
  }, [classId, selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setCalendarMonth(date);
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCalendar && !e.target.closest('.date-display-wrapper') && !e.target.closest('.calendar-modal')) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

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
      
      if (userData.userType !== '학부모') {
        alert('학부모회원만 접근할 수 있는 페이지입니다.');
        navigate('/');
        return;
      }

      // 반 정보 가져오기
      const classResponse = await api.get(`/classes/${classId}`);
      if (classResponse.data.success) {
        setClassData(classResponse.data.data);
      }

      // studentId가 없으면 이전 페이지로 리다이렉트
      if (!studentId) {
        alert('학생을 선택해주세요.');
        navigate('/parent-class-status');
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

      // 최근 기록이 있는 날짜 가져오기 (선택된 학생의 기록)
      try {
        const recordsResponse = await api.get(`/student-records/my-records?classId=${classId}&studentId=${studentId}`);
        if (recordsResponse.data.success) {
          const { latestDate: latest, availableDates: dates } = recordsResponse.data.data;
          setAvailableDates(dates || []);
          if (latest && dates && dates.length > 0) {
            setLatestDate(latest);
            setSelectedDate(latest);
          } else if (dates && dates.length > 0) {
            // 최근 날짜가 없지만 사용 가능한 날짜가 있으면 첫 번째 날짜 선택
            setSelectedDate(dates[0]);
          }
        } else {
          console.error('기록 날짜 가져오기 실패:', recordsResponse.data.error);
          setAvailableDates([]);
        }
      } catch (recordsError) {
        console.error('기록 날짜 가져오기 오류:', recordsError);
        // 기록 날짜를 가져오지 못해도 페이지는 표시
        setAvailableDates([]);
        if (recordsError.response?.status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
          return;
        }
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

  const fetchRecords = async () => {
    if (!selectedDate || !classId) {
      return;
    }
    
    try {
      const response = await api.get(`/student-records/my-records?classId=${classId}&date=${selectedDate}&studentId=${studentId}`);
      if (response.data.success) {
        setClassRecord(response.data.data.classRecord);
        setStudentRecord(response.data.data.studentRecord);
        setClassAverage(response.data.data.classAverage);
        setClassMaxScore(response.data.data.classMaxScore);
        setClassMaxScoreStudent(response.data.data.classMaxScoreStudent);
        setClassMaxScoreCount(response.data.data.classMaxScoreCount || 0);
        setMonthlyAverage(response.data.data.monthlyAverage);
        setMonthlyMax(response.data.data.monthlyMax);
        setMonthlyMaxStudent(response.data.data.monthlyMaxStudent);
        setMonthlyMaxScoreCount(response.data.data.monthlyMaxScoreCount || 0);
        if (response.data.data.availableDates) {
          setAvailableDates(response.data.data.availableDates);
        }
        if (response.data.data.trendData) {
          setTrendData(response.data.data.trendData);
        }
      } else {
        console.error('기록 가져오기 실패:', response.data.error);
        setError(response.data.error || '기록을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('기록 가져오기 오류:', error);
      if (error.response) {
        console.error('응답 데이터:', error.response.data);
        if (error.response.status === 401) {
          setError('로그인이 필요합니다.');
        } else if (error.response.status === 404) {
          setError('기록을 찾을 수 없습니다.');
        } else {
          setError(error.response.data?.error || '기록을 불러오는 중 오류가 발생했습니다.');
        }
      } else {
        setError('서버에 연결할 수 없습니다.');
      }
      setClassRecord(null);
      setStudentRecord(null);
      setClassAverage(null);
      setClassMaxScore(null);
      setClassMaxScoreStudent(null);
      setClassMaxScoreCount(0);
      setMonthlyAverage(null);
      setMonthlyMax(null);
      setMonthlyMaxStudent(null);
      setMonthlyMaxScoreCount(0);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (availableDates.includes(newDate)) {
      setSelectedDate(newDate);
      setShowCalendar(false);
    }
  };

  const handleDateDisplayClick = () => {
    if (availableDates.length > 0) {
      setShowCalendar(!showCalendar);
    }
  };

  const handleCalendarDateClick = (dateString) => {
    if (dateString && availableDates.includes(dateString)) {
      setSelectedDate(dateString);
      setShowCalendar(false);
    }
  };

  const handleCalendarMonthChange = (direction) => {
    const newMonth = new Date(calendarMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCalendarMonth(newMonth);
  };

  // 날짜를 YYYY-MM-DD 형식의 문자열로 변환 (로컬 시간대 사용)
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 이전 달의 마지막 날들
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      const dateString = formatDateToString(date);
      days.push({
        date: date,
        dateString: dateString,
        isCurrentMonth: false,
        isAvailable: availableDates.includes(dateString),
      });
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDateToString(date);
      days.push({
        date: date,
        dateString: dateString,
        isCurrentMonth: true,
        isAvailable: availableDates.includes(dateString),
        isSelected: dateString === selectedDate,
      });
    }

    // 다음 달의 첫 날들 (달력을 채우기 위해)
    const remainingDays = 42 - days.length; // 6주 * 7일 = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateString = formatDateToString(date);
      days.push({
        date: date,
        dateString: dateString,
        isCurrentMonth: false,
        isAvailable: availableDates.includes(dateString),
      });
    }

    return days;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${year}.${month}.${day} (${weekday})`;
  };

  // availableDates는 최신순으로 정렬되어 있음 (index 0 = 가장 최근)
  // 왼쪽 버튼: 더 오래된 날짜 (과거) = index 증가
  // 오른쪽 버튼: 더 최근 날짜 (미래) = index 감소
  const handlePrevDate = () => {
    if (availableDates.length === 0) return;
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };

  const handleNextDate = () => {
    if (availableDates.length === 0) return;
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  // 리뷰TEST 점수를 백분율로 변환
  const convertDailyTestScoreToPercentage = (score) => {
    if (!score) return null;
    if (typeof score === 'string' && score.includes('/')) {
      const [correct, total] = score.split('/').map(Number);
      if (total > 0) {
        return Math.round((correct / total) * 100);
      }
    }
    return null;
  };

  // 실전TEST 점수 변환 (맞은개수/총문항수 형식을 백분율로 변환)
  const getMonthlyEvaluationScore = () => {
    if (studentRecord?.monthlyEvaluationScore !== null && studentRecord?.monthlyEvaluationScore !== undefined) {
      // 문자열 형식인 경우 (맞은개수/총문항수)
      if (typeof studentRecord.monthlyEvaluationScore === 'string' && studentRecord.monthlyEvaluationScore.includes('/')) {
        const [correct, total] = studentRecord.monthlyEvaluationScore.split('/').map(Number);
        if (total > 0) {
          return Math.round((correct / total) * 100);
        }
      } else if (typeof studentRecord.monthlyEvaluationScore === 'number') {
        // 기존 Number 형식 데이터 호환성
        return Math.round(studentRecord.monthlyEvaluationScore);
      }
    }
    return null;
  };

  // 이름 마스킹 (가운데 글자를 ㅇ로 변경)
  const maskName = (name) => {
    if (!name) return '';
    if (name.length === 1) return name;
    if (name.length === 2) return name[0] + 'ㅇ';
    // 3글자 이상: 첫 글자 + ㅇ + (세 번째 글자부터 끝까지)
    return name[0] + 'ㅇ' + name.slice(2);
  };

  if (loading) {
    return (
      <div className="class-status-detail-page">
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
      <div className="class-status-detail-page">
        <Header />
        <div className="error-container">
          <p>{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="class-status-detail-page">
      <Header />
      <section className="class-status-detail-section">
        <div className="container">
          <div className="page-header">
            <button className="btn-back" onClick={() => navigate('/parent-class/status')}>
              목록으로
            </button>
            <div className="page-header-content">
              <div className="page-header-icon">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <h1 className="page-title">
                {classData?.className || '수업 현황'}
              </h1>
              <p className="page-description">
                {studentName ? `${studentName}학생의 수업 현황을 확인할 수 있습니다.` : '수업 현황을 확인할 수 있습니다.'}
              </p>
            </div>
          </div>

          <div className="date-selector-container">
            <button 
              className="date-nav-btn date-arrow-btn"
              onClick={handlePrevDate}
              disabled={availableDates.length === 0 || availableDates.indexOf(selectedDate) === availableDates.length - 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="date-display-wrapper" onClick={handleDateDisplayClick}>
              <span className="date-display">{formatDateForDisplay(selectedDate)}</span>
              <button 
                className="date-dropdown-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendar(!showCalendar);
                }}
                disabled={availableDates.length === 0}
              >
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>
            {showCalendar && availableDates.length > 0 && (
              <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
                <div className="calendar-header">
                  <button 
                    className="calendar-nav-btn"
                    onClick={() => handleCalendarMonthChange('prev')}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="calendar-month-year">
                    {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                  </span>
                  <button 
                    className="calendar-nav-btn"
                    onClick={() => handleCalendarMonthChange('next')}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                <div className="calendar-weekdays">
                  <div className="calendar-weekday">일</div>
                  <div className="calendar-weekday">월</div>
                  <div className="calendar-weekday">화</div>
                  <div className="calendar-weekday">수</div>
                  <div className="calendar-weekday">목</div>
                  <div className="calendar-weekday">금</div>
                  <div className="calendar-weekday">토</div>
                </div>
                <div className="calendar-days">
                  {getCalendarDays().map((day, index) => (
                    <button
                      key={index}
                      className={`calendar-day ${
                        !day.isCurrentMonth ? 'other-month' : ''
                      } ${
                        day.isAvailable ? 'available' : 'unavailable'
                      } ${
                        day.isSelected ? 'selected' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (day.isAvailable && day.dateString) {
                          handleCalendarDateClick(day.dateString);
                        }
                      }}
                      disabled={!day.isAvailable}
                    >
                      {day.date.getDate()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button 
              className="date-nav-btn date-arrow-btn"
              onClick={handleNextDate}
              disabled={availableDates.length === 0 || availableDates.indexOf(selectedDate) === 0}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="records-tables-container">
            <div className="records-table-container">
              <h2 className="table-section-title">반 전체 정보</h2>
              <table className="records-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="table-label">날짜</td>
                    <td className="table-value">{selectedDate ? formatDateForDisplay(selectedDate) : '날짜 없음'}</td>
                  </tr>
                  <tr>
                    <td className="table-label">진도</td>
                    <td className="table-value">{classRecord?.progress || '기록 없음'}</td>
                  </tr>
                  <tr>
                    <td className="table-label">과제</td>
                    <td className="table-value">{classRecord?.assignment || '기록 없음'}</td>
                  </tr>
                  <tr>
                    <td className="table-label">영상여부</td>
                    <td className="table-value">
                      {classRecord?.hasVideo ? 'O' : classRecord ? 'X' : '기록 없음'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="records-table-container">
              <h2 className="table-section-title">내 기록</h2>
              <table className="records-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="table-label">출결</td>
                    <td className="table-value">
                      {studentRecord?.attendance !== undefined
                        ? studentRecord.attendance ? '출석' : '결석'
                        : '기록 없음'}
                    </td>
                  </tr>
                  <tr>
                    <td className="table-label">과제</td>
                    <td className="table-value">
                      {studentRecord?.assignment !== undefined
                        ? studentRecord.assignment ? '완료' : '미완료'
                        : '기록 없음'}
                    </td>
                  </tr>
                  <tr>
                    <td className="table-label">리뷰TEST점수</td>
                    <td className="table-value">
                      {(() => {
                        const percentage = convertDailyTestScoreToPercentage(studentRecord?.dailyTestScore);
                        if (percentage !== null) {
                          return (
                            <div className="test-score-detail">
                              <span className="my-score">{percentage}점</span>
                              {classAverage !== null && (
                                <span className="class-average">반평균: {classAverage}점</span>
                              )}
                              {classMaxScore !== null && (
                                <span className="class-max">
                                  최고점: {classMaxScore}점
                                </span>
                              )}
                            </div>
                          );
                        }
                        return '기록 없음';
                      })()}
                    </td>
                  </tr>
                  {(() => {
                    const monthlyScore = getMonthlyEvaluationScore();
                    return monthlyScore !== null ? (
                      <tr>
                        <td className="table-label">실전TEST점수</td>
                        <td className="table-value">
                          <div className="test-score-detail">
                            <span className="my-score">{monthlyScore}점</span>
                            {monthlyAverage !== null && (
                              <span className="class-average">반평균: {monthlyAverage}점</span>
                            )}
                            {monthlyMax !== null && (
                              <span className="class-max">
                                최고점: {monthlyMax}점 
                                {monthlyMaxScoreCount > 1 ? (
                                  <span> ({monthlyMaxScoreCount}명)</span>
                                ) : monthlyMaxStudent ? (
                                  <span> ({monthlyMaxStudent})</span>
                                ) : null}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null;
                  })()}
                  <tr>
                    <td className="table-label">클리닉 여부</td>
                    <td className="table-value">
                      {studentRecord?.hasClinic !== undefined
                        ? studentRecord.hasClinic ? '해당' : '해당 없음'
                        : '기록 없음'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {trendData.length > 0 && (
            <div className="trend-chart-container">
              <h2 className="chart-title">리뷰TEST 점수 추이</h2>
              <p className="chart-hint">
                <span>좌우 스와이프로 전체 정보 확인</span>
                <span>점수 터치 시 상세 정보 표시</span>
              </p>
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
              <div className="chart-wrapper">
                <ChartComponent data={trendData} />
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

  // 최근 데이터 위주로 정렬 (최신순)
  const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).reverse();

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
  const padding = Math.max(5, scoreRange * 0.1); // 최소 5점 패딩
  const chartMax = Math.min(100, Math.ceil(maxScore + padding));
  const chartMin = Math.max(0, Math.floor(minScore - padding));

  const chartHeight = 300;
  const topPadding = 20; // 상단 여유 공간
  const minBarWidth = 80; // 최소 바 너비
  const chartContentWidth = Math.max(600, sortedData.length * minBarWidth);
  const sidePadding = 100; // 양쪽 여유 공간
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

  // 드래그 시작 (마우스)
  const handleMouseDown = (e) => {
    // 버튼 클릭이나 텍스트 선택이 아닐 때만 드래그 시작
    if (chartWrapperRef.current && e.button === 0) {
      setIsDragging(true);
      setHoveredIndex(null); // 툴팁 숨기기
      setDragStart({
        x: e.pageX - chartWrapperRef.current.offsetLeft,
        scrollLeft: chartWrapperRef.current.scrollLeft,
      });
      chartWrapperRef.current.style.cursor = 'grabbing';
      chartWrapperRef.current.style.userSelect = 'none';
    }
  };

  // 드래그 중 (마우스)
  const handleMouseMove = (e) => {
    if (!isDragging || !chartWrapperRef.current) return;
    e.preventDefault();
    const x = e.pageX - chartWrapperRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2; // 스크롤 속도 조절
    chartWrapperRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  // 드래그 종료 (마우스)
  const handleMouseUp = () => {
    if (chartWrapperRef.current) {
      setIsDragging(false);
      chartWrapperRef.current.style.cursor = 'grab';
      chartWrapperRef.current.style.userSelect = '';
    }
  };

  // 드래그 시작 (터치)
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

  // 드래그 중 (터치)
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
        // passive 이벤트 리스너에서는 preventDefault를 호출할 수 없으므로 안전하게 처리
        if (e.cancelable) {
          e.preventDefault();
        }
        const x = touch.pageX - chartWrapperRef.current.offsetLeft;
        const walk = (x - touchStartPos.x) * 2;
        chartWrapperRef.current.scrollLeft = chartWrapperRef.current.scrollLeft - walk;
      }
    }
  };

  // 드래그 종료 (터치)
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

  // 마우스가 래퍼 밖으로 나갔을 때
  const handleMouseLeaveWrapper = () => {
    if (isDragging && chartWrapperRef.current) {
      setIsDragging(false);
      chartWrapperRef.current.style.cursor = 'grab';
      chartWrapperRef.current.style.userSelect = '';
    }
    setHoveredIndex(null);
  };

  // 컴포넌트 마운트 시 스크롤을 오른쪽 끝(최신 데이터)으로 이동
  useEffect(() => {
    if (chartWrapperRef.current) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
      setTimeout(() => {
        if (chartWrapperRef.current) {
          chartWrapperRef.current.scrollLeft = chartWrapperRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [sortedData]);

  // 내 점수 라인 경로 (좌우 여유 공간 고려)
  const myScorePath = sortedData
    .map((d, i) => {
      const y = getY(d.myScore);
      if (y === null) return null;
      const x = sidePadding + (i * xStep);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .filter(p => p !== null)
    .join(' ');

  // 반평균 라인 경로
  const averagePath = sortedData
    .map((d, i) => {
      const y = getY(d.classAverage);
      if (y === null) return null;
      const x = sidePadding + (i * xStep);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .filter(p => p !== null)
    .join(' ');

  // 최고점 라인 경로
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
          height={chartHeight + 50} 
          className="chart-svg"
        >
          {/* Y축 그리드 라인 */}
          {[0, 25, 50, 75, 100].map(score => {
            const y = getY(score);
            if (y === null) return null;
            return (
              <g key={score}>
                <line
                  x1={sidePadding}
                  y1={y}
                  x2={chartWidth - sidePadding}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.6"
                />
                <text
                  x={-15}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#9ca3af"
                  fontWeight="500"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* 내 점수 라인 */}
          {myScorePath && (
            <path
              d={myScorePath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))' }}
            />
          )}

          {/* 반평균 라인 */}
          {averagePath && (
            <path
              d={averagePath}
              fill="none"
              stroke="#42a5f5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="5,5"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(66, 165, 245, 0.2))' }}
            />
          )}

          {/* 최고점 라인 */}
          {maxScorePath && (
            <path
              d={maxScorePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2))' }}
            />
          )}

          {/* 데이터 포인트 */}
          {sortedData.map((d, i) => (
            <g key={i}>
              {/* 호버 영역 (보이지 않는 큰 원) - PC 및 모바일용 */}
              <circle
                cx={sidePadding + (i * xStep)}
                cy={chartHeight / 2}
                r="50"
                fill="transparent"
                data-index={i}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
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
                  // 드래그가 아니었으면 정보 표시
                  if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                    const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                    const touch = e.changedTouches[0];
                    const x = touch.clientX - wrapperRect.left;
                    const y = touch.clientY - wrapperRect.top;
                    setHoveredIndex(i);
                    setIsTouchTooltip(true);
                    setTooltipPosition({ x, y });
                  }
                  setTouchStartIndex(null);
                }}
                className="hover-area-pc hover-area-mobile"
              />
              
              {/* 내 점수 포인트 */}
              {d.myScore !== null && d.myScore !== undefined && (
                <g>
                  <circle
                    cx={sidePadding + (i * xStep)}
                    cy={getY(d.myScore)}
                    r="8"
                    fill="#ef4444"
                    opacity="0.2"
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
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
                      // 드래그가 아니었으면 정보 표시
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const x = touch.clientX - wrapperRect.left;
                        const y = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x, y });
                      }
                      setTouchStartIndex(null);
                    }}
                  />
                  <circle
                    cx={sidePadding + (i * xStep)}
                    cy={getY(d.myScore)}
                    r="5"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2.5"
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
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
                      // 드래그가 아니었으면 정보 표시
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const x = touch.clientX - wrapperRect.left;
                        const y = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x, y });
                      }
                      setTouchStartIndex(null);
                    }}
                  />
                </g>
              )}
              
              {/* 반평균 포인트 */}
              {d.classAverage !== null && d.classAverage !== undefined && (
                <g>
                  <circle
                    cx={sidePadding + (i * xStep)}
                    cy={getY(d.classAverage)}
                    r="7"
                    fill="#42a5f5"
                    opacity="0.2"
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
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
                      // 드래그가 아니었으면 정보 표시
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const x = touch.clientX - wrapperRect.left;
                        const y = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x, y });
                      }
                      setTouchStartIndex(null);
                    }}
                  />
                  <circle
                    cx={sidePadding + (i * xStep)}
                    cy={getY(d.classAverage)}
                    r="4"
                    fill="#42a5f5"
                    stroke="white"
                    strokeWidth="2"
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
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
                      // 드래그가 아니었으면 정보 표시
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const x = touch.clientX - wrapperRect.left;
                        const y = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x, y });
                      }
                      setTouchStartIndex(null);
                    }}
                  />
                </g>
              )}
              
              {/* 최고점 포인트 */}
              {d.maxScore !== null && d.maxScore !== undefined && (
                <g>
                  <circle
                    cx={sidePadding + (i * xStep)}
                    cy={getY(d.maxScore)}
                    r="7"
                    fill="#f59e0b"
                    opacity="0.2"
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
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
                      // 드래그가 아니었으면 정보 표시
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const x = touch.clientX - wrapperRect.left;
                        const y = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x, y });
                      }
                      setTouchStartIndex(null);
                    }}
                  />
                  <circle
                    cx={sidePadding + (i * xStep)}
                    cy={getY(d.maxScore)}
                    r="4"
                    fill="#f59e0b"
                    stroke="white"
                    strokeWidth="2"
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer', pointerEvents: isDragging ? 'none' : 'auto' }}
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
                      // 드래그가 아니었으면 정보 표시
                      if (!isDragging && touchStartIndex === i && chartWrapperRef.current && svgRef.current) {
                        const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
                        const touch = e.changedTouches[0];
                        const x = touch.clientX - wrapperRect.left;
                        const y = touch.clientY - wrapperRect.top;
                        setHoveredIndex(i);
                        setIsTouchTooltip(true);
                        setTooltipPosition({ x, y });
                      }
                      setTouchStartIndex(null);
                    }}
                  />
                </g>
              )}
              
              {/* X축 라벨 */}
              <text
                x={sidePadding + (i * xStep)}
                y={chartHeight + 30}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
                fontWeight="500"
              >
                {formatDate(d.date)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default ParentClassStatusDetail;

