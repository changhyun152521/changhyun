const mongoose = require('mongoose');

const studentRecordSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, '일시는 필수입니다'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '학생 ID는 필수입니다'],
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, '반 ID는 필수입니다'],
      index: true,
    },
    attendance: {
      type: Boolean,
      default: false,
    },
    assignment: {
      type: Boolean,
      default: false,
    },
    dailyTestScore: {
      type: String,
      default: null,
    },
    monthlyEvaluationScore: {
      type: String,
      default: null,
    },
    hasClinic: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 같은 학생의 같은 날짜에 중복 레코드가 생성되지 않도록 인덱스 추가
studentRecordSchema.index({ studentId: 1, date: 1, classId: 1 }, { unique: true });

const StudentRecord = mongoose.model('StudentRecord', studentRecordSchema);

module.exports = StudentRecord;

