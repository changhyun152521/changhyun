const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const { authenticate } = require('../middleware/auth');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    console.log(`[asyncHandler] 함수 호출: ${fn.name || 'anonymous'}`);
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error(`[asyncHandler] 에러 발생:`, error);
      next(error);
    });
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
router.post('/', (req, res, next) => {
  console.log('\n========================================');
  console.log('=== POST /api/courses 라우트 핸들러 실행 ===');
  console.log('========================================');
  console.log('요청 본문:', JSON.stringify(req.body, null, 2));
  console.log('createCourse 함수 타입:', typeof coursesController.createCourse);
  console.log('createCourse 함수 존재:', !!coursesController.createCourse);
  
  if (!coursesController.createCourse) {
    console.error('=== createCourse 함수가 존재하지 않음 ===');
    return res.status(500).json({
      success: false,
      error: 'createCourse 함수를 찾을 수 없습니다',
    });
  }
  
  try {
    asyncHandler(coursesController.createCourse)(req, res, next);
  } catch (error) {
    console.error('=== 라우트 핸들러에서 에러 발생 ===');
    console.error('에러:', error);
    next(error);
  }
});

// 강좌 정보 수정 (PUT /api/courses/:id)
router.put('/:id', asyncHandler(coursesController.updateCourse));

// 강좌 삭제 (DELETE /api/courses/:id)
router.delete('/:id', asyncHandler(coursesController.deleteCourse));

module.exports = router;

