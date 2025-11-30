const mongoose = require('mongoose');

const attendanceCommentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, '내용은 필수입니다'],
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '작성자는 필수입니다'],
    },
    authorName: {
      type: String,
      required: [true, '작성자명은 필수입니다'],
      trim: true,
    },
    courseName: {
      type: String,
      trim: true,
      default: '',
    },
    className: {
      type: String,
      trim: true,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: true, // 기본값은 공개
    },
    reply: {
      content: {
        type: String,
        trim: true,
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      authorName: {
        type: String,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 생성일 기준 최신순 정렬 인덱스
attendanceCommentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AttendanceComment', attendanceCommentSchema);

