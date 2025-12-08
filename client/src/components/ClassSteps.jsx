import { useEffect, useRef } from 'react';
import './ClassSteps.css';

function ClassSteps() {
  const stepsRef = useRef([]);

  const steps = [
    {
      number: 'STEP 01',
      image: '/3번.png',
      title: '섬세한 개념수업',
      description: '기본 개념을 꼼꼼하고 세밀하게 설명하여 학생들이 수학의 원리를 정확히 이해할 수 있도록 합니다.'
    },
    {
      number: 'STEP 02',
      image: '/3번 - 복사본 - 복사본.png',
      title: '실전이론수업',
      description: '이론을 실제 문제에 적용하는 방법을 체계적으로 학습하여 실전 감각을 기를 수 있도록 합니다.'
    },
    {
      number: 'STEP 03',
      image: '/3번 - 복사본 - 복사본 (2).png',
      title: '실전감각 고난도 N제',
      description: '고난도 문제를 통해 실전 감각을 키우고, 다양한 유형의 문제를 풀어보며 실력을 향상시킵니다.'
    },
    {
      number: 'STEP 04',
      image: '/3번 - 복사본 - 복사본 (3).png',
      title: '직전 FINAL',
      description: '시험 직전 최종 정리와 실전 대비를 통해 완벽한 준비를 마무리합니다.'
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('animate-in');
            }, index * 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    stepsRef.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      stepsRef.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section className="class-steps-section">
      <div className="container">
        <div className="steps-header">
          <div className="steps-header-icon">
            <img src="/메인1.png" alt="이창현수학" className="steps-header-icon-img" />
          </div>
          <div className="section-heading">
            <img src="/메인1 - 복사본.png" alt="수업 완성도 100% 안정감 있게!" className="section-heading-img" />
          </div>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="step-item"
              ref={(el) => (stepsRef.current[index] = el)}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-image-wrapper">
                <img src={step.image} alt={step.title} className="step-image" />
              </div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ClassSteps;

