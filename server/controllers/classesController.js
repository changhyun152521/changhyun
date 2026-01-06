const Class = require('../models/Class');
const User = require('../models/User');
const Course = require('../models/Course');

// 모든 반 조회
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('instructorId', 'userId name email userType')
      .populate('students', 'userId name email userType schoolName')
      .populate('courses', 'sku courseName instructorName grade courseCount courseStatus')
      .sort({ createdAt: -1 }); // 생성일 기준 최신순 정렬
    
    // 강사 이름 동기화: populate된 instructorId의 name과 Class의 instructorName이 다르면 업데이트
    for (const classItem of classes) {
      if (classItem.instructorId && classItem.instructorId.name && classItem.instructorName !== classItem.instructorId.name) {
        classItem.instructorName = classItem.instructorId.name;
        await Class.findByIdAndUpdate(classItem._id, { instructorName: classItem.instructorId.name });
      }
    }
    
    res.json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error('반 목록 가져오기 오류:', error);
    res.status(500).json({
      success: false,
      error: '반 목록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 특정 반 조회 (ID로)
exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('instructorId', 'userId name email userType')
      .populate({
        path: 'students',
        select: 'userId name email userType schoolName studentContact parentContact',
        options: { sort: { name: 1 } }  // 이름 가나다순 정렬
      })
      .populate('courses', 'sku courseName instructorName grade courseCount courseStatus thumbnail');
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: '반을 찾을 수 없습니다',
      });
    }

    // 강사 이름 동기화: populate된 instructorId의 name과 Class의 instructorName이 다르면 업데이트
    if (classData.instructorId && classData.instructorId.name && classData.instructorName !== classData.instructorId.name) {
      classData.instructorName = classData.instructorId.name;
      await Class.findByIdAndUpdate(classData._id, { instructorName: classData.instructorId.name });
    }

    res.json({
      success: true,
      data: classData,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 반 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '반을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 새 반 생성
exports.createClass = async (req, res) => {
  try {
    const {
      grade,
      className,
      instructorId,
      instructorName,
      students, // 학생 ID 배열
      courses, // 강좌 ID 배열
    } = req.body;

    // 필수 필드 검증
    if (!grade || !className || !instructorId || !instructorName) {
      return res.status(400).json({
        success: false,
        error: '모든 필수 필드를 입력해주세요',
      });
    }

    // 구분 유효성 검증
    const validGrades = ['중1', '중2', '중3', '고1', '고2', '고3/N수'];
    if (!validGrades.includes(grade)) {
      return res.status(400).json({
        success: false,
        error: '구분은 중1, 중2, 중3, 고1, 고2, 고3/N수 중 하나여야 합니다',
      });
    }

    // 강사 유효성 검증 (강사인지 확인)
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        error: '강사를 찾을 수 없습니다',
      });
    }

    if (instructor.userType !== '강사') {
      return res.status(400).json({
        success: false,
        error: '강사 권한이 있는 사용자만 담당강사로 지정할 수 있습니다',
      });
    }

    // 강사명 일치 확인
    if (instructor.name !== instructorName.trim()) {
      return res.status(400).json({
        success: false,
        error: '강사명이 일치하지 않습니다',
      });
    }

    // 구분과 반명 조합 중복 체크
    const existingClass = await Class.findOne({
      grade,
      className: className.trim(),
    });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        error: '이미 존재하는 반입니다 (같은 구분과 반명)',
      });
    }

    // 학생 유효성 검증
    let studentIds = students && Array.isArray(students) ? students : [];
    if (studentIds.length > 0) {
      const validStudents = await User.find({
        _id: { $in: studentIds },
        userType: { $in: ['학생', '학부모'] }, // 학생 또는 학부모만 가능
      });
      
      if (validStudents.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          error: '일부 학생을 찾을 수 없거나 유효하지 않은 사용자 유형입니다',
        });
      }

      // 학생인 경우 연동된 학부모도 추가
      const studentUsers = validStudents.filter(u => u.userType === '학생');
      const finalStudentIds = [...studentIds];
      
      for (const student of studentUsers) {
        if (student.parentContact) {
          try {
            // 연동된 학부모 계정 찾기 (부모님 연락처가 학부모 userId)
            const parentUser = await User.findOne({
              userId: student.parentContact,
              userType: '학부모',
            });

            if (parentUser && !finalStudentIds.includes(parentUser._id.toString())) {
              finalStudentIds.push(parentUser._id);
              console.log(`학생 ${student.userId}의 연동된 학부모 ${parentUser.userId}를 반에 추가합니다.`);
            }
          } catch (parentError) {
            console.error(`학생 ${student.userId}의 연동된 학부모 찾기 오류:`, parentError);
            // 학부모 찾기 실패해도 계속 진행
          }
        }
      }
      
      studentIds = finalStudentIds;
    }

    // 강좌 유효성 검증
    const courseIds = courses && Array.isArray(courses) ? courses : [];
    if (courseIds.length > 0) {
      const validCourses = await Course.find({
        _id: { $in: courseIds },
      });
      
      if (validCourses.length !== courseIds.length) {
        return res.status(400).json({
          success: false,
          error: '일부 강좌를 찾을 수 없습니다',
        });
      }
    }

    const newClass = new Class({
      grade,
      className: className.trim(),
      instructorId,
      instructorName: instructorName.trim(),
      students: studentIds,
      courses: courseIds,
    });

    const savedClass = await newClass.save();

    // populate하여 반환
    const populatedClass = await Class.findById(savedClass._id)
      .populate('instructorId', 'userId name email userType')
      .populate('students', 'userId name email userType schoolName studentContact parentContact')
      .populate('courses', 'sku courseName instructorName grade courseCount courseStatus thumbnail');

    res.status(201).json({
      success: true,
      message: '반이 성공적으로 생성되었습니다',
      data: populatedClass,
    });
  } catch (error) {
    console.error('반 생성 오류:', error);
    
    // Mongoose 유효성 검사 오류 처리
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '이미 존재하는 반입니다 (같은 구분과 반명)',
      });
    }
    res.status(500).json({
      success: false,
      error: '반 생성 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 반 정보 수정
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      grade,
      className,
      instructorId,
      instructorName,
      students, // 학생 ID 배열
      courses, // 강좌 ID 배열
    } = req.body;

    const updateData = {};

    // 구분 변경
    if (grade) {
      const validGrades = ['중1', '중2', '중3', '고1', '고2', '고3/N수'];
      if (!validGrades.includes(grade)) {
        return res.status(400).json({
          success: false,
          error: '구분은 중1, 중2, 중3, 고1, 고2, 고3/N수 중 하나여야 합니다',
        });
      }
      updateData.grade = grade;
    }

    // 반명 변경
    if (className) {
      updateData.className = className.trim();
    }

    // 담당강사 변경
    if (instructorId) {
      // 강사 유효성 검증
      const instructor = await User.findById(instructorId);
      if (!instructor) {
        return res.status(404).json({
          success: false,
          error: '강사를 찾을 수 없습니다',
        });
      }

      if (instructor.userType !== '강사') {
        return res.status(400).json({
          success: false,
          error: '강사 권한이 있는 사용자만 담당강사로 지정할 수 있습니다',
        });
      }

      updateData.instructorId = instructorId;
    }

    if (instructorName) {
      updateData.instructorName = instructorName.trim();
    }

    // 학생 배열 업데이트
    if (students !== undefined) {
      const studentIds = Array.isArray(students) ? students : [];
      
      if (studentIds.length > 0) {
        // 학생 유효성 검증
        const validStudents = await User.find({
          _id: { $in: studentIds },
          userType: { $in: ['학생', '학부모'] }, // 학생 또는 학부모만 가능
        });
        
        if (validStudents.length !== studentIds.length) {
          return res.status(400).json({
            success: false,
            error: '일부 학생을 찾을 수 없거나 유효하지 않은 사용자 유형입니다',
          });
        }

        // 학생인 경우 연동된 학부모도 추가
        const finalStudentIds = [...studentIds];
        const studentUsers = validStudents.filter(u => u.userType === '학생');
        
        for (const student of studentUsers) {
          if (student.parentContact) {
            try {
              // 연동된 학부모 계정 찾기 (부모님 연락처가 학부모 userId)
              const parentUser = await User.findOne({
                userId: student.parentContact,
                userType: '학부모',
              });

              if (parentUser && !finalStudentIds.includes(parentUser._id.toString())) {
                finalStudentIds.push(parentUser._id);
                console.log(`학생 ${student.userId}의 연동된 학부모 ${parentUser.userId}를 반에 추가합니다.`);
              }
            } catch (parentError) {
              console.error(`학생 ${student.userId}의 연동된 학부모 찾기 오류:`, parentError);
              // 학부모 찾기 실패해도 계속 진행
            }
          }
        }
        
        updateData.students = finalStudentIds;
      } else {
        updateData.students = [];
      }
    }

    // 강좌 배열 업데이트
    if (courses !== undefined) {
      const courseIds = Array.isArray(courses) ? courses : [];
      
      if (courseIds.length > 0) {
        // 강좌 유효성 검증
        const validCourses = await Course.find({
          _id: { $in: courseIds },
        });
        
        if (validCourses.length !== courseIds.length) {
          return res.status(400).json({
            success: false,
            error: '일부 강좌를 찾을 수 없습니다',
          });
        }
      }
      
      updateData.courses = courseIds;
    }

    // 구분과 반명 조합 중복 체크 (변경된 경우에만)
    if (grade || className) {
      const finalGrade = grade || (await Class.findById(id))?.grade;
      const finalClassName = className ? className.trim() : (await Class.findById(id))?.className;
      
      const existingClass = await Class.findOne({
        grade: finalGrade,
        className: finalClassName,
        _id: { $ne: id },
      });
      if (existingClass) {
        return res.status(400).json({
          success: false,
          error: '이미 존재하는 반입니다 (같은 구분과 반명)',
        });
      }
    }

    const classData = await Class.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // 업데이트된 문서 반환
        runValidators: true, // 유효성 검증 실행
      }
    )
      .populate('instructorId', 'userId name email userType')
      .populate('students', 'userId name email userType schoolName studentContact parentContact')
      .populate('courses', 'sku courseName instructorName grade courseCount courseStatus thumbnail');

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: '반을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '반 정보가 성공적으로 수정되었습니다',
      data: classData,
    });
  } catch (error) {
    console.error('반 수정 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 반 ID입니다',
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '이미 존재하는 반입니다 (같은 구분과 반명)',
      });
    }
    res.status(500).json({
      success: false,
      error: '반 수정 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 반 삭제
exports.deleteClass = async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: '반을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '반이 성공적으로 삭제되었습니다',
      data: {},
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 반 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '반 삭제 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

