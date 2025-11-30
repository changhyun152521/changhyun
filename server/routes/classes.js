const express = require('express');
const router = express.Router();
const classesController = require('../controllers/classesController');

// 모든 반 조회 (GET /api/classes)
router.get('/', classesController.getAllClasses);

// 새 반 생성 (POST /api/classes)
router.post('/', classesController.createClass);

// 특정 반 조회 (GET /api/classes/:id)
router.get('/:id', classesController.getClassById);

// 반 정보 수정 (PUT /api/classes/:id)
router.put('/:id', classesController.updateClass);

// 반 삭제 (DELETE /api/classes/:id)
router.delete('/:id', classesController.deleteClass);

module.exports = router;

