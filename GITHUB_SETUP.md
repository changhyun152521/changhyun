# GitHub 업로드 가이드

## 📋 준비 완료된 파일

- ✅ 루트 `.gitignore` 생성 완료
- ✅ `server/.gitignore` 확인 완료
- ✅ `client/.gitignore` 확인 완료
- ✅ `server/Procfile` 생성 완료
- ✅ `client/vercel.json` 확인 완료
- ✅ `Procfile` (루트) 생성 완료
- ✅ `README.md` 업데이트 완료

## 🚀 GitHub에 업로드하는 방법

### 방법 1: 명령어로 업로드 (권장)

프로젝트 루트 디렉토리에서 다음 명령어를 순서대로 실행하세요:

```bash
# 1. Git 저장소 초기화
git init

# 2. 모든 파일 추가
git add .

# 3. 첫 커밋 생성
git commit -m "Initial commit: MathChang project"

# 4. 메인 브랜치로 이름 변경
git branch -M main

# 5. 원격 저장소 연결
git remote add origin https://github.com/changhyun152521/mathchang-homepage.git

# 6. GitHub에 푸시
git push -u origin main
```

### 방법 2: GitHub Desktop 사용

1. GitHub Desktop 설치: https://desktop.github.com/
2. GitHub Desktop 실행
3. "File" → "Add Local Repository"
4. 프로젝트 폴더 선택
5. "Publish repository" 클릭
6. Repository name: `mathchang-homepage`
7. "Publish repository" 클릭

### 방법 3: VS Code 사용

1. VS Code에서 프로젝트 열기
2. Source Control 탭 (Ctrl+Shift+G) 클릭
3. "Initialize Repository" 클릭
4. 모든 파일 스테이징
5. 커밋 메시지 입력: "Initial commit: MathChang project"
6. 커밋 버튼 클릭
7. "..." 메뉴 → "Remote" → "Add Remote"
8. Remote URL: `https://github.com/changhyun152521/mathchang-homepage.git`
9. Remote name: `origin`
10. "..." 메뉴 → "Push" → "Push to origin"

## ⚠️ 주의사항

### 업로드 전 확인사항

1. **민감한 정보 제거 확인**
   - `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
   - 비밀번호, API 키 등이 코드에 하드코딩되어 있지 않은지 확인

2. **불필요한 파일 제거**
   - `node_modules/` 폴더는 자동으로 제외됩니다
   - 빌드 결과물 (`dist/`, `build/`)도 제외됩니다

3. **환경 변수 설정**
   - GitHub에 업로드 후 배포 시 환경 변수를 별도로 설정해야 합니다
   - Heroku와 Vercel에서 환경 변수를 설정하세요

## 📝 업로드 후 작업

### 1. Heroku 배포 준비
- Heroku 대시보드에서 GitHub 저장소 연결
- 환경 변수 설정 (JWT_SECRET, NODE_ENV 등)

### 2. Vercel 배포 준비
- Vercel 대시보드에서 GitHub 저장소 연결
- Root Directory: `client` 설정
- 환경 변수 설정 (VITE_API_URL)

자세한 배포 가이드는 `DEPLOYMENT_GUIDE_WEB.md` 파일을 참고하세요.

## 🔍 문제 해결

### "remote origin already exists" 오류
```bash
git remote remove origin
git remote add origin https://github.com/changhyun152521/mathchang-homepage.git
```

### "Authentication failed" 오류
- GitHub Personal Access Token 사용 필요
- 또는 SSH 키 설정 필요

### 파일이 너무 큰 경우
- `.gitignore`에 큰 파일이 포함되어 있는지 확인
- Git LFS 사용 고려

