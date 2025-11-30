import { useState, useEffect, useRef } from 'react';
import './Testimonials.css';

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);
  const currentIndexRef = useRef(0);

  const testimonials = [
    {
      school: '서울대 의예과 25학번 유ㅇㅇ',
      text: '중고등학교 시절 4년간 이창현 선생님께서 담임 선생님으로서 지도해주셔서 항상 편하게 질문할 수 있었고, 선생님에 대한 믿음도 컸습니다. 특히 이창현 선생님께서는 매 시험 기간마다 직접 제작한 내신 특화 심화 교재를 나눠주셨는데, 교재에는 학교별 기출 경향이 반영되어 있어 이를 완벽히 소화하면 큰 어려움 없이 1등급을 받을 수 있었을 정도로 좋은 퀄리티였다고 생각합니다. 실제로 고등학교에 진학하여 이창현 선생님께 수학을 배우는 동안, 내신 수학에서는 전교 3등 이내, 모의고사에서는 1등급을 놓친 적이 단 한번도 없었습니다. 또한, 풀이 방식에서도 한 가지 방법이 아니라 다양한 접근법을 제시해주셔서 문제를 더 깊이 이해할 수 있었고, 덕분에 단순한 암기가 아닌 개념을 제대로 익히며, 보다 유연한 사고로 문제를 풀어가는 능력을 기를 수 있었습니다. <하략>'
    },
    {
      school: '서울대 의예과 22학번 진ㅇㅇ',
      text: '저는 클라비스를 중학교 1학년 때부터 다녔고 고등학교 2학년에 접어들면서 창현 쌤과 처음 만나 2년 동안 수업을 들었습니다. 항상 밝은 분위기와 학생을 향한 열정이 넘치시는 모습을 보여주시는 모습이 인상적이셨습니다. 제가 클라비스를 다니면서 서울대 의대 합격에 가장 도움이 되었던 것은 안정적으로 꾸준히 수학 내신 1등급을 받은 것입니다. 또한 의대를 준비하면서 가장 걱정했었던 수능 최저 역시 수학 덕분에 맞출 수 있었습니다. 이처럼 제가 내신과 수능 모두에서 좋은 점수를 받는데에는 창현쌤이 제작하신 final 교재와 수업 내용이 큰 도움이 되었습니다. 어려운 문제도 간단하게 풀 수 있는 풀이방식을 알려주셔서 내신시험과 수능을 볼 때 시간이 부족했던 적이 거의 없었습니다. 이처럼 저는 클라비스를 다니면서 수학 공부에 많은 도움을 받았고 이러한 점이 원하는 대학을 합격하는데 큰 도움이 되었습니다. <하략>'
    },
    {
      school: '성균관대 의예과 25학번 고ㅇㅇ',
      text: '안녕하세요, 인천OOO고등학교를 전체 1등으로 졸업하고 성균관대학교 의과대학에 입학한 OOO입니다. 저는 중학교 3학년부터 수능까지 클라비스와 함께 공부했고, 그 결과 고등학교 3년 내내 수학 내신·모의고사·수능 전체 1등급이라는 좋은 성적을 거두고, 최종적으로 성균관대학교 의과대학, 고려대학교 의과대학, 경희대학교 의과대학, 인하대학교 의과대학 모두를 합격할 수 있었습니다. 클라비스의 좋은 선생님, 양질의 학습자료, 열정적인 친구들이 있었기에 제가 이만큼 성장할 수 있었던 것 같습니다. 처음에는 친구의 추천으로 다니게 된 학원이었지만 수업, 자료, 시스템 등이 공부하는데 많은 도움이 되어 긴 기간동안 클라비스에서 공부하게 된 것 같습니다. 내신 기간에는 유형서, 기출서, 심화서를 차례대로 체계적으로 공부할 수 있도록 커리큘럼이 짜여져 있어서 짧은 내신 준비 기간 동안 효율적으로 공부할 수 있었습니다. <하략>'
    },
    {
      school: '중앙대 의예과 24학번 김ㅇㅇ',
      text: '타 학원에 비해 창현쌤의 강점이라고 할 수 있는 첫 번째 부분은 선생님께서 정말 여러 가지의 팁들을 알고 계시고, 방대한 양의 문제 자료를 가지고 있는 점이라고 생각합니다. 수학 문제를 푸는데에 있어서 빠른 시간 내에 정확하게 푸는 데에는 정확한 개념 이해와 적절한 스킬 사용이 복합적으로 수반되어야 한다고 생각하는데 이 두가지를 모두 갖을 수 있도록 학원에서 지도해주신 것 같습니다. 두 번째 강점은 선생님이 학생들 하나하나를 신경써주시며 모르는 것을 알 때까지 가르쳐주신다는 점입니다. 학원에서 모르는 문제를 다 해결하지 못했을 때나 숙제를 하다가 질문이 생겼을 때 선생님께 바로 카톡으로 질문을 하면 빠른 시간 내에 영상을 찍어 주셔서 해결을 해주셨습니다. 수학은 자신의 틀린 사고과정을 이른 시기에 바로잡는 과정에서 실력이 크게 느는 과목이기에 이 점이 수학 실력 향상에 많은 도움이 되었습니다. <하략>'
    },
    {
      school: '가톨릭대 의예과 22학번 전ㅇㅇ',
      text: '저는 고등학교 1학년 겨울방학 때 즈음에 클라비스 수학학원에 등록했습니다. 일단 학원에서 고난이도 문제들을 많이 접할수 있어서 좋았습니다. 특히 어떤 심화개념을 설명해주시고 그것을 바로 써먹을 수 있도록 수업이 짜임새있게 구성된 것이 많은 도움을 주셨습니다. 또한 학원에서 진행하는 시험을 통해 같은 반 친구들의 성적과 내 위치를 알 수 있어서 좋았습니다. 숙제가 많긴 하지만 많은 숙제를 통해 내신과 수능을 전부 대비할 수 있었습니다. 가끔 수업시간에 재미있는 농담과 조언을 해주시는데 그럴때마다 잠이 달아나서 유익했습니다. 창현쌤은 친구 같은 선생님이셨습니다. 그래서 여러 질문을 편히 할 수 있었고 여러 자료도 편히 받을 수 있었던 것 같습니다. 이러한 선생님의 도움으로 수학 실력이 많이 발전하였던 것 같습니다. 또 선생님의 수업에는 스토리가 들어가서 좋았던 것 같습니다. <하략>'
    },
    {
      school: '연세대 치의예과 22학번 김ㅇㅇ',
      text: '이창현 선생님은 제가 고등학교 때 수학을 가르친 선생님입니다. 제가 수학 실력에 자만해져 있을 때 이를 바로잡아준 선생님이고, 이 선생님 덕분에 연세대 치대에 오게 된 것 같습니다. 수업을 할 때는 고등 수학 전문 선생님답게 학생들의 시선에서 수학을 가르쳐 주고, 수능 수학의 시야를 넓혀준 것 같습니다. 그리고 때로는 친구처럼 학생들과 소통하고 공감하는 선생님이셨던 것 같습니다. 시험 기간에는 선생님께서 따로 준비해주신 교재를 통해 공부했습니다. 교재에는 어려운 유형의 심화 문제들이 잘 정리되어 있었습니다. 또 이런 유형이 반복적으로 학교 내신 시험에 고난도 문제로 출제되었습니다. 덕분에 내신에서는 수학을 걱정하지 않고 타 과목에 더 집중할 수 있었습니다. 또 이렇게 성장한 사고력을 통해 수능에서까지도 좋은 결과를 만들 수 있었습니다. 학원에서 테스트를 자주 봤는데 순위권 학생들이 모두 공개되어 동기부여가 되었습니다. <하략>'
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const newIndex = (prev + 1) % testimonials.length;
      currentIndexRef.current = newIndex;
      return newIndex;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const newIndex = (prev - 1 + testimonials.length) % testimonials.length;
      currentIndexRef.current = newIndex;
      return newIndex;
    });
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
    if (carouselRef.current) {
      carouselRef.current.style.scrollBehavior = 'auto';
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    // 터치 중 스크롤을 막지 않지만, 스냅 기능이 작동하도록 함
  };

  const handleTouchEnd = (e) => {
    if (!isDragging.current) return;
    touchEndX.current = e.changedTouches[0].clientX;
    isDragging.current = false;
    
    if (carouselRef.current) {
      carouselRef.current.style.scrollBehavior = 'smooth';
    }

    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 30; // 최소 스와이프 거리 (낮춰서 더 반응적으로)

    // 터치 거리가 최소 임계값을 넘으면 무조건 카드 하나씩만 이동
    if (Math.abs(diff) > minSwipeDistance) {
      // 스와이프 방향에 따라 카드 하나씩만 이동
      if (diff > 0) {
        // 왼쪽으로 스와이프 (다음 카드)
        setCurrentIndex((prev) => {
          const newIndex = (prev + 1) % testimonials.length;
          currentIndexRef.current = newIndex;
          return newIndex;
        });
      } else {
        // 오른쪽으로 스와이프 (이전 카드)
        setCurrentIndex((prev) => {
          const newIndex = (prev - 1 + testimonials.length) % testimonials.length;
          currentIndexRef.current = newIndex;
          return newIndex;
        });
      }
    } else {
      // 스와이프 거리가 부족하면 현재 카드로 스냅 (무조건 하나씩만 보이도록)
      setTimeout(() => {
        if (carouselRef.current && carouselRef.current.children[currentIndexRef.current]) {
          const card = carouselRef.current.children[currentIndexRef.current];
          const scrollLeft = card.offsetLeft - (carouselRef.current.offsetWidth / 2) + (card.offsetWidth / 2);
          carouselRef.current.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  };

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    if (carouselRef.current && carouselRef.current.children[currentIndex]) {
      const card = carouselRef.current.children[currentIndex];
      const scrollLeft = card.offsetLeft - (carouselRef.current.offsetWidth / 2) + (card.offsetWidth / 2);
      carouselRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  // 스크롤 이벤트로 현재 보이는 카드 감지 (모바일에서 스크롤 스냅 보조)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let scrollTimeout;
    const handleScroll = () => {
      if (isDragging.current) return; // 터치 중일 때는 무시
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollLeft = carousel.scrollLeft;
        const containerWidth = carousel.offsetWidth;
        
        // 각 카드의 위치를 확인하여 가장 가까운 카드 찾기
        let closestIndex = 0;
        let minDistance = Infinity;
        
        Array.from(carousel.children).forEach((card, index) => {
          const cardLeft = card.offsetLeft;
          const cardWidth = card.offsetWidth;
          const cardCenter = cardLeft + cardWidth / 2;
          const containerCenter = scrollLeft + containerWidth / 2;
          const distance = Math.abs(cardCenter - containerCenter);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });
        
        // 현재 인덱스와 다르면 업데이트 (스크롤 스냅 보조)
        // 무한 루프 방지를 위해 함수형 업데이트 사용
        setCurrentIndex((prevIndex) => {
          if (closestIndex !== prevIndex && minDistance < containerWidth / 2) {
            return closestIndex;
          }
          return prevIndex;
        });
      }, 100); // 디바운스로 성능 최적화
    };

    carousel.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      carousel.removeEventListener('scroll', handleScroll);
    };
  }, []); // 의존성 배열을 비워서 마운트 시 한 번만 등록

  // IntersectionObserver를 사용한 스크롤 애니메이션
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
        setTimeout(() => {
          observer.observe(ref);
        }, index * 150);
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
    <section className="testimonials-section">
      <div className="container">
        <div className="testimonials-header" ref={headerRef}>
          <div className="testimonials-icon">
            <i className="fas fa-star"></i>
          </div>
          <h2 className="section-title">창현T 수강생의 수강후기</h2>
        </div>
        <div className="testimonials-carousel-wrapper">
          <button 
            className="carousel-btn carousel-btn-prev" 
            aria-label="이전"
            onClick={prevSlide}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <div 
            className="testimonials-carousel" 
            ref={carouselRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="testimonial-card"
                ref={(el) => (cardsRef.current[index] = el)}
              >
                <div className="testimonial-header">
                  <h3 className="testimonial-school">{testimonial.school}</h3>
                </div>
                <div className="testimonial-content">
                  <p className="testimonial-text">{testimonial.text}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="carousel-btn carousel-btn-next" 
            aria-label="다음"
            onClick={nextSlide}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;

