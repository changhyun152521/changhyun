const express = require('express');
const router = express.Router();
const parentStudentLinkController = require('../controllers/parentStudentLinkController');

// async 에러를 자동으로 catch하는 헬퍼 함수
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 학부모의 연동된 학생 목록 조회 (GET /api/parent-student-links/parent/:parentId)
router.get('/parent/:parentId', asyncHandler(parentStudentLinkController.getLinkedStudents));

// 학생의 연동된 학부모 목록 조회 (GET /api/parent-student-links/student/:studentId)
router.get('/student/:studentId', asyncHandler(parentStudentLinkController.getLinkedParents));

// 연동 관계 생성 (POST /api/parent-student-links)
router.post('/', asyncHandler(parentStudentLinkController.createLink));

// 연동 관계 삭제 (DELETE /api/parent-student-links/:linkId)
router.delete('/:linkId', asyncHandler(parentStudentLinkController.deleteLink));

// parentId와 studentId로 연동 관계 삭제 (DELETE /api/parent-student-links)
router.delete('/', asyncHandler(parentStudentLinkController.deleteLinkByIds));

module.exports = router;

