const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const bcrypt = require('bcrypt');
require('dotenv').config();

// 기존 학생 회원들에게 학부모 계정 연동
async function linkParentsToStudents() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mathchang');
    console.log('MongoDB 연결 성공');

    // 모든 학생 회원 조회
    const students = await User.find({ userType: '학생' });
    console.log(`총 ${students.length}명의 학생 회원을 찾았습니다.`);

    let createdCount = 0;
    let existingCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        // 학부모 계정이 이미 존재하는지 확인
        const parentUserId = student.parentContact;
        const parentEmail = `${student.parentContact}@mathchang.com`;

        const existingParent = await User.findOne({
          $or: [
            { userId: parentUserId },
            { email: parentEmail }
          ]
        });

        if (existingParent) {
          console.log(`학생 ${student.name}(${student.userId})의 학부모 계정이 이미 존재합니다: ${existingParent.userId}`);
          existingCount++;

          // 학부모가 학생과 같은 반에 있는지 확인하고 없으면 추가
          const studentClasses = await Class.find({ students: student._id });
          for (const classItem of studentClasses) {
            const isParentInClass = classItem.students.some(
              (id) => id.toString() === existingParent._id.toString()
            );
            if (!isParentInClass) {
              await Class.findByIdAndUpdate(classItem._id, {
                $addToSet: { students: existingParent._id }
              });
              console.log(`  → 학부모 ${existingParent.name}을 반 ${classItem.className}에 추가했습니다.`);
            }
          }
          continue;
        }

        // 부모님 연락처가 없으면 스킵
        if (!student.parentContact || student.parentContact.trim() === '') {
          console.log(`학생 ${student.name}(${student.userId})의 부모님 연락처가 없어 스킵합니다.`);
          errorCount++;
          continue;
        }

        // 학부모 계정 생성
        const parentPassword = '000000';
        const saltRounds = 10;
        const hashedParentPassword = await bcrypt.hash(parentPassword, saltRounds);

        const parentUser = new User({
          userId: parentUserId,
          password: hashedParentPassword,
          name: `${student.name}부모님`,
          email: parentEmail,
          phone: student.parentContact,
          schoolName: student.schoolName,
          studentContact: student.studentContact,
          parentContact: student.parentContact,
          userType: '학부모',
          isAdmin: false,
        });

        const savedParent = await parentUser.save();
        console.log(`학부모 계정 생성 완료: ${savedParent.name}(${savedParent.userId}) - 학생: ${student.name}(${student.userId})`);
        createdCount++;

        // 학생이 속한 모든 반에 학부모도 추가
        const studentClasses = await Class.find({ students: student._id });
        for (const classItem of studentClasses) {
          await Class.findByIdAndUpdate(classItem._id, {
            $addToSet: { students: savedParent._id }
          });
          console.log(`  → 학부모를 반 ${classItem.className}에 추가했습니다.`);
        }

      } catch (error) {
        console.error(`학생 ${student.name}(${student.userId})의 학부모 계정 생성 중 오류:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== 작업 완료 ===');
    console.log(`새로 생성된 학부모 계정: ${createdCount}개`);
    console.log(`이미 존재하는 학부모 계정: ${existingCount}개`);
    console.log(`오류 발생: ${errorCount}개`);

    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
    process.exit(0);

  } catch (error) {
    console.error('스크립트 실행 오류:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// 스크립트 실행
linkParentsToStudents();

