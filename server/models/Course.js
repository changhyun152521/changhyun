const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU는 필수입니다'],
      unique: true,
      trim: true,
      index: true,
    },
    courseName: {
      type: String,
      required: [true, '강좌명은 필수입니다'],
      trim: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '강사는 필수입니다'],
    },
    instructorName: {
      type: String,
      required: [true, '강사명은 필수입니다'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, '학년은 필수입니다'],
      enum: {
        values: ['중1', '중2', '중3', '고1', '고2', '고3/N수'],
        message: '학년은 중1, 중2, 중3, 고1, 고2, 고3/N수 중 하나여야 합니다',
      },
    },
    courseCount: {
      type: Number,
      required: [true, '강좌 수는 필수입니다'],
      min: [0, '강좌 수는 0 이상이어야 합니다'],
    },
    textbook: {
      type: String,
      required: [true, '교재는 필수입니다'],
      trim: true,
    },
    textbookType: {
      type: String,
      enum: {
        values: ['자체교재', '시중교재'],
        message: '교재 유형은 자체교재, 시중교재 중 하나여야 합니다',
      },
      trim: true,
    },
    courseStatus: {
      type: String,
      enum: {
        values: ['완강', '진행중'],
        message: '강좌 상태는 완강, 진행중 중 하나여야 합니다',
      },
      trim: true,
    },
    courseType: {
      type: String,
      enum: {
        values: ['정규', '특강'],
        message: '강좌 유형은 정규, 특강 중 하나여야 합니다',
      },
      trim: true,
    },
    courseRange: {
      type: String,
      trim: true,
    },
    courseDescription: {
      type: String,
      trim: true,
    },
    lectures: [
      {
        lectureNumber: {
          type: Number,
          required: [true, '회차는 필수입니다'],
          min: [1, '회차는 최소 1 이상이어야 합니다'],
        },
        lectureTitle: {
          type: String,
          required: [true, '영상제목은 필수입니다'],
          trim: true,
        },
        duration: {
          type: String,
          trim: true,
        },
        videoLink: {
          type: String,
          required: [true, '영상링크는 필수입니다'],
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// sku 인덱스는 unique: true로 이미 생성되므로 별도 인덱스 불필요

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;

