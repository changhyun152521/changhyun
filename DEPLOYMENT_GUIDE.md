# 배포 가이드 (Vercel + Heroku)

## 📋 배포 순서

### 1단계: 서버 배포 (Heroku) - 먼저 진행
서버를 먼저 배포해야 클라이언트에서 API를 호출할 수 있습니다.

### 2단계: 클라이언트 배포 (Vercel)
서버 URL을 받은 후 클라이언트를 배포합니다.

---

## 🔧 배포 전 준비사항

### A. 서버 (Heroku) 준비

#### 1. Heroku 설정 파일 생성

**Procfile 생성** (`server/Procfile`):
```
web: node index.js
```

#### 2. 환경 변수 확인
- `MONGODB_ATLAS_URL` (선택적 - 기본값 사용 시 생략 가능)
- `PORT` (Heroku가 자동 설정)
- `JWT_SECRET` (필수)
- `JWT_EXPIRES_IN` (선택적, 기본값: 7d)
- `NODE_ENV=production`

#### 3. CORS 설정 수정
프로덕션 클라이언트 URL을 허용하도록 수정 필요

#### 4. package.json 확인
- `"start": "node index.js"` 스크립트 확인

---

### B. 클라이언트 (Vercel) 준비

#### 1. Vercel 설정 파일 생성

**vercel.json 생성** (`client/vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 2. 환경 변수 설정
- `VITE_API_URL` - Heroku 서버 URL (예: `https://your-app.herokuapp.com`)

#### 3. axiosConfig.js 수정
프로덕션 환경에서 실제 서버 URL 사용하도록 수정 필요

---

## 🚀 배포 단계별 가이드

### Step 1: 서버 배포 (Heroku)

#### 1-1. Heroku CLI 설치 및 로그인
```bash
# Heroku CLI 설치 (이미 설치되어 있다면 생략)
# https://devcenter.heroku.com/articles/heroku-cli

# 로그인
heroku login
```

#### 1-2. Heroku 앱 생성
```bash
cd server
heroku create your-app-name
```

#### 1-3. 환경 변수 설정
```bash
heroku config:set JWT_SECRET=your-super-secret-key-change-in-production
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set NODE_ENV=production
# MONGODB_ATLAS_URL이 기본값과 다르면 설정
# heroku config:set MONGODB_ATLAS_URL=your-mongodb-url
```

#### 1-4. Git 저장소 초기화 및 배포
```bash
# Git 초기화 (이미 되어 있다면 생략)
git init

# Heroku 원격 저장소 추가
heroku git:remote -a your-app-name

# 배포
git add .
git commit -m "Initial deployment"
git push heroku main
# 또는 master 브랜치인 경우
git push heroku master
```

#### 1-5. 서버 URL 확인
```bash
heroku open
# 또는
heroku info
```
서버 URL 예: `https://your-app-name.herokuapp.com`

---

### Step 2: 클라이언트 배포 (Vercel)

#### 2-1. Vercel CLI 설치 및 로그인
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login
```

#### 2-2. 환경 변수 설정
```bash
cd client
vercel env add VITE_API_URL
# 입력: https://your-app-name.herokuapp.com
```

#### 2-3. 배포
```bash
# 배포
vercel --prod
```

또는 Vercel 웹 대시보드에서:
1. https://vercel.com 접속
2. "New Project" 클릭
3. GitHub 저장소 연결
4. Root Directory: `client` 설정
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variables에 `VITE_API_URL` 추가
8. Deploy

---

## ⚙️ 배포 전 코드 수정 사항

### 1. 서버 CORS 설정 수정

`server/index.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CLIENT_URL, // Vercel 배포 URL
    'https://your-vercel-app.vercel.app', // 실제 Vercel URL
  ].filter(Boolean), // undefined 제거
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));
```

### 2. 클라이언트 API 설정 수정

`client/src/api/axiosConfig.js`:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // 프로덕션: Vercel 환경변수, 개발: proxy
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});
```

---

## ✅ 배포 후 확인사항

### 서버 확인
1. `https://your-app.herokuapp.com/api/health` 접속
2. 응답 확인: `{"status":"OK",...}`

### 클라이언트 확인
1. Vercel 배포 URL 접속
2. 로그인/회원가입 테스트
3. API 호출이 정상 작동하는지 확인

---

## 🔍 문제 해결

### CORS 오류
- 서버 CORS 설정에 클라이언트 URL이 포함되어 있는지 확인
- Heroku 환경 변수에 `CLIENT_URL` 설정

### API 연결 실패
- `VITE_API_URL` 환경 변수가 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 네트워크 요청 확인

### 빌드 실패
- `package.json`의 빌드 스크립트 확인
- Vercel 빌드 로그 확인

---

## 📝 체크리스트

### 배포 전
- [ ] 서버 CORS 설정에 프로덕션 URL 추가
- [ ] 클라이언트 axiosConfig.js 수정
- [ ] Procfile 생성 (server/)
- [ ] vercel.json 생성 (client/)
- [ ] 불필요한 파일 제거 (nodemon.json, scripts 등)
- [ ] 환경 변수 목록 정리

### 서버 배포
- [ ] Heroku 앱 생성
- [ ] 환경 변수 설정
- [ ] Procfile 확인
- [ ] 배포 및 테스트

### 클라이언트 배포
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 (VITE_API_URL)
- [ ] 배포 및 테스트
- [ ] CORS 오류 확인

