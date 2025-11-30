const mongoose = require('mongoose');

const previewCourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '강의 제목은 필수입니다'],
      trim: true,
    },
    videoLink: {
      type: String,
      required: [true, '유튜브 링크는 필수입니다'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
        },
        message: '올바른 YouTube 링크 형식이 아닙니다',
      },
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

const PreviewCourse = mongoose.model('PreviewCourse', previewCourseSchema);

module.exports = PreviewCourse;

