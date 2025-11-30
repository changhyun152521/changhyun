/**
 * 기존 사용자 데이터에 userType 필드 추가 스크립트
 * 실행 방법: node scripts/addUserType.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const addUserTypeToExistingUsers = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mathchang');
    console.log('MongoDB 연결 성공');

    // userType이 없는 모든 사용자 찾기
    const usersWithoutUserType = await User.find({
      $or: [
        { userType: { $exists: false } },
        { userType: null },
        { userType: '' }
      ]
    });

    console.log(`userType이 없는 사용자 수: ${usersWithoutUserType.length}`);

    if (usersWithoutUserType.length === 0) {
      console.log('모든 사용자가 이미 userType을 가지고 있습니다.');
      await mongoose.connection.close();
      return;
    }

    // 각 사용자에 userType 추가 (기본값: '학생')
    let updatedCount = 0;
    for (const user of usersWithoutUserType) {
      user.userType = '학생';
      user.isAdmin = false; // 기본값으로 false 설정
      await user.save();
      updatedCount++;
      console.log(`사용자 ${user.userId}에 userType '학생' 추가 완료`);
    }

    console.log(`\n총 ${updatedCount}명의 사용자에 userType이 추가되었습니다.`);
    console.log('기본값으로 "학생"이 설정되었습니다.');
    console.log('필요하면 MongoDB Compass에서 수동으로 변경할 수 있습니다.');

    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// 스크립트 실행
addUserTypeToExistingUsers();

