const express = require('express');
const router = express.Router();
const previewCoursesController = require('../controllers/previewCoursesController');
const { protect, authorize } = require('../middleware/auth');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 모든 맛보기강좌 조회 (GET /api/preview-courses) - 모든 사용자 접근 가능 (인증 불필요)
router.get('/', asyncHandler(previewCoursesController.getAllPreviewCourses));

// 특정 맛보기강좌 조회 (GET /api/preview-courses/:id) - 모든 사용자 접근 가능 (인증 불필요)
router.get('/:id', asyncHandler(previewCoursesController.getPreviewCourseById));

// 새 맛보기강좌 생성 (POST /api/preview-courses) - 관리자(강사)만 접근 가능
router.post('/', protect, authorize('강사'), asyncHandler(previewCoursesController.createPreviewCourse));

// 맛보기강좌 정보 수정 (PUT /api/preview-courses/:id) - 관리자(강사)만 접근 가능
router.put('/:id', protect, authorize('강사'), asyncHandler(previewCoursesController.updatePreviewCourse));

// 맛보기강좌 삭제 (DELETE /api/preview-courses/:id) - 관리자(강사)만 접근 가능
router.delete('/:id', protect, authorize('강사'), asyncHandler(previewCoursesController.deletePreviewCourse));

module.exports = router;

