import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }, [navigate]);

  if (loading) {
    return (
      <div className="admin-page">
        <Header />
        <div className="admin-container">
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
    <div className="admin-page">
      <Header />
      <div className="admin-container">
        <div className="admin-content">
          <h1 className="admin-title">관리자 페이지</h1>
          
          <div className="admin-cards-grid">
            {/* 강좌 관리 카드 */}
            <div className="admin-card" onClick={() => navigate('/admin/courses')}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">전체 강좌 목록 및 관리</h2>
                <button className="admin-card-button">
                  강좌 목록 보기
                </button>
              </div>
            </div>

            {/* 사용자 관리 카드 */}
            <div className="admin-card" onClick={() => navigate('/admin/users')}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">사용자 관리</h2>
                <button className="admin-card-button">
                  사용자 목록 보기
                </button>
              </div>
            </div>

            {/* 반 관리 카드 */}
            <div className="admin-card" onClick={() => navigate('/admin/classes')}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">반 관리</h2>
                <button className="admin-card-button">
                  반 목록 보기
                </button>
              </div>
            </div>

            {/* 맛보기강좌 관리 카드 */}
            <div className="admin-card" onClick={() => navigate('/admin/preview-courses')}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">맛보기강좌 관리</h2>
                <button className="admin-card-button">
                  맛보기강좌 목록 보기
                </button>
              </div>
            </div>

            {/* 반별 학생 기록 조회 카드 */}
            <div className="admin-card" onClick={() => navigate('/admin/class-student-records')}>
              <div className="admin-card-header">
                <h2 className="admin-card-title">반별 학생 기록 조회</h2>
                <button className="admin-card-button">
                  학생 기록 조회하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Admin;
