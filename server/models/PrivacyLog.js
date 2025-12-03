const mongoose = require('mongoose');

const privacyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['생성', '조회', '수정', '삭제', '제공', '열람'],
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    accessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 인덱스 추가 (조회 성능 향상)
privacyLogSchema.index({ userId: 1, createdAt: -1 });
privacyLogSchema.index({ action: 1, createdAt: -1 });
privacyLogSchema.index({ accessedBy: 1, createdAt: -1 });

const PrivacyLog = mongoose.model('PrivacyLog', privacyLogSchema);

module.exports = PrivacyLog;

