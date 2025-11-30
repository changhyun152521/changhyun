const express = require('express');
const router = express.Router();
const noticesController = require('../controllers/noticesController');
const { protect, authorize } = require('../middleware/auth');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 모든 공지사항 조회 (GET /api/notices) - 인증 불필요
router.get('/', asyncHandler(noticesController.getAllNotices));

// 특정 공지사항 조회 (GET /api/notices/:id) - 인증 불필요
router.get('/:id', asyncHandler(noticesController.getNoticeById));

// 새 공지사항 생성 (POST /api/notices) - 관리자만
router.post('/', protect, authorize('강사'), asyncHandler(noticesController.createNotice));

// 공지사항 수정 (PUT /api/notices/:id) - 관리자만
router.put('/:id', protect, authorize('강사'), asyncHandler(noticesController.updateNotice));

// 공지사항 삭제 (DELETE /api/notices/:id) - 관리자만
router.delete('/:id', protect, authorize('강사'), asyncHandler(noticesController.deleteNotice));

module.exports = router;

