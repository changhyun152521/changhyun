import { useEffect, useRef } from 'react';
import './Services.css';

function Services() {
  const cardsRef = useRef([]);
  const headerRef = useRef(null);

  const services = [
    {
      icon: 'fas fa-chart-line',
      title: '심화 수학',
      description: '기본 개념을 넘어 고난도 문제와 심화 이론을 다루어 수학적 사고력을 한 단계 끌어올립니다.'
    },
    {
      icon: 'fas fa-clipboard-check',
      title: '꼼꼼한 관리',
      description: '학생들의 학습 진도와 이해도를 꾸준히 확인하고 체계적으로 관리하여 학습 효과를 높입니다.'
    },
    {
      icon: 'fas fa-graduation-cap',
      title: '내신 대비',
      description: '학교 시험에 완벽 대비할 수 있도록 교과서와 학교 진도에 맞춘 체계적인 수업을 제공합니다.'
    },
    {
      icon: 'fas fa-book-open',
      title: '수능 대비',
      description: '수능 수학 영역 완벽 대비를 위한 체계적인 문제 풀이와 개념 정리 수업을 진행합니다.'
    }
  ];

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

    cardsRef.current.forEach((ref, index) => {
      if (ref) {
        // 각 카드에 순차적으로 애니메이션 적용
        setTimeout(() => {
          observer.observe(ref);
        }, index * 100);
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
  }, []);

  return (
    <section id="services" className="services">
      <div className="container">
        <div className="services-header" ref={headerRef}>
          <div className="services-header-icon">
            <img src="/메인3.png" alt="이창현수학" className="services-header-icon-img" />
          </div>
          <div className="services-text">
            <div className="section-title">
              <img src="/메인3 - 복사본.png" alt="제 수업" className="section-title-img" />
            </div>
            <p className="section-description">
              체계적인 커리큘럼과 문제 해결 중심의 수업으로 학생들의 수학적 사고력을 향상시킵니다.
            </p>
          </div>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="service-card"
              ref={(el) => (cardsRef.current[index] = el)}
            >
              <div className="service-icon">
                <i className={service.icon}></i>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;

