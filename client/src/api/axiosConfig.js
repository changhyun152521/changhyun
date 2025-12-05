import axios from 'axios';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // 프로덕션: Vercel 환경변수, 개발: proxy
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
});

// 요청 인터셉터 (토큰 추가)
api.interceptors.request.use(
  (config) => {
    console.log('[Axios 요청]', config.method?.toUpperCase(), config.url, {
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    // localStorage 또는 sessionStorage에서 토큰을 가져와 헤더에 추가
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Axios 요청 오류]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log('[Axios 응답 성공]', response.config.method?.toUpperCase(), response.config.url, {
      status: response.status,
      statusText: response.statusText,
    });
    // API 요청 성공 시 사용자 활동으로 간주하여 이벤트 발생
    if (localStorage.getItem('token') || sessionStorage.getItem('token')) {
      window.dispatchEvent(new Event('userActivity'));
    }
    return response;
  },
  (error) => {
    console.error('[Axios 응답 오류]', {
      message: error.message,
      code: error.code,
      hasResponse: !!error.response,
      hasRequest: !!error.request,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      requestURL: error.config?.url,
      requestMethod: error.config?.method,
    });
    
    if (error.response) {
      // 서버에서 응답이 온 경우
      // 401 에러 시 자동 로그아웃
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedUserId');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/';
      }
      return Promise.reject(error);
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('[Axios] 서버 응답 없음 - 프록시 또는 서버 연결 문제 가능');
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'));
    } else {
      // 요청 설정 중 오류가 발생한 경우
      return Promise.reject(error);
    }
  }
);

export default api;

