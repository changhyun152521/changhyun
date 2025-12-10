const ClassRecord = require('../models/ClassRecord');
const Class = require('../models/Class');
const User = require('../models/User');
const ParentStudentLink = require('../models/ParentStudentLink');
const mongoose = require('mongoose');

// 모든 교실관리 기록 조회
exports.getAllClassRecords = async (req, res) => {
  try {
    const { classId, date } = req.query;
    
    const query = {};
    if (classId) {
      query.classId = classId;
    }
    if (date) {
      // 날짜 범위로 검색 (하루 전체)
      // YYYY-MM-DD 형식의 문자열을 로컬 시간대 기준으로 파싱
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // 월은 0부터 시작
        const day = parseInt(dateParts[2], 10);
        
        // 로컬 시간대 기준으로 날짜 생성 (시간대 문제 방지)
        const startDate = new Date(year, month, day, 0, 0, 0, 0);
        const endDate = new Date(year, month, day, 23, 59, 59, 999);
        
        query.date = { $gte: startDate, $lte: endDate };
      } else {
        // 기존 방식 (하위 호환성)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const records = await ClassRecord.find(query)
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email')
      .sort({ date: -1, updatedAt: -1, createdAt: -1 }); // updatedAt 기준으로 최신 수정된 데이터 우선

    // 디버깅: 날짜와 과목 정보 로깅
    if (date) {
      console.log(`[ClassRecords] 날짜 ${date} 조회:`, {
        query: query,
        foundRecords: records.length,
        records: records.map(r => ({
          id: r._id,
          date: r.date,
          dateString: r.date ? new Date(r.date).toISOString().split('T')[0] : null,
          subject: r.subject,
          mainUnit: r.mainUnit,
          subUnit: r.subUnit,
          updatedAt: r.updatedAt,
          createdAt: r.createdAt,
        })),
      });
    }

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('교실관리 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '교실관리 기록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 학생/학부모가 자신의 반에 대한 교실관리 기록 조회
exports.getMyClassRecords = async (req, res) => {
  try {
    // req.user가 없으면 에러
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
      });
    }

    const userId = req.user.id;
    const { classId, date } = req.query;

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

    // 반 정보 확인
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: '반을 찾을 수 없습니다.',
      });
    }

    // 학생이 해당 반에 속해있는지 확인
    const isStudentInClass = classData.students.some(
      (id) => id.toString() === userId.toString()
    );

    // 학부모인 경우 자녀 학생이 해당 반에 속해있는지 확인
    let isAuthorized = isStudentInClass;
    if (user.userType === '학부모' && !isStudentInClass) {
      const parentLinks = await ParentStudentLink.find({ parentId: userId });
      const studentIds = parentLinks.map(link => link.studentId.toString());
      isAuthorized = classData.students.some(
        (id) => studentIds.includes(id.toString())
      );
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: '해당 반에 대한 접근 권한이 없습니다.',
      });
    }

    // 날짜 범위로 검색
    const query = { classId };
    if (date) {
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        
        const startDate = new Date(year, month, day, 0, 0, 0, 0);
        const endDate = new Date(year, month, day, 23, 59, 59, 999);
        
        query.date = { $gte: startDate, $lte: endDate };
      } else {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const records = await ClassRecord.find(query)
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email')
      .sort({ date: -1, updatedAt: -1, createdAt: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('교실관리 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '교실관리 기록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 특정 교실관리 기록 조회 (ID로)
exports.getClassRecordById = async (req, res) => {
  try {
    const record = await ClassRecord.findById(req.params.id)
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        error: '교실관리 기록을 찾을 수 없습니다',
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
      error: '교실관리 기록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 새 교실관리 기록 생성
exports.createClassRecord = async (req, res) => {
  try {
    const {
      date,
      classId,
      className,
      progress,
      assignment,
      hasVideo,
    } = req.body;

    // 필수 필드 검증
    if (!date || !classId || !className) {
      return res.status(400).json({
        success: false,
        error: '일시, 반 ID, 반명은 필수입니다',
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

    // 반명 일치 확인
    if (classData.className !== className.trim()) {
      return res.status(400).json({
        success: false,
        error: '반명이 일치하지 않습니다',
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

    // 같은 반의 같은 날짜에 이미 기록이 있는지 확인
    const startDate = new Date(recordDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(recordDate);
    endDate.setHours(23, 59, 59, 999);

    const existingRecord = await ClassRecord.findOne({
      classId,
      date: { $gte: startDate, $lte: endDate },
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        error: '해당 날짜에 이미 교실관리 기록이 존재합니다',
        data: existingRecord,
      });
    }

    const newRecord = new ClassRecord({
      date: recordDate,
      classId,
      className: className.trim(),
      progress: progress ? progress.trim() : '',
      assignment: assignment ? assignment.trim() : '',
      hasVideo: hasVideo === true || hasVideo === 'true' || hasVideo === 'O',
      subject: subject ? subject.trim() : '',
      mainUnit: mainUnit ? mainUnit.trim() : '',
      subUnit: subUnit ? subUnit.trim() : '',
      createdBy: req.user.id,
    });

    const savedRecord = await newRecord.save();

    // populate하여 반환
    const populatedRecord = await ClassRecord.findById(savedRecord._id)
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email');

    res.status(201).json({
      success: true,
      message: '교실관리 기록이 성공적으로 생성되었습니다',
      data: populatedRecord,
    });
  } catch (error) {
    console.error('교실관리 기록 생성 오류:', error);
    
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
        error: '해당 날짜에 이미 교실관리 기록이 존재합니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '교실관리 기록 생성 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 교실관리 기록 수정
exports.updateClassRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      classId,
      className,
      progress,
      assignment,
      hasVideo,
      subject,
      mainUnit,
      subUnit,
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

    // 반명 변경
    if (className) {
      updateData.className = className.trim();
    }

    // 진도 변경
    if (progress !== undefined) {
      updateData.progress = progress ? progress.trim() : '';
    }

    // 과제 변경
    if (assignment !== undefined) {
      updateData.assignment = assignment ? assignment.trim() : '';
    }

    // 영상여부 변경
    if (hasVideo !== undefined) {
      updateData.hasVideo = hasVideo === true || hasVideo === 'true' || hasVideo === 'O';
    }

    // 과목 변경
    if (subject !== undefined) {
      updateData.subject = subject ? subject.trim() : '';
    }

    // 대단원 변경
    if (mainUnit !== undefined) {
      updateData.mainUnit = mainUnit ? mainUnit.trim() : '';
    }

    // 소단원 변경
    if (subUnit !== undefined) {
      updateData.subUnit = subUnit ? subUnit.trim() : '';
    }

    // 날짜나 반이 변경된 경우 중복 체크
    if (date || classId) {
      const currentRecord = await ClassRecord.findById(id);
      if (!currentRecord) {
        return res.status(404).json({
          success: false,
          error: '교실관리 기록을 찾을 수 없습니다',
        });
      }

      const finalClassId = classId || currentRecord.classId;
      const finalDate = date ? new Date(date) : currentRecord.date;

      const startDate = new Date(finalDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(finalDate);
      endDate.setHours(23, 59, 59, 999);

      const existingRecord = await ClassRecord.findOne({
        classId: finalClassId,
        date: { $gte: startDate, $lte: endDate },
        _id: { $ne: id },
      });

      if (existingRecord) {
        return res.status(400).json({
          success: false,
          error: '해당 날짜에 이미 교실관리 기록이 존재합니다',
        });
      }
    }

    const record = await ClassRecord.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('classId', 'grade className instructorName')
      .populate('createdBy', 'userId name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        error: '교실관리 기록을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '교실관리 기록이 성공적으로 수정되었습니다',
      data: record,
    });
  } catch (error) {
    console.error('교실관리 기록 수정 오류:', error);
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
        error: '해당 날짜에 이미 교실관리 기록이 존재합니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '교실관리 기록 수정 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 교실관리 기록 삭제
exports.deleteClassRecord = async (req, res) => {
  try {
    const record = await ClassRecord.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: '교실관리 기록을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '교실관리 기록이 성공적으로 삭제되었습니다',
      data: {},
    });
  } catch (error) {
    console.error('교실관리 기록 삭제 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 기록 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '교실관리 기록 삭제 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

