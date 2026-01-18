const Course = require('../models/Course');
const User = require('../models/User');
const Class = require('../models/Class');
const mongoose = require('mongoose');

// 모든 강좌 조회
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructorId', 'userId name email userType profileImage')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error('강좌 목록 조회 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '강좌 목록을 가져오는 중 오류가 발생했습니다',
    });
  }
};

// 특정 강좌 조회 (ID로)
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructorId', 'userId name email userType profileImage');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: '강좌를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 강좌 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '강좌를 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// SKU로 강좌 조회
exports.getCourseBySku = async (req, res) => {
  try {
    const course = await Course.findOne({ sku: req.params.sku }).populate('instructorId', 'userId name email userType profileImage');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: '강좌를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '강좌를 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 새 강좌 생성
exports.createCourse = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: '요청 본문이 비어있습니다',
      });
    }

    const {
      sku,
      courseName,
      instructorId,
      instructorName,
      grade,
      courseCount,
      textbook,
      textbookType,
      courseStatus,
      courseType,
      courseRange,
      courseDescription,
      lectures,
    } = req.body;

    // 필수 필드 검증
    const validationErrors = [];

    if (!sku || !sku.trim()) {
      validationErrors.push('SKU를 입력해주세요');
    }
    if (!courseName || !courseName.trim()) {
      validationErrors.push('강좌명을 입력해주세요');
    }
    if (!instructorId) {
      validationErrors.push('강사를 선택해주세요');
    }
    if (!instructorName || !instructorName.trim()) {
      validationErrors.push('강사명을 확인해주세요');
    }
    if (!grade) {
      validationErrors.push('학년을 선택해주세요');
    }

    // courseCount 검증
    let courseCountNum;
    if (courseCount === undefined || courseCount === null || courseCount === '') {
      validationErrors.push('강의 수를 입력해주세요 (0 이상)');
    } else {
      courseCountNum = Number(courseCount);
      if (isNaN(courseCountNum) || courseCountNum < 0) {
        validationErrors.push('강의 수는 0 이상의 숫자여야 합니다');
      }
    }

    if (!textbook || !textbook.trim()) {
      validationErrors.push('교재를 입력해주세요');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', '),
      });
    }

    // SKU 중복 체크
    const existingCourse = await Course.findOne({ sku });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        error: '이미 사용 중인 SKU입니다',
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
        error: '강사 권한이 있는 사용자만 강좌를 생성할 수 있습니다',
      });
    }

    // 강사명 일치 확인
    const instructorNameTrimmed = instructor.name ? instructor.name.trim() : '';
    const submittedNameTrimmed = instructorName ? instructorName.trim() : '';
    if (instructorNameTrimmed !== submittedNameTrimmed) {
      return res.status(400).json({
        success: false,
        error: `강사명이 일치하지 않습니다`,
      });
    }

    // 학년 유효성 검증
    const validGrades = ['중1', '중2', '중3', '고1', '고2', '고3/N수'];
    if (!validGrades.includes(grade)) {
      return res.status(400).json({
        success: false,
        error: '학년은 중1, 중2, 중3, 고1, 고2, 고3/N수 중 하나여야 합니다',
      });
    }

    // 강좌 수 검증 (0 이상 허용)
    if (courseCount < 0) {
      return res.status(400).json({
        success: false,
        error: '강좌 수는 0 이상이어야 합니다',
      });
    }

    const course = new Course({
      sku: sku.trim(),
      courseName: courseName.trim(),
      instructorId,
      instructorName: instructorName.trim(),
      grade,
      courseCount: courseCountNum,
      textbook: textbook.trim(),
      textbookType: textbookType || undefined,
      courseStatus: courseStatus || undefined,
      courseType: courseType || undefined,
      courseRange: courseRange ? courseRange.trim() : undefined,
      courseDescription: courseDescription ? courseDescription.trim() : undefined,
      lectures: lectures && Array.isArray(lectures) ? lectures.map((lecture, index) => {
        // lectureNumber 검증 및 변환
        let lectureNumber;
        if (lecture.lectureNumber !== undefined && lecture.lectureNumber !== null && lecture.lectureNumber !== '') {
          lectureNumber = Number(lecture.lectureNumber);
          if (isNaN(lectureNumber) || lectureNumber < 1) {
            throw new Error(`강의 ${index + 1}의 회차 번호가 유효하지 않습니다.`);
          }
        } else {
          lectureNumber = index + 1;
        }
        
        // 필수 필드 검증
        if (!lecture.lectureTitle || !lecture.lectureTitle.trim()) {
          throw new Error(`강의 ${index + 1}의 제목을 입력해주세요.`);
        }
        if (!lecture.videoLink || !lecture.videoLink.trim()) {
          throw new Error(`강의 ${index + 1}의 영상 링크를 입력해주세요.`);
        }
        
        return {
          lectureNumber: lectureNumber,
          lectureTitle: lecture.lectureTitle.trim(),
          duration: lecture.duration && lecture.duration.trim() ? lecture.duration.trim() : undefined,
          videoLink: lecture.videoLink.trim(),
        };
      }) : [],
    });

    const savedCourse = await course.save();

    res.status(201).json({
      success: true,
      message: '강좌가 성공적으로 생성되었습니다',
      data: savedCourse,
    });
  } catch (error) {
    console.error('강좌 생성 오류:', error.message);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }

    if (error.message) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '이미 사용 중인 SKU입니다',
      });
    }

    res.status(500).json({
      success: false,
      error: '강좌 생성 중 오류가 발생했습니다',
    });
  }
};

// 강좌 정보 수정
exports.updateCourse = async (req, res) => {
  try {
    const {
      sku,
      courseName,
      instructorId,
      instructorName,
      grade,
      courseCount,
      textbook,
      textbookType,
      courseStatus,
      courseType,
      courseRange,
      courseDescription,
      lectures,
    } = req.body;

    // 필수 필드 검증
    const validationErrors = [];

    if (!sku || !sku.trim()) {
      validationErrors.push('SKU를 입력해주세요');
    }
    if (!courseName || !courseName.trim()) {
      validationErrors.push('강좌명을 입력해주세요');
    }
    if (!instructorId) {
      validationErrors.push('강사를 선택해주세요');
    }
    if (!instructorName || !instructorName.trim()) {
      validationErrors.push('강사명을 확인해주세요');
    }
    if (!grade) {
      validationErrors.push('학년을 선택해주세요');
    }

    // courseCount 검증
    let courseCountNum;
    if (courseCount === undefined || courseCount === null || courseCount === '') {
      validationErrors.push('강의 수를 입력해주세요 (0 이상)');
    } else {
      courseCountNum = Number(courseCount);
      if (isNaN(courseCountNum) || courseCountNum < 0) {
        validationErrors.push('강의 수는 0 이상의 숫자여야 합니다');
      }
    }

    if (!textbook || !textbook.trim()) {
      validationErrors.push('교재를 입력해주세요');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', '),
      });
    }

    const updateData = {};

    // SKU 변경이 있는 경우 중복 체크
    const existingCourse = await Course.findOne({
      sku: sku.trim(),
      _id: { $ne: req.params.id },
    });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        error: '이미 사용 중인 SKU입니다',
      });
    }
    updateData.sku = sku.trim();

    updateData.courseName = courseName.trim();
    
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
        error: '강사 권한이 있는 사용자만 강좌를 수정할 수 있습니다',
      });
    }

    updateData.instructorId = instructorId;
    updateData.instructorName = instructorName.trim();
    
    const validGrades = ['중1', '중2', '중3', '고1', '고2', '고3/N수'];
    if (!validGrades.includes(grade)) {
      return res.status(400).json({
        success: false,
        error: '학년은 중1, 중2, 중3, 고1, 고2, 고3/N수 중 하나여야 합니다',
      });
    }
    updateData.grade = grade;

    updateData.courseCount = courseCountNum;
    updateData.textbook = textbook.trim();
    
    if (courseRange !== undefined) updateData.courseRange = courseRange ? courseRange.trim() : '';
    if (courseDescription !== undefined) updateData.courseDescription = courseDescription ? courseDescription.trim() : '';
    
    // enum 필드들은 빈 문자열이 아닌 경우에만 업데이트
    if (textbookType !== undefined && textbookType !== '') {
      const validTextbookTypes = ['자체교재', '시중교재'];
      if (!validTextbookTypes.includes(textbookType)) {
        return res.status(400).json({
          success: false,
          error: '교재 유형은 자체교재, 시중교재 중 하나여야 합니다',
        });
      }
      updateData.textbookType = textbookType;
    } else if (textbookType === '') {
      // 빈 문자열이면 undefined로 설정 (필드 제거)
      updateData.textbookType = undefined;
    }
    
    if (courseStatus !== undefined && courseStatus !== '') {
      const validCourseStatuses = ['완강', '진행중'];
      if (!validCourseStatuses.includes(courseStatus)) {
        return res.status(400).json({
          success: false,
          error: '강좌 상태는 완강, 진행중 중 하나여야 합니다',
        });
      }
      updateData.courseStatus = courseStatus;
    } else if (courseStatus === '') {
      updateData.courseStatus = undefined;
    }
    
    if (courseType !== undefined && courseType !== '') {
      const validCourseTypes = ['정규', '특강'];
      if (!validCourseTypes.includes(courseType)) {
        return res.status(400).json({
          success: false,
          error: '강좌 유형은 정규, 특강 중 하나여야 합니다',
        });
      }
      updateData.courseType = courseType;
    } else if (courseType === '') {
      updateData.courseType = undefined;
    }
    
    // 강의 목록 업데이트
    if (lectures !== undefined) {
      if (!Array.isArray(lectures)) {
        return res.status(400).json({
          success: false,
          error: '강의 목록은 배열이어야 합니다.',
        });
      }
      
      if (lectures.length === 0) {
        updateData.lectures = [];
      } else {
        try {
          updateData.lectures = lectures.map((lecture, index) => {
            let lectureNumber;
            if (lecture.lectureNumber !== undefined && lecture.lectureNumber !== null && lecture.lectureNumber !== '') {
              lectureNumber = Number(lecture.lectureNumber);
              if (isNaN(lectureNumber) || lectureNumber < 1) {
                lectureNumber = index + 1;
              }
            } else {
              lectureNumber = index + 1;
            }

            if (!lecture || typeof lecture !== 'object') {
              throw new Error(`강의 ${index + 1}의 데이터 형식이 올바르지 않습니다.`);
            }

            const lectureTitle = lecture.lectureTitle && typeof lecture.lectureTitle === 'string' ? lecture.lectureTitle.trim() : '';
            if (!lectureTitle) {
              throw new Error(`강의 ${index + 1}의 제목을 입력해주세요.`);
            }

            const videoLink = lecture.videoLink && typeof lecture.videoLink === 'string' ? lecture.videoLink.trim() : '';
            if (!videoLink) {
              throw new Error(`강의 ${index + 1}의 영상 링크를 입력해주세요.`);
            }

            const duration = lecture.duration && typeof lecture.duration === 'string' && lecture.duration.trim() ? lecture.duration.trim() : undefined;

            return {
              lectureNumber: lectureNumber,
              lectureTitle: lectureTitle,
              duration: duration,
              videoLink: videoLink,
            };
          });
        } catch (lectureError) {
          return res.status(400).json({
            success: false,
            error: lectureError.message || '강의 데이터 처리 중 오류가 발생했습니다.',
          });
        }
      }
    }

    let course;
    try {
      course = await Course.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate('instructorId', 'userId name email userType profileImage');

      if (!course) {
        return res.status(404).json({
          success: false,
          error: '강좌를 찾을 수 없습니다',
        });
      }
    } catch (validationError) {
      console.error('강좌 업데이트 오류:', validationError.message);

      if (validationError.name === 'ValidationError') {
        const errors = Object.values(validationError.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: '강좌 정보 검증 실패',
          details: errors,
        });
      }

      if (validationError.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 데이터 형식입니다.',
        });
      }

      return res.status(500).json({
        success: false,
        error: '강좌 수정 중 오류가 발생했습니다',
      });
    }

    res.json({
      success: true,
      message: '강좌 정보가 성공적으로 수정되었습니다',
      data: course,
    });
  } catch (error) {
    console.error('강좌 수정 오류:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 강좌 ID입니다',
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }
    if (error.message) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '이미 사용 중인 SKU입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '강좌 수정 중 오류가 발생했습니다',
    });
  }
};

// 내강좌 조회 (학생: 반 기반, 관리자: 전체)
exports.getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id; // 인증 미들웨어에서 설정된 사용자 ID
    const userType = req.user.userType;
    const isAdmin = req.user.isAdmin;

    // 사용자 정보 가져오기
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다',
      });
    }

    let courses = [];

    // 관리자 권한이 있는 강사인 경우: 모든 강좌 조회
    if (isAdmin && userType === '강사') {
      courses = await Course.find()
        .populate('instructorId', 'userId name email userType profileImage')
        .sort({ createdAt: -1 });
      
      // 강사 이름 동기화: populate된 instructorId의 name과 Course의 instructorName이 다르면 업데이트
      for (const course of courses) {
        if (course.instructorId && course.instructorId.name && course.instructorName !== course.instructorId.name) {
          course.instructorName = course.instructorId.name;
          await Course.findByIdAndUpdate(course._id, { instructorName: course.instructorId.name });
        }
      }
    } 
    // 학생인 경우: 자신이 속한 반의 강좌만 조회
    else if (userType === '학생') {
      // 사용자가 속한 반 찾기 (ObjectId로 변환하여 비교)
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId) 
        : userId;
      
      const userClasses = await Class.find({
        students: userObjectId,
      }).populate('courses');

      // 모든 반의 강좌 ID 수집
      const courseIds = [];
      userClasses.forEach((classData) => {
        if (classData.courses && Array.isArray(classData.courses)) {
          classData.courses.forEach((course) => {
            const courseId = course._id || course;
            // ObjectId로 변환
            const courseObjectId = mongoose.Types.ObjectId.isValid(courseId) 
              ? new mongoose.Types.ObjectId(courseId) 
              : courseId;
            // 중복 체크를 위해 문자열로 변환
            const courseIdString = courseObjectId.toString();
            if (!courseIds.some(id => id.toString() === courseIdString)) {
              courseIds.push(courseObjectId);
            }
          });
        }
      });

      // 강좌 조회
      if (courseIds.length > 0) {
        courses = await Course.find({
          _id: { $in: courseIds },
        })
          .populate('instructorId', 'userId name email userType profileImage')
          .sort({ createdAt: -1 });
      }
    } 
    // 학부모인 경우: 접근 불가
    else {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다. 학생 또는 관리자 권한이 필요합니다',
      });
    }

    // 강사 이름 동기화: populate된 instructorId의 name과 Course의 instructorName이 다르면 업데이트
    for (const course of courses) {
      if (course.instructorId && course.instructorId.name && course.instructorName !== course.instructorId.name) {
        course.instructorName = course.instructorId.name;
        await Course.findByIdAndUpdate(course._id, { instructorName: course.instructorId.name });
      }
    }

    res.json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error('내강좌 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '내강좌를 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 강좌 삭제
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: '강좌를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '강좌가 성공적으로 삭제되었습니다',
      data: course,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 강좌 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '강좌 삭제 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

