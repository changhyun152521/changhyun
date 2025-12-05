const mongoose = require('mongoose');

const parentStudentLinkSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '학부모 ID는 필수입니다'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '학생 ID는 필수입니다'],
      index: true,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// parentId와 studentId의 조합이 유일하도록 설정
parentStudentLinkSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

const ParentStudentLink = mongoose.model('ParentStudentLink', parentStudentLinkSchema);

module.exports = ParentStudentLink;

