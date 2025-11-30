# MathChang Client

Vite + React를 사용한 클라이언트 프로젝트입니다.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 4. 빌드 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
client/
├── src/
│   ├── App.jsx          # 메인 App 컴포넌트
│   ├── App.css          # App 스타일
│   ├── main.jsx         # React 진입점
│   └── index.css        # 전역 스타일
├── index.html           # HTML 템플릿
├── vite.config.js       # Vite 설정
├── package.json         # 프로젝트 설정 및 의존성
└── README.md           # 프로젝트 설명
```

## 주요 기능

- ⚡ Vite를 사용한 빠른 개발 환경
- ⚛️ React 18.2
- 🎨 모던한 UI 스타일
- 🔄 Hot Module Replacement (HMR)
- 📦 코드 스플리팅 및 최적화
- 🔌 API 프록시 설정 (서버: http://localhost:5000)

## 사용된 기술

- **Vite** - 차세대 프론트엔드 빌드 도구
- **React** - UI 라이브러리
- **React Router DOM** - 라우팅
- **Axios** - HTTP 클라이언트

