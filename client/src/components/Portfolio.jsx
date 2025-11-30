import { useState, useEffect, useRef } from 'react';
import './Portfolio.css';

function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all');
  const cardsRef = useRef([]);
  const headerRef = useRef(null);

  const portfolioItems = [
    { category: 'algebra', icon: 'fas fa-calculator', title: '방정식과 부등식', description: '일차·이차 방정식의 해법' },
    { category: 'geometry', icon: 'fas fa-shapes', title: '평면 기하', description: '삼각형과 원의 성질' },
    { category: 'calculus', icon: 'fas fa-chart-line', title: '미분과 적분', description: '함수의 변화율과 넓이' },
    { category: 'statistics', icon: 'fas fa-chart-bar', title: '확률과 통계', description: '데이터 분석과 확률 계산' },
    { category: 'algebra', icon: 'fas fa-project-diagram', title: '함수와 그래프', description: '다양한 함수의 성질' },
    { category: 'geometry', icon: 'fas fa-cube', title: '입체 기하', description: '공간 도형의 이해' }
  ];

  const filters = [
    { id: 'all', label: '전체' },
    { id: 'algebra', label: '대수' },
    { id: 'geometry', label: '기하' },
    { id: 'calculus', label: '미적분' },
    { id: 'statistics', label: '확률통계' }
  ];

  const filteredItems = activeFilter === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeFilter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    // 필터 변경 시 애니메이션 재설정
    cardsRef.current.forEach((ref, index) => {
      if (ref) {
        ref.classList.remove('animate-in');
        setTimeout(() => {
          observer.observe(ref);
        }, index * 80);
      }
    });

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current);
      }
      cardsRef.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [activeFilter]);

  return (
    <section id="portfolio" className="portfolio">
      <div className="container">
        <div className="portfolio-header" ref={headerRef}>
          <div className="portfolio-icon">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h2 className="section-title">시그니쳐 강좌</h2>
          <p className="section-description">
            다양한 수학 주제와 문제 해결을 통해 학생들이 수학의 즐거움을 발견할 수 있도록 합니다.
          </p>
        </div>
        <div className="portfolio-filters">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
        <div className="portfolio-grid">
          {filteredItems.map((item, index) => (
            <div 
              key={index} 
              className="portfolio-item" 
              data-category={item.category}
              ref={(el) => (cardsRef.current[index] = el)}
            >
              <div className="portfolio-image">
                <i className={item.icon}></i>
              </div>
              <div className="portfolio-overlay">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Portfolio;

