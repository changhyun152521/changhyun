const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '제목은 필수입니다'],
      trim: true,
    },
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
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'video', 'file'],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        default: '',
      },
      originalName: {
        type: String,
        default: '',
      },
    }],
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 생성일 기준 최신순 정렬 인덱스
noticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);

