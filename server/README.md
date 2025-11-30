# MathChang Server

Node.js, Express, MongoDB를 사용한 서버 프로젝트입니다.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`server` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```
MONGODB_URI=mongodb://localhost:27017/mathchang
PORT=5000
NODE_ENV=development
```

MongoDB Atlas를 사용하는 경우:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mathchang
```

### 3. MongoDB 실행

로컬 MongoDB를 실행하거나, MongoDB Atlas 등의 클라우드 서비스를 사용할 수 있습니다.

### 4. 서버 실행

개발 모드 (nodemon 사용):
```bash
npm run dev
```

프로덕션 모드:
```bash
npm start
```

서버는 기본적으로 `http://localhost:5000`에서 실행됩니다.

## 프로젝트 구조

```
server/
├── index.js          # 메인 서버 파일
├── package.json       # 프로젝트 설정 및 의존성
├── .env              # 환경 변수 (git에 커밋하지 않음)
└── README.md         # 프로젝트 설명
```

## API 엔드포인트

- `GET /` - 기본 메시지
- `GET /api/health` - 서버 상태 확인

