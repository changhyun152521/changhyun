const express = require('express');
const router = express.Router();
const studentRecordsController = require('../controllers/studentRecordsController');
const { protect, authorize } = require('../middleware/auth');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 모든 학생 기록 조회 (GET /api/student-records)
// 쿼리 파라미터: classId, studentId, date
router.get('/', protect, authorize('강사'), asyncHandler(studentRecordsController.getAllStudentRecords));

// 학생이 자신의 기록 조회 (GET /api/student-records/my-records)
// 쿼리 파라미터: classId, date
router.get('/my-records', protect, asyncHandler(studentRecordsController.getMyStudentRecords));

// 특정 학생 기록 조회 (GET /api/student-records/:id)
router.get('/:id', protect, authorize('강사'), asyncHandler(studentRecordsController.getStudentRecordById));

// 새 학생 기록 생성 (POST /api/student-records) - 관리자(강사)만 접근 가능
router.post('/', protect, authorize('강사'), asyncHandler(studentRecordsController.createStudentRecord));

// 학생 기록 수정 (PUT /api/student-records/:id) - 관리자(강사)만 접근 가능
router.put('/:id', protect, authorize('강사'), asyncHandler(studentRecordsController.updateStudentRecord));

// 학생 기록 삭제 (DELETE /api/student-records/:id) - 관리자(강사)만 접근 가능
router.delete('/:id', protect, authorize('강사'), asyncHandler(studentRecordsController.deleteStudentRecord));

module.exports = router;

