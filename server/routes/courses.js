const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const { authenticate } = require('../middleware/auth');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 내강좌 조회 (GET /api/courses/my-courses) - 인증 필요
router.get('/my-courses', authenticate, asyncHandler(coursesController.getMyCourses));

// 모든 강좌 조회 (GET /api/courses)
router.get('/', asyncHandler(coursesController.getAllCourses));

// SKU로 강좌 조회 (GET /api/courses/sku/:sku) - 동적 라우트보다 먼저 정의
router.get('/sku/:sku', asyncHandler(coursesController.getCourseBySku));

// 특정 강좌 조회 (GET /api/courses/:id) - 동적 라우트는 마지막에
router.get('/:id', asyncHandler(coursesController.getCourseById));

// 새 강좌 생성 (POST /api/courses)
router.post('/', asyncHandler(coursesController.createCourse));

// 강좌 정보 수정 (PUT /api/courses/:id)
router.put('/:id', asyncHandler(coursesController.updateCourse));

// 강좌 삭제 (DELETE /api/courses/:id)
router.delete('/:id', asyncHandler(coursesController.deleteCourse));

module.exports = router;

