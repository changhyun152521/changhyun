import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './MonthlyStatisticsDetail.css';

function AdminClassMonthlyStatisticsDetail() {
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
  const summaryTableWrapperRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSummaryDragging, setIsSummaryDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [summaryDragStart, setSummaryDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [activeTableRef, setActiveTableRef] = useState(null);

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
      } else if (isSummaryDragging && summaryTableWrapperRef.current && activeTableRef === summaryTableWrapperRef) {
        e.preventDefault();
        const x = e.pageX - summaryTableWrapperRef.current.getBoundingClientRect().left;
        const walk = (x - summaryDragStart.x) * 2;
        summaryTableWrapperRef.current.scrollLeft = summaryDragStart.scrollLeft - walk;
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging && tableWrapperRef.current) {
        setIsDragging(false);
        tableWrapperRef.current.style.cursor = 'grab';
        tableWrapperRef.current.style.userSelect = '';
        setActiveTableRef(null);
      }
      if (isSummaryDragging && summaryTableWrapperRef.current) {
        setIsSummaryDragging(false);
        summaryTableWrapperRef.current.style.cursor = 'grab';
        summaryTableWrapperRef.current.style.userSelect = '';
        setActiveTableRef(null);
      }
    };

    if (isDragging || isSummaryDragging) {
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
  }, [isDragging, isSummaryDragging, dragStart, summaryDragStart, activeTableRef]);

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
      
      // 선택한 월의 첫날과 마지막날 계산
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      const daysInMonth = endDate.getDate();

      // 해당 월의 모든 날짜에 대해 데이터 가져오기
      const datePromises = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const year = selectedYear;
        const month = String(selectedMonth).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        
        // 해당 날짜의 모든 학생 기록 가져오기
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
                const monthlyScores = [];
                
                allRecords.forEach(record => {
                  // 일일테스트 점수 처리
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
                  
                  // 월말평가 점수 처리
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
                
                const classAverage = dailyScores.length > 0 
                  ? Math.round(dailyScores.reduce((sum, score) => sum + score, 0) / dailyScores.length)
                  : null;
                const classMaxScore = dailyScores.length > 0 ? Math.max(...dailyScores) : null;
                
                const monthlyAverage = monthlyScores.length > 0
                  ? Math.round(monthlyScores.reduce((sum, score) => sum + score, 0) / monthlyScores.length)
                  : null;
                const monthlyMax = monthlyScores.length > 0 ? Math.max(...monthlyScores) : null;
                
                return {
                  date: dateStr,
                  day: day,
                  allRecords: allRecords,
                  classAverage: classAverage,
                  classMaxScore: classMaxScore,
                  monthlyAverage: monthlyAverage,
                  monthlyMax: monthlyMax,
                };
              }
              return {
                date: dateStr,
                day: day,
                allRecords: [],
                classAverage: null,
                classMaxScore: null,
                monthlyAverage: null,
                monthlyMax: null,
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
                monthlyAverage: null,
                monthlyMax: null,
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
    
    if (typeof scoreStr === 'number') {
      return `${scoreStr}점`;
    }
    
    if (typeof scoreStr === 'string') {
      if (scoreStr.includes('/')) {
        const [correct, total] = scoreStr.split('/').map(Number);
        if (total > 0 && !isNaN(correct) && !isNaN(total)) {
          const percentage = Math.round((correct / total) * 100);
          return `${percentage}점`;
        }
      } else {
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

  if (!isAdmin) {
    return null;
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

  // 연도 선택 옵션 (최근 3년)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = 0; i < 3; i++) {
    yearOptions.push(currentYear - i);
  }

  // 월 선택 옵션
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // 모든 날짜의 모든 학생 기록을 하나의 배열로 합치기
  const allStudentRecordsByDate = {};
  monthlyData.forEach(item => {
    if (item.allRecords && item.allRecords.length > 0) {
      allStudentRecordsByDate[item.date] = item.allRecords;
    }
  });

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
  }).filter(student => student.name !== '알 수 없음' || student.userId !== ''); // 유효한 학생만 필터링

  // 검색어로 학생 필터링
  const filteredStudents = searchQuery.trim() === '' 
    ? allStudents 
    : allStudents.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.userId.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="monthly-statistics-detail-page">
      <Header />
      <section className="monthly-statistics-detail-section">
        <div className="container">
          <div className="page-header">
            <button
              className="btn-back"
              onClick={() => navigate('/admin/class-monthly-statistics')}
            >
              목록으로
            </button>
            <div className="page-header-content">
              <div className="page-header-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <h1 className="page-title">{classData?.className || '수업현황 조회'}</h1>
              <p className="page-description">
                {classData?.className} 반의 전체 학생들의 월별 통계를 확인할 수 있습니다.
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
                  {monthlyData
                    .filter(item => item.allRecords && item.allRecords.length > 0)
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
                    <td colSpan={monthlyData.filter(item => item.allRecords && item.allRecords.length > 0).length + 1} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
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
                      .filter(item => item.allRecords && item.allRecords.length > 0)
                      .map((item) => {
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
                              <span className="cell-label">일일테스트:</span>
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
                  {monthlyData
                    .filter(item => item.allRecords && item.allRecords.length > 0)
                    .map((item) => (
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

          {/* 월말평가 별도 섹션 */}
          {monthlyData.some(item => 
            item.allRecords && 
            item.allRecords.some(record => record.monthlyEvaluationScore)
          ) && (
            <div 
              className="monthly-table-container admin-table-wrapper" 
              style={{ marginTop: '2rem' }}
              ref={summaryTableWrapperRef}
              onMouseDown={(e) => {
                if (summaryTableWrapperRef.current && e.button === 0) {
                  setIsSummaryDragging(true);
                  setActiveTableRef(summaryTableWrapperRef);
                  const rect = summaryTableWrapperRef.current.getBoundingClientRect();
                  setSummaryDragStart({
                    x: e.pageX - rect.left,
                    scrollLeft: summaryTableWrapperRef.current.scrollLeft,
                  });
                  summaryTableWrapperRef.current.style.cursor = 'grabbing';
                  summaryTableWrapperRef.current.style.userSelect = 'none';
                }
              }}
              onTouchStart={(e) => {
                if (summaryTableWrapperRef.current && e.touches.length === 1) {
                  setIsSummaryDragging(true);
                  setActiveTableRef(summaryTableWrapperRef);
                  const rect = summaryTableWrapperRef.current.getBoundingClientRect();
                  setSummaryDragStart({
                    x: e.touches[0].pageX - rect.left,
                    scrollLeft: summaryTableWrapperRef.current.scrollLeft,
                  });
                }
              }}
              onTouchMove={(e) => {
                if (!isSummaryDragging || !summaryTableWrapperRef.current || e.touches.length !== 1) return;
                e.preventDefault();
                const rect = summaryTableWrapperRef.current.getBoundingClientRect();
                const x = e.touches[0].pageX - rect.left;
                const walk = (x - summaryDragStart.x) * 2;
                summaryTableWrapperRef.current.scrollLeft = summaryDragStart.scrollLeft - walk;
              }}
              onTouchEnd={() => {
                setIsSummaryDragging(false);
                setActiveTableRef(null);
              }}
              style={{ cursor: isSummaryDragging ? 'grabbing' : 'grab' }}
            >
              <h2 className="section-title">월말평가</h2>
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
                      .map((item) => (
                        <td key={item.date} className="class-stats-cell">
                          <div className="cell-item">
                            <span className="cell-label">반평균:</span>
                            <span className="cell-value class-average">
                              {item.monthlyAverage !== null ? `${item.monthlyAverage}점` : '-'}
                            </span>
                          </div>
                          <div className="cell-item">
                            <span className="cell-label">최고점:</span>
                            <span className="cell-value class-max">
                              {item.monthlyMax !== null ? `${item.monthlyMax}점` : '-'}
                            </span>
                          </div>
                        </td>
                      ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </div>
  );
}

export default AdminClassMonthlyStatisticsDetail;

