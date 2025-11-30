const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: [true, '구분은 필수입니다'],
      enum: {
        values: ['중1', '중2', '중3', '고1', '고2', '고3/N수'],
        message: '구분은 중1, 중2, 중3, 고1, 고2, 고3/N수 중 하나여야 합니다',
      },
    },
    className: {
      type: String,
      required: [true, '반명은 필수입니다'],
      trim: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '담당강사는 필수입니다'],
    },
    instructorName: {
      type: String,
      required: [true, '강사명은 필수입니다'],
      trim: true,
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }],
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 구분과 반명의 조합이 유일하도록 인덱스 추가
classSchema.index({ grade: 1, className: 1 }, { unique: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;

