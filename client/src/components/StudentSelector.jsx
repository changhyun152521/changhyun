import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import './StudentSelector.css';

function StudentSelector({ parentId, onSelectStudent, selectedStudentId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (parentId) {
      fetchLinkedStudents();
    }
  }, [parentId]);

  const fetchLinkedStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/parent-student-links/parent/${parentId}`);
      if (response.data.success) {
        setStudents(response.data.data);
        // 학생이 1명이고 선택된 학생이 없으면 자동 선택
        if (response.data.data.length === 1 && !selectedStudentId) {
          onSelectStudent(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('연동된 학생 목록 가져오기 오류:', error);
      setError('연동된 학생 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    onSelectStudent(student);
  };

  if (loading) {
    return (
      <div className="student-selector-modal">
        <div className="student-selector-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-selector-modal">
        <div className="student-selector-content">
          <div className="error-container">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="student-selector-modal">
        <div className="student-selector-content">
          <h2>내 자녀를 선택하세요</h2>
          <div className="no-students-message">
            <i className="fas fa-info-circle"></i>
            <p>연동된 학생이 없습니다.</p>
            <p className="no-students-sub">관리자에게 문의하여 학생과 연동해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // 학생이 1명이면 자동 선택하고 모달을 표시하지 않음
  if (students.length === 1 && selectedStudentId === students[0]._id) {
    return null;
  }

  const handleClose = () => {
    // X 버튼 클릭 시 가장 상단에 있는 학생을 자동 선택
    if (students.length > 0) {
      handleSelectStudent(students[0]);
    }
  };

  return (
    <div className="student-selector-modal">
      <div className="student-selector-content">
        <button 
          className="student-selector-close-btn"
          onClick={handleClose}
          type="button"
          aria-label="닫기"
        >
          <i className="fas fa-times"></i>
        </button>
        <h2>내 자녀를 선택하세요</h2>
        <div className="students-list">
          {students.map((student) => (
            <div
              key={student._id}
              className={`student-card ${selectedStudentId === student._id ? 'selected' : ''}`}
              onClick={() => handleSelectStudent(student)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectStudent(student);
                }
              }}
            >
              <div className="student-card-header">
                <div className="student-icon">
                  <i className="fas fa-user-graduate"></i>
                </div>
                <h3 className="student-name">{student.name}</h3>
              </div>
              <div className="student-card-body">
                <div className="student-info-item">
                  <i className="fas fa-id-card"></i>
                  <span className="student-info-label">아이디:</span>
                  <span className="student-info-value">{student.userId}</span>
                </div>
                <div className="student-info-item">
                  <i className="fas fa-school"></i>
                  <span className="student-info-label">학교:</span>
                  <span className="student-info-value">{student.schoolName}</span>
                </div>
              </div>
              {selectedStudentId === student._id && (
                <div className="student-card-selected">
                  <i className="fas fa-check-circle"></i>
                  <span>선택됨</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentSelector;

