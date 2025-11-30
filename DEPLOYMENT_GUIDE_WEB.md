# 배포 가이드 (웹 대시보드 사용) - Vercel + Heroku

## 📋 배포 순서

### 1단계: 서버 배포 (Heroku) - 먼저 진행 ⚠️
서버를 먼저 배포해야 클라이언트에서 API를 호출할 수 있습니다.

### 2단계: 클라이언트 배포 (Vercel)
서버 URL을 받은 후 클라이언트를 배포합니다.

---

## 🔧 배포 전 준비사항

### 필수 확인사항
- [x] `server/Procfile` 생성 완료
- [x] `client/vercel.json` 생성 완료
- [x] CORS 설정 수정 완료
- [x] axiosConfig.js 수정 완료

### GitHub 저장소 준비
웹 대시보드 배포는 GitHub 저장소와 연동해야 합니다.

1. **GitHub에 프로젝트 업로드**
   ```bash
   # 프로젝트 루트에서
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```

2. **.gitignore 확인**
   - `node_modules/` 제외 확인
   - `.env` 제외 확인
   - `dist/` 제외 확인

---

## 🚀 Step 1: 서버 배포 (Heroku 웹 대시보드)

### 1-1. Heroku 계정 생성 및 로그인
1. https://www.heroku.com 접속
2. "Sign up" 또는 "Log in" 클릭
3. 계정 생성/로그인 완료

### 1-2. 새 앱 생성
1. Heroku 대시보드에서 **"New"** → **"Create new app"** 클릭
2. **App name** 입력 (예: `mathchang-server`)
   - 전 세계적으로 고유한 이름이어야 함
   - 소문자, 숫자, 하이픈만 사용 가능
3. **Region** 선택 (United States 또는 Europe)
4. **"Create app"** 클릭

### 1-3. GitHub 연동
1. 앱 대시보드에서 **"Deploy"** 탭 클릭
2. **"Deployment method"** 섹션에서 **"GitHub"** 선택
3. **"Connect to GitHub"** 클릭
4. GitHub 계정 인증 및 저장소 선택
5. 저장소 연결 후 **"Connect"** 클릭

### 1-4. 배포 설정
1. **"Manual deploy"** 섹션에서:
   - Branch: `main` (또는 `master`) 선택
   - **"Deploy Branch"** 클릭
2. 또는 **"Automatic deploys"** 활성화:
   - Branch: `main` 선택
   - **"Enable Automatic Deploys"** 체크

### 1-5. 환경 변수 설정
1. 앱 대시보드에서 **"Settings"** 탭 클릭
2. **"Config Vars"** 섹션에서 **"Reveal Config Vars"** 클릭
3. 다음 환경 변수 추가:

   | Key | Value |
   |-----|-------|
   | `JWT_SECRET` | `your-super-secret-key-change-in-production` (강력한 랜덤 문자열) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `MONGODB_ATLAS_URL` | (선택적, 기본값 사용 시 생략 가능) |

4. 각 변수 추가 후 **"Add"** 클릭

### 1-6. 루트 디렉토리 설정 (중요!)
1. **"Settings"** 탭에서 **"Config Vars"** 아래로 스크롤
2. **"Buildpacks"** 섹션 확인
3. **"Settings"** 탭의 **"Config Vars"**에 다음 추가:

   | Key | Value |
   |-----|-------|
   | `PROJECT_PATH` | `server` |

   또는 Heroku가 자동으로 감지하도록 `server/package.json`이 루트에 있는지 확인

### 1-7. 배포 확인
1. **"Activity"** 탭에서 배포 진행 상황 확인
2. 배포 완료 후 **"Open app"** 버튼 클릭
3. 서버 URL 확인 (예: `https://mathchang-server.herokuapp.com`)
4. `https://your-app.herokuapp.com/api/health` 접속하여 응답 확인

### 1-8. 서버 URL 저장
배포된 서버 URL을 메모해두세요. 다음 단계에서 사용합니다.
예: `https://mathchang-server.herokuapp.com`

---

## 🚀 Step 2: 클라이언트 배포 (Vercel 웹 대시보드)

### 2-1. Vercel 계정 생성 및 로그인
1. https://vercel.com 접속
2. **"Sign Up"** 또는 **"Log In"** 클릭
3. GitHub 계정으로 로그인 (권장)

### 2-2. 새 프로젝트 생성
1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. GitHub 저장소 선택 또는 **"Import Git Repository"** 클릭
3. 저장소 선택 후 **"Import"** 클릭

### 2-3. 프로젝트 설정
다음 설정을 입력:

| 항목 | 값 |
|------|-----|
| **Project Name** | `mathchang-client` (또는 원하는 이름) |
| **Framework Preset** | `Vite` (자동 감지될 수 있음) |
| **Root Directory** | `client` ⚠️ **중요!** |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2-4. 환경 변수 설정
1. **"Environment Variables"** 섹션으로 스크롤
2. 다음 환경 변수 추가:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://your-app-name.herokuapp.com` (Step 1에서 받은 서버 URL) |

3. **"Add"** 클릭
4. **Production**, **Preview**, **Development** 모두 선택 (또는 Production만)

### 2-5. 배포 실행
1. 설정 완료 후 **"Deploy"** 버튼 클릭
2. 배포 진행 상황 확인
3. 배포 완료 후 **"Visit"** 버튼 클릭하여 사이트 확인

### 2-6. Vercel URL 확인
배포된 클라이언트 URL을 확인하세요.
예: `https://mathchang-client.vercel.app`

---

## 🔄 Step 3: 서버 CORS 설정 업데이트

클라이언트 배포 후 Vercel URL을 받았으므로, 서버 CORS 설정을 업데이트해야 합니다.

### 방법 1: 환경 변수로 설정 (권장)

1. Heroku 대시보드로 돌아가기
2. 앱 선택 → **"Settings"** 탭
3. **"Config Vars"** → **"Reveal Config Vars"**
4. 다음 환경 변수 추가:

   | Key | Value |
   |-----|-------|
   | `CLIENT_URL` | `https://mathchang-client.vercel.app` (실제 Vercel URL) |

5. **"Add"** 클릭
6. **"More"** → **"Restart all dynos"** 클릭하여 서버 재시작

### 방법 2: 코드에 직접 추가

`server/index.js` 파일 수정:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  'https://mathchang-client.vercel.app', // 실제 Vercel URL 추가
].filter(Boolean);
```

수정 후:
1. Git에 커밋 및 푸시
2. Heroku가 자동으로 재배포 (Automatic Deploys 활성화 시)
3. 또는 수동으로 **"Deploy"** 탭에서 **"Deploy Branch"** 클릭

---

## ✅ 배포 후 확인사항

### 서버 확인
1. `https://your-app.herokuapp.com/api/health` 접속
2. 응답 확인: `{"status":"OK","mongodb":"연결됨",...}`
3. 로그 확인: Heroku 대시보드 → **"More"** → **"View logs"**

### 클라이언트 확인
1. Vercel 배포 URL 접속
2. 브라우저 개발자 도구 (F12) → **Console** 탭 확인
3. **Network** 탭에서 API 요청 확인
4. 로그인/회원가입 테스트
5. 주요 기능 테스트

### 문제 해결
- **CORS 오류**: 서버 CORS 설정에 클라이언트 URL이 포함되어 있는지 확인
- **API 연결 실패**: `VITE_API_URL` 환경 변수가 올바른지 확인
- **빌드 실패**: Vercel 배포 로그 확인

---

## 📝 체크리스트

### 배포 전
- [x] Procfile 생성
- [x] vercel.json 생성
- [x] CORS 설정 수정
- [x] axiosConfig.js 수정
- [ ] GitHub 저장소에 코드 푸시
- [ ] .gitignore 확인 (node_modules, .env 제외)

### 서버 배포 (Heroku)
- [ ] Heroku 계정 생성/로그인
- [ ] 새 앱 생성
- [ ] GitHub 저장소 연결
- [ ] 환경 변수 설정 (JWT_SECRET, NODE_ENV 등)
- [ ] Root Directory 설정 (server 폴더)
- [ ] 배포 실행
- [ ] 서버 URL 확인 및 저장

### 클라이언트 배포 (Vercel)
- [ ] Vercel 계정 생성/로그인
- [ ] 새 프로젝트 생성
- [ ] GitHub 저장소 연결
- [ ] Root Directory: `client` 설정
- [ ] 환경 변수 설정 (VITE_API_URL)
- [ ] 배포 실행
- [ ] 클라이언트 URL 확인 및 저장

### 배포 후
- [ ] 서버 CORS에 클라이언트 URL 추가
- [ ] 서버 재시작
- [ ] 전체 기능 테스트
- [ ] 로그 확인

---

## 🔍 Heroku Root Directory 설정 방법

Heroku는 기본적으로 저장소 루트를 기준으로 배포합니다. 
`server` 폴더만 배포하려면:

### 방법 1: package.json 수정 (권장하지 않음)
루트에 `package.json`이 있어서 Heroku가 혼동할 수 있습니다.

### 방법 2: Heroku Buildpack 사용
1. **Settings** → **Buildpacks**
2. **"Add buildpack"** 클릭
3. 커스텀 buildpack 사용

### 방법 3: 서브디렉토리 배포 (가장 간단)
GitHub에 `server` 폴더만 별도 브랜치로 푸시하거나, 
Heroku가 자동으로 `package.json`을 찾도록 합니다.

**실제로는**: Heroku는 저장소 루트에서 `package.json`을 찾고, 
`package.json`의 `"start": "cd server && node index.js"` 스크립트를 실행합니다.

하지만 더 확실한 방법은:
1. Heroku 앱 설정에서 **"Config Vars"**에 추가하지 말고
2. `server/package.json`의 `"start"` 스크립트가 `node index.js`인지 확인
3. Heroku는 `server` 폴더의 `package.json`을 자동으로 찾습니다

**확인 방법**: Heroku 배포 로그에서 `npm start` 실행 경로 확인

---

## 💡 팁

1. **자동 배포 설정**: GitHub에 푸시할 때마다 자동 배포되도록 설정 가능
2. **환경 변수 관리**: 민감한 정보는 절대 코드에 포함하지 말고 환경 변수로 관리
3. **로그 확인**: 문제 발생 시 Heroku와 Vercel 로그를 확인하세요
4. **도메인 연결**: 커스텀 도메인 연결도 가능합니다

---

## 🆘 문제 해결

### Heroku 배포 실패
- **"No app.json found"**: Procfile이 올바른 위치에 있는지 확인
- **"Module not found"**: package.json의 dependencies 확인
- **"Port already in use"**: Heroku가 자동으로 PORT 환경 변수를 설정하므로 코드에서 `process.env.PORT` 사용

### Vercel 배포 실패
- **"Build failed"**: Root Directory가 `client`로 설정되었는지 확인
- **"Module not found"**: package.json 확인
- **"API not found"**: VITE_API_URL 환경 변수 확인

### CORS 오류
- 서버 CORS 설정에 클라이언트 URL이 포함되어 있는지 확인
- 브라우저 콘솔에서 정확한 오류 메시지 확인

