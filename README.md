# MathChang 프로젝트

Node.js + Express + MongoDB (서버)와 React + Vite (클라이언트)를 사용한 풀스택 프로젝트입니다.

## 📦 저장소 정보

- GitHub: [https://github.com/changhyun152521/mathchang-homepage](https://github.com/changhyun152521/mathchang-homepage)

## 프로젝트 구조

```
mathchang/
├── server/          # 백엔드 서버 (Node.js + Express + MongoDB)
│   ├── controllers/ # 컨트롤러 (비즈니스 로직)
│   ├── models/      # 데이터 모델 (Mongoose 스키마)
│   ├── routes/      # API 라우트
│   ├── scripts/     # 유틸리티 스크립트
│   └── index.js     # 서버 진입점
└── client/          # 프론트엔드 클라이언트 (React + Vite)
    ├── src/
    │   ├── components/  # React 컴포넌트
    │   ├── pages/       # 페이지 컴포넌트
    │   └── api/         # API 설정
    └── public/          # 정적 파일
```

## 빠른 시작

### 1. 의존성 설치

```bash
npm run install:all
```

또는 개별 설치:

```bash
# 서버 의존성 설치
cd server && npm install

# 클라이언트 의존성 설치
cd client && npm install
```

### 2. 환경 변수 설정

`server` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
MONGODB_URI=mongodb://localhost:27017/mathchang
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

MongoDB Atlas를 사용하는 경우:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mathchang
```

### 3. 서버 실행

**방법 1: 루트에서 실행 (권장)**
```bash
npm run server
# 또는
npm run dev
```

**방법 2: server 폴더에서 직접 실행**
```bash
cd server
npm run dev  # 개발 모드 (nodemon)
npm start    # 프로덕션 모드
```

서버는 `http://localhost:5000`에서 실행됩니다.

### 4. 클라이언트 실행

**방법 1: 루트에서 실행 (권장)**
```bash
npm run client
```

**방법 2: client 폴더에서 직접 실행**
```bash
cd client
npm run dev
```

클라이언트는 `http://localhost:3000`에서 실행됩니다.

## 사용 가능한 스크립트

루트 디렉토리에서:

- `npm start` - 서버 프로덕션 모드 실행
- `npm run dev` - 서버 개발 모드 실행 (nodemon)
- `npm run server` - 서버 개발 모드 실행 (별칭)
- `npm run client` - 클라이언트 개발 서버 실행
- `npm run install:all` - 서버와 클라이언트 의존성 모두 설치

## 주요 기능

### 백엔드 (Server)
- ✅ 사용자 회원가입/로그인
- ✅ JWT 토큰 기반 인증
- ✅ 비밀번호 암호화 (bcrypt)
- ✅ 사용자 유형 관리 (학생, 학부모, 강사)
- ✅ 관리자 권한 자동 부여 (강사)
- ✅ 아이디/비밀번호 찾기

### 프론트엔드 (Client)
- ✅ 반응형 웹 디자인 (모바일 최적화)
- ✅ 회원가입/로그인 페이지
- ✅ 홈페이지 (Hero, Services, Portfolio 등)
- ✅ 토큰 기반 인증 상태 관리
- ✅ API 프록시 설정

## API 엔드포인트

### 인증
- `POST /api/users/login` - 로그인
- `POST /api/users` - 회원가입
- `POST /api/users/find-userid` - 아이디 찾기
- `POST /api/users/reset-password` - 비밀번호 재설정

### 사용자 관리
- `GET /api/users` - 모든 유저 조회
- `GET /api/users/:id` - 특정 유저 조회
- `GET /api/users/userId/:userId` - userId로 유저 조회
- `PUT /api/users/:id` - 유저 정보 수정
- `DELETE /api/users/:id` - 유저 삭제

## 기술 스택

### 백엔드
- Node.js
- Express.js
- MongoDB + Mongoose
- bcrypt (비밀번호 암호화)
- jsonwebtoken (JWT 인증)

### 프론트엔드
- React 18
- Vite
- React Router DOM
- Axios
- CSS3 (반응형 디자인)

## 주의사항

⚠️ **프로젝트 루트 디렉토리에서 직접 `node index.js`를 실행하지 마세요!**

- 서버는 `server` 폴더에 있습니다
- 클라이언트는 `client` 폴더에 있습니다
- 루트의 `package.json` 스크립트를 사용하거나 각 폴더에서 직접 실행하세요

