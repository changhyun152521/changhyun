const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

// MongoDB 연결
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mathchang');
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

// 기존 강좌 데이터에서 thumbnail과 profileImage 필드 제거
const removeThumbnailAndProfile = async () => {
  try {
    console.log('기존 강좌 데이터에서 thumbnail과 profileImage 필드 제거 시작...');
    
    const result = await Course.updateMany(
      {},
      {
        $unset: {
          thumbnail: '',
          profileImage: ''
        }
      }
    );
    
    console.log(`총 ${result.modifiedCount}개의 강좌에서 thumbnail과 profileImage 필드가 제거되었습니다.`);
    console.log('작업 완료!');
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
  }
};

// 스크립트 실행
const run = async () => {
  await connectDB();
  await removeThumbnailAndProfile();
  process.exit(0);
};

run();

