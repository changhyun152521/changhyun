const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const usersController = require('../controllers/usersController');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Rate Limiting 설정
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: {
    success: false,
    error: '로그인 시도 횟수가 초과되었습니다. 15분 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 최대 3회 시도
  message: {
    success: false,
    error: '비밀번호 재설정 요청 횟수가 초과되었습니다. 1시간 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const findUserIdLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: {
    success: false,
    error: '아이디 찾기 요청 횟수가 초과되었습니다. 15분 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 특정 경로 라우트를 먼저 정의 (동적 라우트보다 먼저)
// 로그인 (POST /api/users/login)
router.post('/login', loginLimiter, asyncHandler(usersController.login));

// 아이디 찾기 (POST /api/users/find-userid)
router.post('/find-userid', findUserIdLimiter, asyncHandler(usersController.findUserId));

// 비밀번호 재설정 (POST /api/users/reset-password)
router.post('/reset-password', passwordResetLimiter, asyncHandler(usersController.resetPassword));

// userId로 유저 조회 (GET /api/users/userId/:userId)
router.get('/userId/:userId', usersController.getUserByUserId);

// 모든 유저 조회 (GET /api/users)
router.get('/', usersController.getAllUsers);

// 관리자용 유저 생성 (POST /api/users/admin) - 강사 포함 가능
router.post('/admin', usersController.createUserByAdmin);

// 새 유저 생성 (POST /api/users) - 일반 회원가입용
router.post('/', usersController.createUser);

// 유저 연동 (PUT /api/users/:id/link) - 동적 라우트보다 먼저 정의
router.put('/:id/link', usersController.linkUser);

// 유저 연동 해지 (PUT /api/users/:id/unlink) - 동적 라우트보다 먼저 정의
router.put('/:id/unlink', usersController.unlinkUser);

// 특정 유저 조회 (GET /api/users/:id) - 동적 라우트는 마지막에
router.get('/:id', usersController.getUserById);

// 유저 정보 수정 (PUT /api/users/:id)
router.put('/:id', usersController.updateUser);

// 유저 삭제 (DELETE /api/users/:id)
router.delete('/:id', usersController.deleteUser);

module.exports = router;
