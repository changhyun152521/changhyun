import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axiosConfig';
import './Attendance.css';

function Attendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [courses, setCourses] = useState([]);
  const [userCourses, setUserCourses] = useState([]); // 사용자가 접근 가능한 강좌만
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [newComment, setNewComment] = useState({
    content: '',
    courseName: '',
    className: '',
    isPublic: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editSelectedCourseId, setEditSelectedCourseId] = useState('');
  const [editSelectedLectureId, setEditSelectedLectureId] = useState('');
  const [editContent, setEditContent] = useState({
    content: '',
    courseName: '',
    className: '',
    isPublic: true,
  });
  const [showFormForm, setShowFormForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentDetailModal, setShowCommentDetailModal] = useState(false);
  const [selectedCommentForModal, setSelectedCommentForModal] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkAdminAndFetchComments();
    fetchCourses();
    fetchUserCourses();
  }, [currentPage]);

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

  const fetchUserCourses = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        // 로그인하지 않은 경우 빈 배열로 설정
        setUserCourses([]);
        return;
      }
      
      const response = await api.get('/courses/my-courses');
      if (response.data.success) {
        setUserCourses(response.data.data || []);
      } else {
        setUserCourses([]);
      }
    } catch (error) {
      console.error('사용자 강좌 목록 가져오기 오류:', error);
      // 에러 발생 시 빈 배열로 설정 (강좌 선택 안함만 표시)
      setUserCourses([]);
    }
  };

  const checkAdminAndFetchComments = async () => {
    try {
      // 관리자 권한 확인
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setIsAdmin(userData.isAdmin === true || userData.userType === '강사');
          setUserName(userData.name || '');
        } catch (error) {
          console.error('사용자 데이터 파싱 오류:', error);
        }
      } else {
        setUserName('');
      }

      // 댓글 목록 가져오기 (비회원도 접근 가능, 페이지네이션)
      const response = await api.get(`/attendance-comments?page=${currentPage}&limit=5`);
      if (response.data.success) {
        setComments(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.data.error || '수강평 댓글을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('수강평 댓글 가져오기 오류:', error);
      setError('수강평 댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) {
      return '방금 전';
    } else if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else if (diffDays < 30) {
      return `${diffWeeks}주 전`;
    } else if (diffDays < 365) {
      return `${diffMonths}개월 전`;
    } else {
      return `${diffYears}년 전`;
    }
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const toggleExpand = (commentId) => {
    // 더 이상 사용하지 않음 - 모달로 대체
  };

  const openCommentDetailModal = (comment) => {
    setSelectedCommentForModal(comment);
    setShowCommentDetailModal(true);
    setReplyingToId(null);
    setEditingReplyId(null);
  };

  const closeCommentDetailModal = () => {
    setShowCommentDetailModal(false);
    setSelectedCommentForModal(null);
    setReplyingToId(null);
    setEditingReplyId(null);
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);
    setSelectedLectureId(''); // 강좌 변경 시 강의 선택 초기화
    
    if (courseId === 'none') {
      // "기타 문의사항" 선택 시
      setNewComment({
        ...newComment,
        courseName: '기타 문의사항',
        className: '', // 강의명은 초기 상태 유지
      });
    } else {
    const selectedCourse = courses.find(c => c._id === courseId);
    if (selectedCourse) {
      setNewComment({
        ...newComment,
        courseName: selectedCourse.courseName,
        className: '', // 강의명은 별도로 선택해야 함
      });
    } else {
      setNewComment({
        ...newComment,
        courseName: '',
        className: '',
      });
      }
    }
  };

  const handleLectureChange = (e) => {
    const lectureId = e.target.value;
    setSelectedLectureId(lectureId);
    
    if (selectedCourseId === 'none' || !selectedCourseId) {
      return;
    }
    
    // userCourses에서 선택된 강좌 찾기
    const selectedCourse = userCourses.find(c => c._id === selectedCourseId) || courses.find(c => c._id === selectedCourseId);
    if (selectedCourse && selectedCourse.lectures) {
      const selectedLecture = selectedCourse.lectures.find(l => 
        l._id ? l._id.toString() === lectureId : 
        selectedCourse.lectures.indexOf(l).toString() === lectureId
      );
      if (selectedLecture) {
        // 강의명에 강의 순서 포함하여 저장
        const lectureName = `${selectedLecture.lectureNumber}강. ${selectedLecture.lectureTitle}`;
        setNewComment({
          ...newComment,
          className: lectureName,
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 필수 항목 검증
    if (!selectedCourseId || selectedCourseId === '') {
      alert('강좌명을 선택해주세요.');
      return;
    }
    
    // 기타 문의사항이 아닌 경우에만 강의명 필수
    if (selectedCourseId !== 'none' && (!newComment.className || newComment.className.trim() === '')) {
      alert('강의명을 입력해주세요.');
      return;
    }
    
    if (!newComment.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    // 작성 확인 메시지
    const confirmSubmit = window.confirm('수강문의를 작성하시겠습니까?');
    if (!confirmSubmit) {
      return; // 사용자가 취소를 선택한 경우
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/attendance-comments', newComment);
      if (response.data.success) {
        setNewComment({
          content: '',
          courseName: '',
          className: '',
          isPublic: true,
        });
        setSelectedCourseId('');
        setSelectedLectureId('');
        setShowFormForm(false); // 폼 닫기
        checkAdminAndFetchComments();
      } else {
        alert(response.data.error || '댓글 작성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      alert(error.response?.data?.error || '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment._id);
    setEditContent({
      content: comment.content,
      courseName: comment.courseName || '',
      className: comment.className || '',
      isPublic: comment.isPublic !== undefined ? comment.isPublic : true,
    });
    
    // 편집 시에도 강좌와 강의 선택
    // 기타 문의사항인 경우
    if (comment.courseName === '기타 문의사항') {
      setEditSelectedCourseId('none');
      setEditSelectedLectureId('');
    } else {
      // 사용자가 접근 가능한 강좌에서만 찾기
      const course = userCourses.find(c => c.courseName === comment.courseName);
    if (course) {
      setEditSelectedCourseId(course._id);
      const lecture = course.lectures?.find(l => {
        // className에 "1강. " 같은 형식이 포함되어 있을 수 있음
        const lectureTitle = comment.className.replace(/^\d+강\.\s*/, '');
        return l.lectureTitle === lectureTitle || l.lectureTitle === comment.className;
      });
      if (lecture) {
        setEditSelectedLectureId(lecture._id ? lecture._id.toString() : course.lectures.indexOf(lecture).toString());
      } else {
        setEditSelectedLectureId('');
      }
    } else {
        // 사용자가 접근할 수 없는 강좌이거나 강좌가 없는 경우 빈 문자열로 설정 (기본 옵션 표시)
        if (!comment.courseName) {
      setEditSelectedCourseId('');
        }
      setEditSelectedLectureId('');
      }
    }
    setShowEditModal(true);
  };

  const handleEditCourseChange = (e) => {
    const courseId = e.target.value;
    setEditSelectedCourseId(courseId);
    setEditSelectedLectureId(''); // 강좌 변경 시 강의 선택 초기화
    
    if (courseId === 'none') {
      // "기타 문의사항" 선택 시
      setEditContent({
        ...editContent,
        courseName: '기타 문의사항',
        className: '', // 강의명은 초기 상태 유지
      });
    } else {
    const selectedCourse = courses.find(c => c._id === courseId);
    if (selectedCourse) {
      setEditContent({
        ...editContent,
        courseName: selectedCourse.courseName,
        className: '', // 강의명은 별도로 선택해야 함
      });
    } else {
      setEditContent({
        ...editContent,
        courseName: '',
        className: '',
      });
      }
    }
  };

  const handleEditLectureChange = (e) => {
    const lectureId = e.target.value;
    setEditSelectedLectureId(lectureId);
    
    if (editSelectedCourseId === 'none' || !editSelectedCourseId) {
      return;
    }
    
    // userCourses에서 선택된 강좌 찾기
    const selectedCourse = userCourses.find(c => c._id === editSelectedCourseId) || courses.find(c => c._id === editSelectedCourseId);
    if (selectedCourse && selectedCourse.lectures) {
      const selectedLecture = selectedCourse.lectures.find(l => 
        l._id ? l._id.toString() === lectureId : 
        selectedCourse.lectures.indexOf(l).toString() === lectureId
      );
      if (selectedLecture) {
        // 강의명에 강의 순서 포함하여 저장
        const lectureName = `${selectedLecture.lectureNumber}강. ${selectedLecture.lectureTitle}`;
        setEditContent({
          ...editContent,
          className: lectureName,
        });
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // 필수 항목 검증
    if (!editSelectedCourseId || editSelectedCourseId === '') {
      alert('강좌명을 선택해주세요.');
      return;
    }
    
    // 기타 문의사항이 아닌 경우에만 강의명 필수
    if (editSelectedCourseId !== 'none' && (!editContent.className || editContent.className.trim() === '')) {
      alert('강의명을 입력해주세요.');
      return;
    }
    
    if (!editContent.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    // 수정 확인 메시지
    const confirmUpdate = window.confirm('수강문의를 수정하시겠습니까?');
    if (!confirmUpdate) {
      return; // 사용자가 취소를 선택한 경우
    }

    try {
      const response = await api.put(`/attendance-comments/${editingId}`, editContent);
      if (response.data.success) {
        setEditingId(null);
        setShowEditModal(false);
        setExpandedId(null);
        setEditSelectedCourseId('');
        setEditSelectedLectureId('');
        setSelectedCourseId('');
        setSelectedLectureId('');
        checkAdminAndFetchComments();
      } else {
        alert(response.data.error || '댓글 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      alert(error.response?.data?.error || '댓글 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await api.delete(`/attendance-comments/${commentId}`);
      if (response.data.success) {
        checkAdminAndFetchComments();
      } else {
        alert(response.data.error || '댓글 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      alert(error.response?.data?.error || '댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyContent.trim()) {
      alert('답글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await api.post(`/attendance-comments/${commentId}/reply`, {
        content: replyContent.trim(),
      });
      if (response.data.success) {
        setReplyContent('');
        setReplyingToId(null);
        // 모달이 열려있으면 선택된 댓글 업데이트
        if (showCommentDetailModal && selectedCommentForModal && selectedCommentForModal._id === commentId) {
          setSelectedCommentForModal(response.data.data);
        }
        checkAdminAndFetchComments();
      } else {
        alert(response.data.error || '답글 작성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('답글 작성 오류:', error);
      alert(error.response?.data?.error || '답글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleReplyEdit = async (commentId) => {
    if (!editReplyContent.trim()) {
      alert('답글 내용을 입력해주세요.');
      return;
    }

    try {
      const response = await api.put(`/attendance-comments/${commentId}/reply`, {
        content: editReplyContent.trim(),
      });
      if (response.data.success) {
        setEditReplyContent('');
        setEditingReplyId(null);
        // 모달이 열려있으면 선택된 댓글 업데이트
        if (showCommentDetailModal && selectedCommentForModal && selectedCommentForModal._id === commentId) {
          setSelectedCommentForModal(response.data.data);
        }
        checkAdminAndFetchComments();
      } else {
        alert(response.data.error || '답글 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('답글 수정 오류:', error);
      alert(error.response?.data?.error || '답글 수정 중 오류가 발생했습니다.');
    }
  };

  const handleReplyDelete = async (commentId) => {
    if (!window.confirm('정말 답글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await api.delete(`/attendance-comments/${commentId}/reply`);
      if (response.data.success) {
        // 모달이 열려있으면 선택된 댓글 업데이트
        if (showCommentDetailModal && selectedCommentForModal && selectedCommentForModal._id === commentId) {
          const updatedComment = { ...selectedCommentForModal };
          updatedComment.reply = undefined;
          setSelectedCommentForModal(updatedComment);
        }
        checkAdminAndFetchComments();
      } else {
        alert(response.data.error || '답글 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('답글 삭제 오류:', error);
      alert(error.response?.data?.error || '답글 삭제 중 오류가 발생했습니다.');
    }
  };

  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        return userData.id || userData._id;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  const isLoggedIn = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return !!(token && userStr);
  };

  const handleWriteButtonClick = () => {
    if (!isLoggedIn()) {
      if (window.confirm('수강 문의를 작성하려면 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login');
      }
      return;
    }
    setShowFormForm(true);
  };

  const isCommentOwner = (comment) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId || !comment.author) return false;
    const authorId = comment.author._id || comment.author;
    return authorId.toString() === currentUserId.toString() || authorId === currentUserId;
  };

  const canViewCommentContent = (comment) => {
    // 공개 댓글이면 모두 볼 수 있음
    if (comment.isPublic) return true;
    // 비공개 댓글이면 작성자 또는 관리자만 볼 수 있음
    return isCommentOwner(comment) || isAdmin;
  };

  // 페이지네이션 계산
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const selectedCourse = courses.find(c => c._id === selectedCourseId);
  const selectedCourseForLectures = userCourses.find(c => c._id === selectedCourseId) || courses.find(c => c._id === selectedCourseId);
  const availableLectures = selectedCourseForLectures?.lectures || [];

  if (loading) {
    return (
      <div className="attendance-page">
        <Header />
        <div className="attendance-container">
          <div className="loading">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <Header />
      <section className="attendance-section">
        <div className="attendance-container">
          {/* Main Content */}
          <main className="attendance-main">
            {/* Comments List Section */}
            <section className="comments-section">
              <div className="title-section">
                <div className="title-icon">
                  <img src="/012.png" alt="수강문의 아이콘" className="title-icon-img" />
                </div>
                <div className="page-title">
                  <img src="/012 - 복사본.png" alt="수강문의" className="page-title-img" />
                </div>
              </div>
              
              {error ? (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="empty-state">
                  <p>아직 수강 댓글이 없습니다.<br />첫 번째 댓글을 작성해보세요! ✨</p>
                </div>
              ) : (
                <table className="comments-table">
                    <thead>
                      <tr>
                        <th>작성자</th>
                        <th>아이디</th>
                        <th>작성일시</th>
                        <th>답변상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map((comment) => (
                        <React.Fragment key={comment._id}>
                          <tr 
                            key={comment._id} 
                            className={`comment-row ${!comment.isPublic ? 'private-row' : ''}`}
                            onClick={() => openCommentDetailModal(comment)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="author-cell-td">
                              <div className="author-cell">
                                <span className="comment-author">
                                  {canViewCommentContent(comment) 
                                    ? (comment.authorName || comment.author?.name || '익명')
                                    : '*****'}
                                </span>
                                {!comment.isPublic && (
                                  <span className="private-badge">
                                    <i className="fas fa-lock"></i>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="userid-cell">
                              {canViewCommentContent(comment) 
                                ? (comment.author?.userId || '-')
                                : '********'}
                            </td>
                            <td className="date-cell">{formatDate(comment.createdAt)}</td>
                            <td className="reply-status-cell">
                              {comment.reply && comment.reply.content ? (
                                <span className="reply-status-badge reply-completed">
                                  <i className="fas fa-check-circle"></i>
                                  답변완료
                                </span>
                              ) : (
                                <span className="reply-status-badge reply-pending">
                                  <i className="fas fa-clock"></i>
                                  답변대기
                                </span>
                              )}
                            </td>
                          </tr>
                          {false && (
                            <tr key={`${comment._id}-detail`} className="comment-detail-row">
                              <td colSpan="4" className="detail-cell">
                                <div className="comment-detail-content">
                                    <div className="detail-info-grid">
                                      <div className="detail-info-item">
                                        <span className="detail-label">강좌명</span>
                                        <span className="detail-value">{comment.courseName || '-'}</span>
                                      </div>
                                      <div className="detail-info-item">
                                        <span className="detail-label">강의명</span>
                                        <span className="detail-value">{comment.className || '-'}</span>
                                      </div>
                                      <div className="detail-info-item">
                                        <span className="detail-label">공개</span>
                                        <span className={`detail-value ${!comment.isPublic ? 'private-value' : ''}`}>
                                          {comment.isPublic ? '공개' : '비공개'}
                                        </span>
                                      </div>
                                      <div className="detail-info-item">
                                        <span className="detail-label">작성일시</span>
                                        <span className="detail-value">{formatFullDate(comment.createdAt)}</span>
                                      </div>
                                    </div>
                                    {canViewCommentContent(comment) ? (
                                      <>
                                        <div className="detail-content-box">
                                          <p>{comment.content}</p>
                                        </div>
                                        <div className="detail-actions">
                                          {isCommentOwner(comment) && (
                                            <>
                                              <button onClick={(e) => { e.stopPropagation(); handleEdit(comment); }} className="btn-edit">수정</button>
                                              <button onClick={(e) => { e.stopPropagation(); handleDelete(comment._id); }} className="btn-delete">삭제</button>
                                            </>
                                          )}
                                          {isAdmin && !isCommentOwner(comment) && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(comment._id); }} className="btn-delete">삭제</button>
                                          )}
                                          {isAdmin && (
                                            <button 
                                              onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (replyingToId === comment._id) {
                                                  setReplyingToId(null);
                                                  setReplyContent('');
                                                } else {
                                                  setReplyingToId(comment._id);
                                                  setReplyContent('');
                                                }
                                              }} 
                                              className="btn-reply"
                                            >
                                              {comment.reply && comment.reply.content ? '답글 수정' : '답글 작성'}
                                            </button>
                                          )}
                                        </div>
                                        {/* 답글 표시 */}
                                        {comment.reply && comment.reply.content && (
                                          <div className="reply-section">
                                            <div className="reply-header">
                                              <span className="reply-label">관리자 답변</span>
                                              <span className="reply-date">{formatFullDate(comment.reply.createdAt)}</span>
                                            </div>
                                            {editingReplyId === comment._id ? (
                                              <div className="reply-edit-form">
                                                <textarea
                                                  value={editReplyContent}
                                                  onChange={(e) => setEditReplyContent(e.target.value)}
                                                  placeholder="답글 내용을 입력하세요"
                                                  rows="3"
                                                />
                                                <div className="reply-edit-actions">
                                                  <button onClick={() => handleReplyEdit(comment._id)} className="btn-edit">수정 완료</button>
                                                  <button onClick={() => { setEditingReplyId(null); setEditReplyContent(''); }} className="btn-cancel">취소</button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="reply-content">
                                                  <p>{comment.reply.content}</p>
                                                </div>
                                                {isAdmin && (
                                                  <div className="reply-actions">
                                                    <button onClick={(e) => { 
                                                      e.stopPropagation(); 
                                                      setEditingReplyId(comment._id);
                                                      setEditReplyContent(comment.reply.content);
                                                    }} className="btn-edit-small">수정</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleReplyDelete(comment._id); }} className="btn-delete-small">삭제</button>
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}
                                        {/* 답글 작성 폼 */}
                                        {isAdmin && replyingToId === comment._id && (
                                          <div className="reply-form-section">
                                            <div className="reply-form">
                                              <textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="답글 내용을 입력하세요"
                                                rows="3"
                                              />
                                              <div className="reply-form-actions">
                                                <button 
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    handleReplySubmit(comment._id);
                                                  }} 
                                                  className="btn-submit-reply"
                                                  disabled={isSubmittingReply}
                                                >
                                                  {isSubmittingReply ? '작성 중...' : '답글 작성'}
                                                </button>
                                                <button 
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setReplyingToId(null);
                                                    setReplyContent('');
                                                  }} 
                                                  className="btn-cancel-reply"
                                                >
                                                  취소
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <div className="detail-content-box restricted-content">
                                          <p className="restricted-message">
                                            🔒 이 댓글은 비공개로 설정되어 있습니다.<br />
                                            작성자와 관리자만 내용을 확인할 수 있습니다.
                                          </p>
                                        </div>
                                        {isAdmin && (
                                          <div className="detail-actions">
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(comment._id); }} className="btn-delete">삭제</button>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                    이전
                  </button>
                  
                  <div className="pagination-numbers">
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </section>

            {/* Comment Form Section - Toggle Button */}
            <section className="comment-form-section">
              <div className="comment-form-toggle">
                <button 
                  type="button"
                  className="toggle-form-button"
                  onClick={handleWriteButtonClick}
                >
                  <i className="fas fa-edit toggle-icon"></i>
                  <span>수강 문의 작성하기</span>
                </button>
              </div>
            </section>

            {/* Modal for Comment Form */}
            {showFormForm && (
              <div className="modal-overlay" onClick={() => {
                setShowFormForm(false);
                setNewComment({
                  content: '',
                  courseName: '',
                  className: '',
                  isPublic: true,
                });
                setSelectedCourseId('');
                setSelectedLectureId('');
              }}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">
                      <i className="fas fa-edit"></i>
                      수강 문의 작성
                    </h2>
                    <button 
                      type="button"
                      className="modal-close-button"
                      onClick={() => {
                        setShowFormForm(false);
                        setNewComment({
                          content: '',
                          courseName: '',
                          className: '',
                          isPublic: true,
                        });
                        setSelectedCourseId('');
                        setSelectedLectureId('');
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <form onSubmit={handleSubmit} className="comment-form">
                      <table className="comment-form-table">
                        <tbody>
                          {userName && (
                            <tr>
                              <th>이름</th>
                              <td>
                                <div className="modal-user-name-display">
                                  {userName}
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr>
                            <th>강좌명 *</th>
                            <td>
                              <select
                                id="courseSelect"
                                value={selectedCourseId}
                                onChange={handleCourseChange}
                              >
                                <option value="" disabled>
                                  강좌를 선택하세요{userCourses.length === 0 ? ' (수강 가능한 강좌가 없습니다)' : ''}
                                </option>
                                <option value="none">기타 문의사항</option>
                                {userCourses.map((course) => (
                                  <option key={course._id} value={course._id}>
                                    {course.courseName}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          <tr>
                            <th>강의명 *</th>
                            <td>
                              <select
                                id="lectureSelect"
                                value={selectedLectureId}
                                onChange={handleLectureChange}
                                disabled={!selectedCourseId || selectedCourseId === 'none'}
                              >
                                <option value="" disabled>강의를 선택하세요</option>
                                {((userCourses.find(c => c._id === selectedCourseId) || courses.find(c => c._id === selectedCourseId))?.lectures || []).map((lecture, index) => (
                                  <option 
                                    key={lecture._id || index} 
                                    value={lecture._id ? lecture._id.toString() : index.toString()}
                                  >
                                    {lecture.lectureNumber}강. {lecture.lectureTitle}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          <tr>
                            <th>문의사항 *</th>
                            <td>
                              <textarea
                                id="content"
                                value={newComment.content}
                                onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                                placeholder="문의사항을 작성해주세요"
                                rows="4"
                                required
                              />
                            </td>
                          </tr>
                          <tr>
                            <th>공개 설정 *</th>
                            <td>
                              <select
                                id="isPublicSelect"
                                value={newComment.isPublic ? 'public' : 'private'}
                                onChange={(e) => setNewComment({ ...newComment, isPublic: e.target.value === 'public' })}
                                required
                              >
                                <option value="public">공개</option>
                                <option value="private">비공개 (관리자만 볼 수 있습니다)</option>
                              </select>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="2" className="submit-cell">
                              <div className="form-actions">
                                <button type="submit" className="submit-button" disabled={isSubmitting}>
                                  {isSubmitting ? '작성 중...' : '댓글 작성'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for Edit Comment Form */}
            {showEditModal && editingId && (
              <div className="modal-overlay" onClick={() => {
                setShowEditModal(false);
                setEditingId(null);
                setEditContent({
                  content: '',
                  courseName: '',
                  className: '',
                  isPublic: true,
                });
                setEditSelectedCourseId('');
                setEditSelectedLectureId('');
              }}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">
                      <i className="fas fa-edit"></i>
                      수강 문의 수정
                    </h2>
                    <button 
                      type="button"
                      className="modal-close-button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingId(null);
                        setEditContent({
                          content: '',
                          courseName: '',
                          className: '',
                          isPublic: true,
                        });
                        setEditSelectedCourseId('');
                        setEditSelectedLectureId('');
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <form onSubmit={handleUpdate} className="comment-form">
                      <table className="comment-form-table">
                        <tbody>
                          {userName && (
                            <tr>
                              <th>이름</th>
                              <td>
                                <div className="modal-user-name-display">
                                  {userName}
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr>
                            <th>강좌명 *</th>
                            <td>
                              <select
                                id="editCourseSelect"
                                value={editSelectedCourseId}
                                onChange={handleEditCourseChange}
                              >
                                <option value="" disabled>
                                  강좌를 선택하세요{userCourses.length === 0 ? ' (수강 가능한 강좌가 없습니다)' : ''}
                                </option>
                                <option value="none">기타 문의사항</option>
                                {userCourses.map((course) => (
                                  <option key={course._id} value={course._id}>
                                    {course.courseName}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          <tr>
                            <th>강의명 *</th>
                            <td>
                              <select
                                id="editLectureSelect"
                                value={editSelectedLectureId}
                                onChange={handleEditLectureChange}
                                disabled={!editSelectedCourseId || editSelectedCourseId === 'none'}
                              >
                                <option value="" disabled>강의를 선택하세요</option>
                                {((userCourses.find(c => c._id === editSelectedCourseId) || courses.find(c => c._id === editSelectedCourseId))?.lectures || []).map((lecture, index) => (
                                  <option 
                                    key={lecture._id || index} 
                                    value={lecture._id ? lecture._id.toString() : index.toString()}
                                  >
                                    {lecture.lectureNumber}강. {lecture.lectureTitle}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          <tr>
                            <th>문의사항 *</th>
                            <td>
                              <textarea
                                id="editContent"
                                value={editContent.content}
                                onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                                placeholder="문의사항을 작성해주세요"
                                rows="4"
                                required
                              />
                            </td>
                          </tr>
                          <tr>
                            <th>공개 설정 *</th>
                            <td>
                              <select
                                id="editIsPublicSelect"
                                value={editContent.isPublic ? 'public' : 'private'}
                                onChange={(e) => setEditContent({ ...editContent, isPublic: e.target.value === 'public' })}
                                required
                              >
                                <option value="public">공개</option>
                                <option value="private">비공개 (관리자만 볼 수 있습니다)</option>
                              </select>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="2" className="submit-cell">
                              <div className="form-actions">
                                <button type="submit" className="submit-button">
                                  댓글 수정
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for Comment Detail */}
            {showCommentDetailModal && selectedCommentForModal && (
              <div className="modal-overlay" onClick={closeCommentDetailModal}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">
                      <i className="fas fa-comment-dots"></i>
                      수강 문의 상세
                    </h2>
                    <button 
                      type="button"
                      className="modal-close-button"
                      onClick={closeCommentDetailModal}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="comment-detail-content">
                      <div className="detail-info-grid">
                        <div className="detail-info-item">
                          <span className="detail-label">작성자</span>
                          <span className="detail-value">
                            {canViewCommentContent(selectedCommentForModal) 
                              ? (selectedCommentForModal.authorName || selectedCommentForModal.author?.name || '익명')
                              : '*****'}
                            {!selectedCommentForModal.isPublic && (
                              <span className="private-badge">
                                <i className="fas fa-lock"></i>
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">아이디</span>
                          <span className="detail-value">
                            {canViewCommentContent(selectedCommentForModal) 
                              ? (selectedCommentForModal.author?.userId || '-')
                              : '********'}
                          </span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">강좌명</span>
                          <span className="detail-value">{selectedCommentForModal.courseName || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">강의명</span>
                          <span className="detail-value">{selectedCommentForModal.className || '-'}</span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">공개</span>
                          <span className={`detail-value ${!selectedCommentForModal.isPublic ? 'private-value' : ''}`}>
                            {selectedCommentForModal.isPublic ? '공개' : '비공개'}
                          </span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">작성일시</span>
                          <span className="detail-value">{formatFullDate(selectedCommentForModal.createdAt)}</span>
                        </div>
                      </div>
                      {canViewCommentContent(selectedCommentForModal) ? (
                        <>
                          <div className="detail-content-box">
                            <p>{selectedCommentForModal.content}</p>
                          </div>
                          <div className="detail-actions">
                            {isCommentOwner(selectedCommentForModal) && (
                              <>
                                <button onClick={(e) => { 
                                  e.stopPropagation(); 
                                  closeCommentDetailModal();
                                  handleEdit(selectedCommentForModal); 
                                }} className="btn-edit">수정</button>
                                <button onClick={(e) => { 
                                  e.stopPropagation(); 
                                  closeCommentDetailModal();
                                  handleDelete(selectedCommentForModal._id); 
                                }} className="btn-delete">삭제</button>
                              </>
                            )}
                            {isAdmin && !isCommentOwner(selectedCommentForModal) && (
                              <button onClick={(e) => { 
                                e.stopPropagation(); 
                                closeCommentDetailModal();
                                handleDelete(selectedCommentForModal._id); 
                              }} className="btn-delete">삭제</button>
                            )}
                            {isAdmin && !selectedCommentForModal.reply?.content && (
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setReplyingToId(selectedCommentForModal._id);
                                  setReplyContent('');
                                }} 
                                className="btn-reply"
                              >
                                답글 작성
                              </button>
                            )}
                          </div>
                          {/* 답글 표시 */}
                          {selectedCommentForModal.reply && selectedCommentForModal.reply.content && (
                            <div className="reply-section">
                              <div className="reply-header">
                                <span className="reply-label">관리자 답변</span>
                                <span className="reply-date">{formatFullDate(selectedCommentForModal.reply.createdAt)}</span>
                              </div>
                              {editingReplyId === selectedCommentForModal._id ? (
                                <div className="reply-edit-form">
                                  <textarea
                                    value={editReplyContent}
                                    onChange={(e) => setEditReplyContent(e.target.value)}
                                    placeholder="답글 내용을 입력하세요"
                                    rows="3"
                                  />
                                  <div className="reply-edit-actions">
                                    <button onClick={() => {
                                      handleReplyEdit(selectedCommentForModal._id);
                                    }} className="btn-edit">수정 완료</button>
                                    <button onClick={() => { 
                                      setEditingReplyId(null); 
                                      setEditReplyContent(''); 
                                    }} className="btn-cancel">취소</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="reply-content">
                                    <p>{selectedCommentForModal.reply.content}</p>
                                  </div>
                                  {isAdmin && (
                                    <div className="reply-actions">
                                      <button onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setEditingReplyId(selectedCommentForModal._id);
                                        setEditReplyContent(selectedCommentForModal.reply.content);
                                      }} className="btn-edit-small">수정</button>
                                      <button onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleReplyDelete(selectedCommentForModal._id); 
                                      }} className="btn-delete-small">삭제</button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                          {/* 답글 작성 폼 */}
                          {isAdmin && replyingToId === selectedCommentForModal._id && (
                            <div className="reply-form-section">
                              <div className="reply-form-header">
                                <span className="reply-label">답글 작성</span>
                              </div>
                              <div className="reply-form">
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="답글 내용을 입력하세요"
                                  rows="4"
                                />
                                <div className="reply-form-actions">
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      handleReplySubmit(selectedCommentForModal._id);
                                    }} 
                                    className="btn-submit-reply"
                                    disabled={!replyContent.trim() || isSubmittingReply}
                                  >
                                    {isSubmittingReply ? '작성 중...' : '답글 작성'}
                                  </button>
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setReplyingToId(null);
                                      setReplyContent('');
                                    }} 
                                    className="btn-cancel-reply"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="detail-content-box restricted-content">
                            <p className="restricted-message">
                              🔒 이 댓글은 비공개로 설정되어 있습니다.<br />
                              작성자와 관리자만 내용을 확인할 수 있습니다.
                            </p>
                          </div>
                          {isAdmin && (
                            <div className="detail-actions">
                              <button onClick={(e) => { 
                                e.stopPropagation(); 
                                closeCommentDetailModal();
                                handleDelete(selectedCommentForModal._id); 
                              }} className="btn-delete">삭제</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Attendance;
