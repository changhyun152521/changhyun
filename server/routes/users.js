const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 라우트 등록 확인
console.log('=== Users 라우트 등록 시작 ===');
console.log('findUserId 함수 타입:', typeof usersController.findUserId);
console.log('resetPassword 함수 타입:', typeof usersController.resetPassword);
console.log('login 함수 타입:', typeof usersController.login);

// 특정 경로 라우트를 먼저 정의 (동적 라우트보다 먼저)
// 로그인 (POST /api/users/login)
router.post('/login', asyncHandler(usersController.login));

// 아이디 찾기 (POST /api/users/find-userid)
router.post('/find-userid', asyncHandler(usersController.findUserId));

// 비밀번호 재설정 (POST /api/users/reset-password)
router.post('/reset-password', asyncHandler(usersController.resetPassword));

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
