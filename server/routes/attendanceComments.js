const express = require('express');
const router = express.Router();
const attendanceCommentsController = require('../controllers/attendanceCommentsController');
const { protect } = require('../middleware/auth');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 모든 댓글 조회 (인증 불필요 - 비회원도 볼 수 있음)
router.get('/', asyncHandler(attendanceCommentsController.getAllComments));

// 댓글 생성 (인증 필요)
router.post('/', protect, asyncHandler(attendanceCommentsController.createComment));

// 댓글 수정 (인증 필요)
router.put('/:id', protect, asyncHandler(attendanceCommentsController.updateComment));

// 댓글 삭제 (인증 필요)
router.delete('/:id', protect, asyncHandler(attendanceCommentsController.deleteComment));

// 답글 작성 (인증 필요, 관리자만)
router.post('/:id/reply', protect, asyncHandler(attendanceCommentsController.addReply));

// 답글 수정 (인증 필요, 관리자만)
router.put('/:id/reply', protect, asyncHandler(attendanceCommentsController.updateReply));

// 답글 삭제 (인증 필요, 관리자만)
router.delete('/:id/reply', protect, asyncHandler(attendanceCommentsController.deleteReply));

module.exports = router;

