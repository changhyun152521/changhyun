const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// 프록시 신뢰 설정 (Nginx 등 리버스 프록시 뒤에서 실행 시 필요)
app.set('trust proxy', 1);

// 보안 헤더 설정
app.use(helmet());

// CORS 허용 origin 검사 함수
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // 같은 도메인 요청

  // vercel.app 도메인 차단
  if (origin.includes('vercel.app')) return false;

  // 정적 허용 목록
  const staticAllowedOrigins = [
    'https://mathchang.com',
    'https://www.mathchang.com',
    'http://mathchang.com',
    'http://www.mathchang.com',
    process.env.CLIENT_URL,
  ].filter(Boolean);

  if (staticAllowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // localhost 모든 포트 허용
    if (hostname === 'localhost') return true;

    // 127.0.0.1 모든 포트 허용
    if (hostname === '127.0.0.1') return true;

    // 내부망 IP 허용 (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;

  } catch (e) {
    // URL 파싱 실패 시 거부
    return false;
  }

  return false;
};

// CORS 설정
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS 차단: ${origin}`);
    return callback(new Error('CORS 정책에 의해 차단되었습니다'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 요청/응답 로깅 미들웨어
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    if (res.statusCode >= 400) {
      console.warn(`[API] ${log}`);
    } else {
      console.log(`[API] ${log}`);
    }
  });

  next();
});

// MongoDB 연결
const connectDB = async () => {
  try {
    // 기본적으로 MONGODB_ATLAS_URL 환경 변수 사용
    // MONGODB_ATLAS_URL이 없을 때만 로컬 주소 사용
    const mongoUri = process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/mathchang';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB 연결 성공: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    process.exit(1);
  }
};

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'MathChang Server API' });
});

// API 라우트 (예시)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: '서버가 정상적으로 실행 중입니다',
    mongodb: mongoose.connection.readyState === 1 ? '연결됨' : '연결 안됨'
  });
});

// 라우터 연결
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

const coursesRouter = require('./routes/courses');
app.use('/api/courses', coursesRouter);

const classesRouter = require('./routes/classes');
app.use('/api/classes', classesRouter);

const previewCoursesRouter = require('./routes/previewCourses');
app.use('/api/preview-courses', previewCoursesRouter);

const classRecordsRouter = require('./routes/classRecords');
app.use('/api/class-records', classRecordsRouter);

const studentRecordsRouter = require('./routes/studentRecords');
app.use('/api/student-records', studentRecordsRouter);

const noticesRouter = require('./routes/notices');
app.use('/api/notices', noticesRouter);

const attendanceCommentsRouter = require('./routes/attendanceComments');
app.use('/api/attendance-comments', attendanceCommentsRouter);

const parentStudentLinksRouter = require('./routes/parentStudentLinks');
app.use('/api/parent-student-links', parentStudentLinksRouter);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '라우트를 찾을 수 없습니다',
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  // 프로덕션에서는 최소한의 에러 로깅
  console.error(`[ERROR] ${req.method} ${req.path}: ${err.message}`);

  if (res.headersSent) {
    return next(err);
  }

  // CORS 헤더 설정 (에러 응답에도 반드시 필요)
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }

  res.setHeader('Content-Type', 'application/json');

  // 유효성 검사 에러는 그대로 반환
  if (err.message && err.message.includes('모든 필수 필드를 입력해주세요')) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: '서버 오류가 발생했습니다',
    ...(process.env.NODE_ENV === 'development' && { message: err.message, stack: err.stack })
  });
});

// 서버 시작
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
    console.log(`서버 주소: http://localhost:${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`포트 ${PORT}가 이미 사용 중입니다. 다른 포트를 사용하거나 실행 중인 프로세스를 종료해주세요.`);
      console.error(`포트를 변경하려면 .env 파일에 PORT=5001 (또는 다른 포트)를 설정하세요.`);
    } else {
      console.error('서버 시작 중 오류:', err);
    }
    process.exit(1);
  });
});

module.exports = app;

