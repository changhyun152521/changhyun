const mongoose = require('mongoose');

const classRecordSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, '일시는 필수입니다'],
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, '반 ID는 필수입니다'],
      index: true,
    },
    className: {
      type: String,
      required: [true, '반명은 필수입니다'],
      trim: true,
    },
    progress: {
      type: String,
      trim: true,
      default: '',
    },
    assignment: {
      type: String,
      trim: true,
      default: '',
    },
    hasVideo: {
      type: Boolean,
      default: false,
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    mainUnit: {
      type: String,
      trim: true,
      default: '',
    },
    subUnit: {
      type: String,
      trim: true,
      default: '',
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

// 같은 반의 같은 날짜에 중복 레코드가 생성되지 않도록 인덱스 추가
classRecordSchema.index({ classId: 1, date: 1 }, { unique: true });

const ClassRecord = mongoose.model('ClassRecord', classRecordSchema);

module.exports = ClassRecord;

