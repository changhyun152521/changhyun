const StudentRecord = require('../models/StudentRecord');
const Class = require('../models/Class');
const User = require('../models/User');
const ClassRecord = require('../models/ClassRecord');
const ParentStudentLink = require('../models/ParentStudentLink');
const mongoose = require('mongoose');

// 모든 학생 기록 조회
exports.getAllStudentRecords = async (req, res) => {
  try {
    const { classId, studentId, date } = req.query;
    
    const query = {};
    if (classId) {
      query.classId = classId;
    }
    if (studentId) {
      query.studentId = studentId;
    }
    if (date) {
      // 날짜 범위로 검색 (하루 전체)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await StudentRecord.find(query)
      .populate('studentId', 'userId name email userType')
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('학생 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '학생 기록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 특정 학생 기록 조회 (ID로)
exports.getStudentRecordById = async (req, res) => {
  try {
    const record = await StudentRecord.findById(req.params.id)
      .populate('studentId', 'userId name email userType')
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        error: '학생 기록을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 기록 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '학생 기록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 새 학생 기록 생성
exports.createStudentRecord = async (req, res) => {
  try {
    const {
      date,
      studentId,
      classId,
      attendance,
      assignment,
      dailyTestScore,
      monthlyEvaluationScore,
      hasClinic,
    } = req.body;

    // 필수 필드 검증
    if (!date || !studentId || !classId) {
      return res.status(400).json({
        success: false,
        error: '일시, 학생 ID, 반 ID는 필수입니다',
      });
    }

    // 학생 존재 확인
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: '학생을 찾을 수 없습니다',
      });
    }

    // 학생 유형 확인
    if (student.userType !== '학생' && student.userType !== '학부모') {
      return res.status(400).json({
        success: false,
        error: '학생 또는 학부모만 기록할 수 있습니다',
      });
    }

    // 반 존재 확인
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: '반을 찾을 수 없습니다',
      });
    }

    // 학생이 해당 반에 속해있는지 확인
    const isStudentInClass = classData.students.some(
      (id) => id.toString() === studentId.toString()
    );
    if (!isStudentInClass) {
      return res.status(400).json({
        success: false,
        error: '해당 학생이 이 반에 속해있지 않습니다',
      });
    }

    // 날짜 형식 변환
    const recordDate = new Date(date);
    if (isNaN(recordDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: '올바른 날짜 형식이 아닙니다',
      });
    }

    // 같은 학생의 같은 날짜에 이미 기록이 있는지 확인
    const startDate = new Date(recordDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(recordDate);
    endDate.setHours(23, 59, 59, 999);

    const existingRecord = await StudentRecord.findOne({
      studentId,
      classId,
      date: { $gte: startDate, $lte: endDate },
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        error: '해당 날짜에 이미 학생 기록이 존재합니다',
        data: existingRecord,
      });
    }

    // 일일TEST점수 문자열 그대로 저장 (맞은개수/총문항수 형식)
    let finalDailyTestScore = null;
    if (dailyTestScore !== undefined && dailyTestScore !== '' && dailyTestScore !== null) {
      // 문자열 그대로 저장 (예: "17/20")
      finalDailyTestScore = String(dailyTestScore).trim();
      // 형식 검증: "숫자/숫자" 형식인지 확인
      if (!/^\d+\/\d+$/.test(finalDailyTestScore)) {
        return res.status(400).json({
          success: false,
          error: '일일TEST점수는 "맞은개수/총문항수" 형식으로 입력해주세요 (예: 17/20)',
        });
      }
    }

    // 월말평가점수 문자열 그대로 저장 (맞은개수/총문항수 형식)
    let finalMonthlyEvaluationScore = null;
    if (monthlyEvaluationScore !== undefined && monthlyEvaluationScore !== '' && monthlyEvaluationScore !== null) {
      // 문자열 그대로 저장 (예: "17/20")
      finalMonthlyEvaluationScore = String(monthlyEvaluationScore).trim();
      // 형식 검증: "숫자/숫자" 형식인지 확인
      if (!/^\d+\/\d+$/.test(finalMonthlyEvaluationScore)) {
        return res.status(400).json({
          success: false,
          error: '월말평가점수는 "맞은개수/총문항수" 형식으로 입력해주세요 (예: 17/20)',
        });
      }
    }

    const newRecord = new StudentRecord({
      date: recordDate,
      studentId,
      classId,
      attendance: attendance === true || attendance === 'true' || attendance === 'O' || attendance === 'o',
      assignment: assignment === true || assignment === 'true' || assignment === 'O' || assignment === 'o',
      dailyTestScore: finalDailyTestScore,
      monthlyEvaluationScore: finalMonthlyEvaluationScore,
      hasClinic: hasClinic === true || hasClinic === 'true' || hasClinic === 'O' || hasClinic === 'o',
      createdBy: req.user.id,
    });

    const savedRecord = await newRecord.save();

    // populate하여 반환
    const populatedRecord = await StudentRecord.findById(savedRecord._id)
      .populate('studentId', 'userId name email userType')
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email');

    res.status(201).json({
      success: true,
      message: '학생 기록이 성공적으로 생성되었습니다',
      data: populatedRecord,
    });
  } catch (error) {
    console.error('학생 기록 생성 오류:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: '유효성 검증 실패',
        details: errors,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '해당 날짜에 이미 학생 기록이 존재합니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '학생 기록 생성 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 학생 기록 수정
exports.updateStudentRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      studentId,
      classId,
      attendance,
      assignment,
      dailyTestScore,
      monthlyEvaluationScore,
      hasClinic,
    } = req.body;

    const updateData = {};

    // 날짜 변경
    if (date) {
      const recordDate = new Date(date);
      if (isNaN(recordDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: '올바른 날짜 형식이 아닙니다',
        });
      }
      updateData.date = recordDate;
    }

    // 학생 ID 변경
    if (studentId) {
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: '학생을 찾을 수 없습니다',
        });
      }
      if (student.userType !== '학생' && student.userType !== '학부모') {
        return res.status(400).json({
          success: false,
          error: '학생 또는 학부모만 기록할 수 있습니다',
        });
      }
      updateData.studentId = studentId;
    }

    // 반 ID 변경
    if (classId) {
      const classData = await Class.findById(classId);
      if (!classData) {
        return res.status(404).json({
          success: false,
          error: '반을 찾을 수 없습니다',
        });
      }
      updateData.classId = classId;
    }

    // 출결 변경
    if (attendance !== undefined) {
      updateData.attendance = attendance === true || attendance === 'true' || attendance === 'O' || attendance === 'o';
    }

    // 과제 변경
    if (assignment !== undefined) {
      updateData.assignment = assignment === true || assignment === 'true' || assignment === 'O' || assignment === 'o';
    }

    // 일일TEST점수 변경 (문자열 그대로 저장)
    if (dailyTestScore !== undefined) {
      if (dailyTestScore === '' || dailyTestScore === null) {
        updateData.dailyTestScore = null;
      } else {
        // 문자열 그대로 저장 (예: "17/20")
        const finalScore = String(dailyTestScore).trim();
        // 형식 검증: "숫자/숫자" 형식인지 확인
        if (!/^\d+\/\d+$/.test(finalScore)) {
          return res.status(400).json({
            success: false,
            error: '일일TEST점수는 "맞은개수/총문항수" 형식으로 입력해주세요 (예: 17/20)',
          });
        }
        updateData.dailyTestScore = finalScore;
      }
    }

    // 월말평가점수 변경 (문자열 그대로 저장)
    if (monthlyEvaluationScore !== undefined) {
      if (monthlyEvaluationScore === '' || monthlyEvaluationScore === null) {
        updateData.monthlyEvaluationScore = null;
      } else {
        // 문자열 그대로 저장 (예: "17/20")
        const finalScore = String(monthlyEvaluationScore).trim();
        // 형식 검증: "숫자/숫자" 형식인지 확인
        if (!/^\d+\/\d+$/.test(finalScore)) {
          return res.status(400).json({
            success: false,
            error: '월말평가점수는 "맞은개수/총문항수" 형식으로 입력해주세요 (예: 17/20)',
          });
        }
        updateData.monthlyEvaluationScore = finalScore;
      }
    }

    // 클리닉여부 변경
    if (hasClinic !== undefined) {
      updateData.hasClinic = hasClinic === true || hasClinic === 'true' || hasClinic === 'O';
    }

    // 날짜나 학생이나 반이 변경된 경우 중복 체크
    if (date || studentId || classId) {
      const currentRecord = await StudentRecord.findById(id);
      if (!currentRecord) {
        return res.status(404).json({
          success: false,
          error: '학생 기록을 찾을 수 없습니다',
        });
      }

      const finalStudentId = studentId || currentRecord.studentId;
      const finalClassId = classId || currentRecord.classId;
      const finalDate = date ? new Date(date) : currentRecord.date;

      const startDate = new Date(finalDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(finalDate);
      endDate.setHours(23, 59, 59, 999);

      const existingRecord = await StudentRecord.findOne({
        studentId: finalStudentId,
        classId: finalClassId,
        date: { $gte: startDate, $lte: endDate },
        _id: { $ne: id },
      });

      if (existingRecord) {
        return res.status(400).json({
          success: false,
          error: '해당 날짜에 이미 학생 기록이 존재합니다',
        });
      }

      // 학생이 해당 반에 속해있는지 확인
      if (classId || studentId) {
        const finalClass = await Class.findById(finalClassId);
        const finalStudent = finalStudentId;
        const isStudentInClass = finalClass.students.some(
          (id) => id.toString() === finalStudent.toString()
        );
        if (!isStudentInClass) {
          return res.status(400).json({
            success: false,
            error: '해당 학생이 이 반에 속해있지 않습니다',
          });
        }
      }
    }

    const record = await StudentRecord.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('studentId', 'userId name email userType')
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        error: '학생 기록을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '학생 기록이 성공적으로 수정되었습니다',
      data: record,
    });
  } catch (error) {
    console.error('학생 기록 수정 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 기록 ID입니다',
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: '유효성 검증 실패',
        details: errors,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '해당 날짜에 이미 학생 기록이 존재합니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '학생 기록 수정 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 학생 기록 삭제
exports.deleteStudentRecord = async (req, res) => {
  try {
    const record = await StudentRecord.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: '학생 기록을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '학생 기록이 성공적으로 삭제되었습니다',
      data: {},
    });
  } catch (error) {
    console.error('학생 기록 삭제 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 기록 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '학생 기록 삭제 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 학생이 자신의 기록 조회 (학생용)
exports.getMyStudentRecords = async (req, res) => {
  try {
    // req.user가 없으면 에러
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
      });
    }

    const userId = req.user.id; // protect 미들웨어에서 설정된 user ID
    const { classId, date, studentId } = req.query;

    console.log('[getMyStudentRecords] 요청 파라미터:', { userId, classId, date, studentId });

    // 사용자 확인
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.',
      });
    }

    // 학생 또는 학부모만 접근 가능
    if (user.userType !== '학생' && user.userType !== '학부모') {
      return res.status(403).json({
        success: false,
        error: '학생 또는 학부모만 기록을 조회할 수 있습니다.',
      });
    }

    // 반 ID 확인
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: '반 ID가 필요합니다.',
      });
    }

    // classId가 유효한 ObjectId 형식인지 확인
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 반 ID입니다.',
      });
    }

    // classId를 ObjectId로 변환
    let classIdObjectId;
    try {
      classIdObjectId = new mongoose.Types.ObjectId(classId);
    } catch (err) {
      console.error('classId 변환 오류:', err);
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 반 ID입니다.',
      });
    }

    // 반 정보 확인
    let classData;
    try {
      classData = await Class.findById(classIdObjectId);
      if (!classData) {
        return res.status(404).json({
          success: false,
          error: '반을 찾을 수 없습니다.',
        });
      }
    } catch (classError) {
      console.error('반 정보 조회 오류:', classError);
      return res.status(500).json({
        success: false,
        error: '반 정보를 가져오는 중 오류가 발생했습니다.',
      });
    }

    // students 배열이 존재하는지 확인
    if (!classData.students || !Array.isArray(classData.students)) {
      return res.status(500).json({
        success: false,
        error: '반 정보에 학생 목록이 올바르지 않습니다.',
      });
    }

    // 실제 조회할 학생 ID (학부모인 경우 자녀 학생 ID를 찾아야 함)
    let targetStudentId = userId;

    // 학부모인 경우 자녀 학생 찾기
    if (user.userType === '학부모') {
      // studentId가 제공된 경우 (n:m 연동 관계 사용)
      if (studentId) {
        // studentId가 유효한 ObjectId 형식인지 확인
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
          return res.status(400).json({
            success: false,
            error: '유효하지 않은 학생 ID입니다.',
          });
        }

        // 학부모와 학생이 연동되어 있는지 확인
        const link = await ParentStudentLink.findOne({
          parentId: userId,
          studentId: studentId,
        });

        if (!link) {
          return res.status(403).json({
            success: false,
            error: '연동된 학생이 아닙니다.',
          });
        }

        // 학생 정보 확인
        const linkedStudent = await User.findById(studentId);
        if (!linkedStudent || linkedStudent.userType !== '학생') {
          return res.status(404).json({
            success: false,
            error: '학생을 찾을 수 없습니다.',
          });
        }

        // 학생이 해당 반에 속해있는지 확인
        const isStudentInClass = classData.students.some(
          (id) => id.toString() === studentId.toString()
        );
        if (!isStudentInClass) {
          return res.status(403).json({
            success: false,
            error: '연동된 학생이 해당 반에 속해있지 않습니다.',
          });
        }

        targetStudentId = studentId;
      } else {
        // 기존 방식 (하위 호환성 유지)
        // 학부모가 해당 반에 속해있는지 확인
        const isParentInClass = classData.students.some(
          (id) => id.toString() === userId.toString()
        );
        if (!isParentInClass) {
          return res.status(403).json({
            success: false,
            error: '해당 반에 속해있지 않습니다.',
          });
        }

        // 학부모의 name에서 "부모님"을 제거하여 학생 이름 추출
        const studentName = user.name.replace('부모님', '');
        
        // 학부모의 studentContact로 연결된 학생 찾기
        const linkedStudent = await User.findOne({
          userType: '학생',
          $or: [
            { name: studentName },
            { studentContact: user.studentContact }
          ]
        });

        if (!linkedStudent) {
          return res.status(404).json({
            success: false,
            error: '연동된 학생을 찾을 수 없습니다.',
          });
        }

        // 학생이 해당 반에 속해있는지 확인
        const isStudentInClass = classData.students.some(
          (id) => id.toString() === linkedStudent._id.toString()
        );
        if (!isStudentInClass) {
          return res.status(403).json({
            success: false,
            error: '연동된 학생이 해당 반에 속해있지 않습니다.',
          });
        }

        targetStudentId = linkedStudent._id;
      }
    } else {
      // 학생인 경우 자신이 해당 반에 속해있는지 확인
      const isStudentInClass = classData.students.some(
        (id) => id.toString() === userId.toString()
      );
      if (!isStudentInClass) {
        return res.status(403).json({
          success: false,
          error: '해당 반에 속해있지 않습니다.',
        });
      }
    }

    // targetStudentId가 이미 ObjectId인지 확인하고 필요시 변환
    try {
      if (targetStudentId && !(targetStudentId instanceof mongoose.Types.ObjectId)) {
        if (mongoose.Types.ObjectId.isValid(targetStudentId)) {
          targetStudentId = new mongoose.Types.ObjectId(targetStudentId);
        } else {
          console.error('유효하지 않은 targetStudentId:', targetStudentId);
          return res.status(500).json({
            success: false,
            error: '유효하지 않은 학생 ID입니다.',
          });
        }
      }
    } catch (err) {
      console.error('targetStudentId 변환 오류:', err);
      return res.status(500).json({
        success: false,
        error: '학생 ID 처리 중 오류가 발생했습니다.',
      });
    }

    // 날짜가 지정된 경우 해당 날짜의 기록 조회
    let query = {
      studentId: targetStudentId,
      classId: classIdObjectId,
    };

    if (date) {
      // 날짜 문자열을 파싱하여 로컬 시간대 기준으로 날짜 범위 설정
      // "YYYY-MM-DD" 형식의 문자열을 파싱
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // 월은 0부터 시작
        const day = parseInt(dateParts[2], 10);
        
        const startDate = new Date(year, month, day, 0, 0, 0, 0);
        const endDate = new Date(year, month, day, 23, 59, 59, 999);
        query.date = { $gte: startDate, $lte: endDate };
      } else {
        // 기존 방식 (호환성 유지)
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    // 학생 기록 조회
    let studentRecord = null;
    try {
      studentRecord = await StudentRecord.findOne(query)
        .populate('classId', 'grade className instructorName')
        .sort({ date: -1 });
      
      // lean() 대신 toObject() 사용 (필요한 경우)
      if (studentRecord) {
        studentRecord = studentRecord.toObject ? studentRecord.toObject() : studentRecord;
      }
    } catch (queryError) {
      console.error('학생 기록 조회 오류:', queryError);
      // 쿼리 오류가 발생해도 계속 진행 (null로 처리)
      studentRecord = null;
    }

    // 반 전체 기록 조회 (날짜가 지정된 경우)
    let classRecord = null;
    let classAverage = null;
    let classMaxScore = null;
    let classMaxScoreStudent = null;
    let classMaxScoreCount = 0; // 최고점자 수
    let monthlyAverage = null;
    let monthlyMax = null;
    let monthlyMaxStudent = null;
    let monthlyMaxScoreCount = 0; // 최고점자 수
    let monthlyRank = null;
    let monthlyTotalCount = 0;
    
    if (date) {
      // 날짜 문자열을 파싱하여 로컬 시간대 기준으로 날짜 범위 설정
      // "YYYY-MM-DD" 형식의 문자열을 파싱
      let startDate, endDate;
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // 월은 0부터 시작
        const day = parseInt(dateParts[2], 10);
        
        startDate = new Date(year, month, day, 0, 0, 0, 0);
        endDate = new Date(year, month, day, 23, 59, 59, 999);
      } else {
        // 기존 방식 (호환성 유지)
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      }
      
      try {
        const foundClassRecord = await ClassRecord.findOne({
          classId: classId,
          date: { $gte: startDate, $lte: endDate },
        })
          .populate('classId', 'grade className instructorName');
        
        if (foundClassRecord) {
          classRecord = foundClassRecord.toObject ? foundClassRecord.toObject() : foundClassRecord;
        }
      } catch (queryError) {
        console.error('반 전체 기록 조회 오류:', queryError);
        // 쿼리 오류가 발생해도 계속 진행 (null로 처리)
        classRecord = null;
      }

      // 해당 날짜의 모든 학생 기록 조회 (일일테스트 점수 및 월말평가 점수 계산용)
      // 중요: 반에서 학생이 삭제되어도 해당 날짜에 기록이 있는 모든 학생 기록을 기준으로 계산
      // 현재 반에 등록된 학생 여부와 관계없이 해당 날짜의 모든 기록을 사용
      const allStudentRecords = await StudentRecord.find({
        classId: classIdObjectId,
        date: { $gte: startDate, $lte: endDate },
      })
        .populate('studentId', 'name userId')
        .select('studentId dailyTestScore monthlyEvaluationScore');

      // 일일테스트 점수 계산 (백분율로 변환)
      const dailyScores = [];
      let dailyMaxScore = -1;
      let dailyMaxScoreStudent = null;
      let dailyMaxScoreCount = 0; // 최고점자 수

      // 월말평가 점수 계산
      const monthlyScores = [];
      let monthlyMaxScore = -1;
      let monthlyMaxScoreStudent = null;
      let monthlyMaxScoreCount = 0; // 최고점자 수

      allStudentRecords.forEach(record => {
        // 일일테스트 점수 처리
        // 중요: null, undefined, 빈 문자열이 아니고, 유효한 형식인 경우만 통계에 포함
        if (record.dailyTestScore && 
            record.dailyTestScore !== null && 
            record.dailyTestScore !== undefined && 
            String(record.dailyTestScore).trim() !== '') {
          let percentage = null;
          if (typeof record.dailyTestScore === 'string' && record.dailyTestScore.includes('/')) {
            const [correct, total] = record.dailyTestScore.split('/').map(Number);
            // total이 0보다 크고, correct와 total이 모두 유효한 숫자인 경우만 처리
            if (total > 0 && !isNaN(correct) && !isNaN(total) && correct >= 0) {
              percentage = Math.round((correct / total) * 100);
            }
          }
          
          // percentage가 null이 아니고 유효한 값(0 이상)인 경우만 배열에 추가
          if (percentage !== null && percentage >= 0 && percentage <= 100) {
            dailyScores.push(percentage);
            if (percentage > dailyMaxScore) {
              dailyMaxScore = percentage;
              dailyMaxScoreStudent = record.studentId ? record.studentId.name : null;
              dailyMaxScoreCount = 1; // 새로운 최고점 발견 시 카운트 초기화
            } else if (percentage === dailyMaxScore) {
              // 동일한 최고점이면 카운트 증가
              dailyMaxScoreCount++;
            }
          }
        }

        // 월말평가 점수 처리 (맞은개수/총문항수 형식을 백분율로 변환)
        // 중요: null, undefined, 빈 문자열이 아니고, 유효한 형식인 경우만 통계에 포함
        if (record.monthlyEvaluationScore !== null && 
            record.monthlyEvaluationScore !== undefined &&
            String(record.monthlyEvaluationScore).trim() !== '') {
          let percentage = null;
          if (typeof record.monthlyEvaluationScore === 'string' && record.monthlyEvaluationScore.includes('/')) {
            const [correct, total] = record.monthlyEvaluationScore.split('/').map(Number);
            // total이 0보다 크고, correct와 total이 모두 유효한 숫자인 경우만 처리
            if (total > 0 && !isNaN(correct) && !isNaN(total) && correct >= 0) {
              percentage = Math.round((correct / total) * 100);
            }
          } else if (typeof record.monthlyEvaluationScore === 'number') {
            // 기존 Number 형식 데이터 호환성 (0 이상 100 이하인 경우만)
            if (record.monthlyEvaluationScore >= 0 && record.monthlyEvaluationScore <= 100) {
              percentage = Math.round(record.monthlyEvaluationScore);
            }
          }
          
          // percentage가 null이 아니고 유효한 값(0 이상)인 경우만 배열에 추가
          if (percentage !== null && percentage >= 0 && percentage <= 100) {
            monthlyScores.push(percentage);
            if (percentage > monthlyMaxScore) {
              monthlyMaxScore = percentage;
              monthlyMaxScoreStudent = record.studentId ? record.studentId.name : null;
              monthlyMaxScoreCount = 1; // 새로운 최고점 발견 시 카운트 초기화
            } else if (percentage === monthlyMaxScore) {
              // 동일한 최고점이면 카운트 증가
              monthlyMaxScoreCount++;
            }
          }
        }
      });

      // 일일테스트 평균 계산
      if (dailyScores.length > 0) {
        classAverage = Math.round(dailyScores.reduce((sum, score) => sum + score, 0) / dailyScores.length);
        // dailyScores.length > 0이면 dailyMaxScore는 항상 -1보다 크므로 체크 불필요
        classMaxScore = dailyMaxScore;
        classMaxScoreCount = dailyMaxScoreCount; // 최고점자 수 설정
        // 이름 마스킹 (두 번째 글자를 ㅇ로 변경) - 단일 최고점자일 때만
        if (dailyMaxScoreStudent && dailyMaxScoreCount === 1) {
          if (dailyMaxScoreStudent.length === 1) {
            classMaxScoreStudent = dailyMaxScoreStudent;
          } else if (dailyMaxScoreStudent.length === 2) {
            // 2글자: 첫 글자 + ㅇ
            classMaxScoreStudent = dailyMaxScoreStudent[0] + 'ㅇ';
          } else {
            // 3글자 이상: 첫 글자 + ㅇ + (세 번째 글자부터 끝까지)
            classMaxScoreStudent = dailyMaxScoreStudent[0] + 'ㅇ' + dailyMaxScoreStudent.slice(2);
          }
        } else {
          // 여러 명일 때는 null로 설정 (프론트엔드에서 명수 표시)
          classMaxScoreStudent = null;
        }
      } else {
        // dailyScores가 비어있으면 명시적으로 null 설정
        classAverage = null;
        classMaxScore = null;
        classMaxScoreStudent = null;
        classMaxScoreCount = 0;
      }

      // 월말평가 평균 및 최고점 계산
      if (monthlyScores.length > 0) {
        monthlyAverage = Math.round(monthlyScores.reduce((sum, score) => sum + score, 0) / monthlyScores.length);
        monthlyMax = monthlyMaxScore > -1 ? monthlyMaxScore : null;
        monthlyMaxScoreCount = monthlyMaxScoreCount; // 최고점자 수 설정
        // 이름 마스킹 (두 번째 글자를 ㅇ로 변경) - 단일 최고점자일 때만
        if (monthlyMaxScoreStudent && monthlyMaxScoreCount === 1) {
          if (monthlyMaxScoreStudent.length === 1) {
            monthlyMaxStudent = monthlyMaxScoreStudent;
          } else if (monthlyMaxScoreStudent.length === 2) {
            // 2글자: 첫 글자 + ㅇ
            monthlyMaxStudent = monthlyMaxScoreStudent[0] + 'ㅇ';
          } else {
            // 3글자 이상: 첫 글자 + ㅇ + (세 번째 글자부터 끝까지)
            monthlyMaxStudent = monthlyMaxScoreStudent[0] + 'ㅇ' + monthlyMaxScoreStudent.slice(2);
          }
        } else {
          // 여러 명일 때는 null로 설정 (프론트엔드에서 명수 표시)
          monthlyMaxStudent = null;
        }
        
        // 월말평가 등수 계산
        monthlyTotalCount = monthlyScores.length;
        if (studentRecord && studentRecord.monthlyEvaluationScore && monthlyScores.length > 0) {
          let myPercentage = null;
          if (typeof studentRecord.monthlyEvaluationScore === 'string' && studentRecord.monthlyEvaluationScore.includes('/')) {
            const [correct, total] = studentRecord.monthlyEvaluationScore.split('/').map(Number);
            if (total > 0 && !isNaN(correct) && !isNaN(total) && correct >= 0) {
              myPercentage = Math.round((correct / total) * 100);
            }
          } else if (typeof studentRecord.monthlyEvaluationScore === 'number') {
            if (studentRecord.monthlyEvaluationScore >= 0 && studentRecord.monthlyEvaluationScore <= 100) {
              myPercentage = Math.round(studentRecord.monthlyEvaluationScore);
            }
          }
          
          if (myPercentage !== null) {
            // 점수 내림차순 정렬 (내 점수 포함)
            const sortedScores = [...monthlyScores].sort((a, b) => b - a);
            
            // 내 점수가 sortedScores에 포함되어 있는지 확인
            // 내 점수와 동일한 점수가 있는지 확인 (반올림 오차 고려)
            const myScoreInArray = sortedScores.some(score => Math.abs(score - myPercentage) < 1);
            
            // 내 점수보다 높은 점수의 개수 세기
            let higherCount = 0;
            for (let i = 0; i < sortedScores.length; i++) {
              if (sortedScores[i] > myPercentage) {
                higherCount++;
              } else {
                break;
              }
            }
            // 등수 = 높은 점수 개수 + 1
            monthlyRank = higherCount + 1;
            
            // 디버깅 로그
            console.log(`[월말평가 등수 계산] 날짜: ${date}, 내 점수: ${myPercentage}점, 전체인원수: ${monthlyTotalCount}, 등수: ${monthlyRank}, 내 점수 포함 여부: ${myScoreInArray}`);
          } else {
            console.log(`[월말평가 등수 계산 실패] 날짜: ${date}, myPercentage 계산 실패, monthlyEvaluationScore: ${studentRecord.monthlyEvaluationScore}`);
          }
        } else {
          if (!studentRecord) {
            console.log(`[월말평가 등수 계산 실패] 날짜: ${date}, studentRecord가 없음`);
          } else if (!studentRecord.monthlyEvaluationScore) {
            console.log(`[월말평가 등수 계산 실패] 날짜: ${date}, monthlyEvaluationScore가 없음`);
          } else if (monthlyScores.length === 0) {
            console.log(`[월말평가 등수 계산 실패] 날짜: ${date}, monthlyScores가 비어있음`);
          }
        }
      }
    }

    // 최근 기록이 있는 날짜 찾기 (날짜가 지정되지 않은 경우)
    let latestDate = null;
    if (!date) {
      const latestRecord = await StudentRecord.findOne({
        studentId: targetStudentId,
        classId: classIdObjectId,
      })
        .sort({ date: -1 })
        .select('date');

      if (latestRecord) {
        latestDate = latestRecord.date.toISOString().split('T')[0];
      }
    }

    // 데이터가 있는 날짜 목록 조회 (반 전체 기록 또는 학생 기록이 있는 날짜)
    const classRecordDates = await ClassRecord.find({ classId: classIdObjectId })
      .select('date')
      .sort({ date: -1 })
      .lean();
    
    const studentRecordDates = await StudentRecord.find({ 
      classId: classIdObjectId,
      studentId: targetStudentId,
    })
      .select('date')
      .sort({ date: -1 })
      .lean();

    // 모든 날짜를 Set으로 합쳐서 중복 제거
    const allDates = new Set();
    classRecordDates.forEach(record => {
      if (record.date) {
        allDates.add(record.date.toISOString().split('T')[0]);
      }
    });
    studentRecordDates.forEach(record => {
      if (record.date) {
        allDates.add(record.date.toISOString().split('T')[0]);
      }
    });

    // 날짜 배열로 변환하고 정렬 (최신순)
    const availableDates = Array.from(allDates)
      .filter(dateStr => {
        // 유효한 날짜인지 확인
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      })
      .sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }
        return dateB - dateA;
      });

    // 최근 10개의 일일테스트 점수 추이 데이터 조회
    // 중요: 반에서 학생이 삭제되어도 해당 날짜에 기록이 있는 모든 학생 기록을 기준으로 계산
    let recentRecords = [];
    
    if (availableDates.length > 0) {
      const recentDates = availableDates.slice(0, 10);
      const dateQueries = recentDates.map(dateStr => {
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            return null;
          }
          const startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
          return {
            date: { $gte: startDate, $lte: endDate }
          };
        } catch (err) {
          console.error(`날짜 파싱 오류 (${dateStr}):`, err);
          return null;
        }
      }).filter(query => query !== null); // null인 쿼리 제거

      // dateQueries가 비어있지 않은 경우에만 쿼리 실행
      if (dateQueries.length > 0) {
        try {
          recentRecords = await StudentRecord.find({
            classId: classIdObjectId,
            $or: dateQueries
          })
            .populate('studentId', 'name userId')
            .select('date studentId dailyTestScore')
            .sort({ date: -1 })
            .lean();
        } catch (queryError) {
          console.error('recentRecords 쿼리 오류:', queryError);
          // 쿼리 오류가 발생해도 빈 배열로 처리하여 계속 진행
          recentRecords = [];
        }
      }
    }

    // 날짜별로 데이터 그룹화
    const trendData = [];
    const dateGroups = {};

    recentRecords.forEach(record => {
      // date가 null이거나 undefined인 경우 건너뛰기
      if (!record.date) {
        return;
      }

      const dateStr = record.date.toISOString().split('T')[0];
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = {
          date: dateStr,
          myScore: null,
          classScores: [],
          maxScore: null,
          maxScoreStudent: null,
        };
      }

      // 내 점수
      // studentId가 populate된 경우 _id를 사용하고, 그렇지 않은 경우 직접 비교
      const recordStudentId = record.studentId 
        ? (record.studentId._id ? record.studentId._id.toString() : record.studentId.toString())
        : null;
      
      if (recordStudentId && recordStudentId === targetStudentId.toString()) {
        // 중요: null, undefined, 빈 문자열이 아니고, 유효한 형식인 경우만 처리
        if (record.dailyTestScore && 
            record.dailyTestScore !== null && 
            record.dailyTestScore !== undefined && 
            String(record.dailyTestScore).trim() !== '') {
          let percentage = null;
          if (typeof record.dailyTestScore === 'string' && record.dailyTestScore.includes('/')) {
            const [correct, total] = record.dailyTestScore.split('/').map(Number);
            // total이 0보다 크고, correct와 total이 모두 유효한 숫자인 경우만 처리
            if (total > 0 && !isNaN(correct) && !isNaN(total) && correct >= 0) {
              percentage = Math.round((correct / total) * 100);
            }
          }
          // percentage가 유효한 값인 경우만 설정
          if (percentage !== null && percentage >= 0 && percentage <= 100) {
            dateGroups[dateStr].myScore = percentage;
          }
        }
      }

      // 반 전체 점수 수집
      // 중요: null, undefined, 빈 문자열이 아니고, 유효한 형식인 경우만 통계에 포함
      if (record.dailyTestScore && 
          record.dailyTestScore !== null && 
          record.dailyTestScore !== undefined && 
          String(record.dailyTestScore).trim() !== '') {
        let percentage = null;
        if (typeof record.dailyTestScore === 'string' && record.dailyTestScore.includes('/')) {
          const [correct, total] = record.dailyTestScore.split('/').map(Number);
          // total이 0보다 크고, correct와 total이 모두 유효한 숫자인 경우만 처리
          if (total > 0 && !isNaN(correct) && !isNaN(total) && correct >= 0) {
            percentage = Math.round((correct / total) * 100);
          }
        }
        // percentage가 null이 아니고 유효한 값(0 이상 100 이하)인 경우만 배열에 추가
        if (percentage !== null && percentage >= 0 && percentage <= 100) {
          dateGroups[dateStr].classScores.push(percentage);
        }
      }
    });

    // 각 날짜별로 평균과 최고점 계산
    Object.values(dateGroups).forEach(group => {
      if (group.classScores.length > 0) {
        group.classAverage = Math.round(group.classScores.reduce((sum, score) => sum + score, 0) / group.classScores.length);
        group.maxScore = Math.max(...group.classScores);
      } else {
        // 점수가 없으면 null로 설정
        group.classAverage = null;
        group.maxScore = null;
      }
    });

    // 날짜순으로 정렬 (최신순, 최근 10개만)
    const sortedTrendData = Object.values(dateGroups)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .reverse() // 그래프는 오래된 것부터 최신순으로 표시
      .map(group => ({
        date: group.date,
        myScore: group.myScore !== null && group.myScore !== undefined ? group.myScore : null,
        classAverage: group.classAverage !== null && group.classAverage !== undefined ? group.classAverage : null,
        maxScore: group.maxScore !== null && group.maxScore !== undefined ? group.maxScore : null,
      }));
    
    console.log('trendData 생성 완료:', {
      dateGroupsCount: Object.keys(dateGroups).length,
      sortedTrendDataCount: sortedTrendData.length,
      sortedTrendData: sortedTrendData
    });

    res.json({
      success: true,
      data: {
        studentRecord: studentRecord || null,
        classRecord: classRecord || null,
        latestDate: latestDate,
        classAverage: classAverage,
        classMaxScore: classMaxScore,
        classMaxScoreStudent: classMaxScoreStudent,
        classMaxScoreCount: classMaxScoreCount,
        monthlyAverage: monthlyAverage,
        monthlyMax: monthlyMax,
        monthlyMaxStudent: monthlyMaxStudent,
        monthlyMaxScoreCount: monthlyMaxScoreCount,
        monthlyRank: monthlyRank,
        monthlyTotalCount: monthlyTotalCount,
        availableDates: availableDates,
        trendData: sortedTrendData,
      },
    });
  } catch (error) {
    console.error('========================================');
    console.error('내 기록 조회 오류 발생');
    console.error('========================================');
    console.error('에러 메시지:', error.message);
    console.error('에러 이름:', error.name);
    console.error('에러 스택:', error.stack);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
    }
    console.error('========================================');
    
    res.status(500).json({
      success: false,
      error: '기록을 가져오는 중 오류가 발생했습니다.',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        name: error.name 
      }),
    });
  }
};

