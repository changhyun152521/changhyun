const PreviewCourse = require('../models/PreviewCourse');

// 모든 맛보기강좌 조회 (비회원 포함 모든 사용자 접근 가능)
exports.getAllPreviewCourses = async (req, res) => {
  try {
    console.log('\n=== 맛보기강좌 목록 조회 시작 ===');
    console.log('요청 URL:', req.url);
    console.log('요청 메서드:', req.method);
    
    // MongoDB 연결 확인
    const mongoose = require('mongoose');
    if (!mongoose.connection.readyState) {
      console.error('MongoDB 연결이 끊어졌습니다');
      // CORS 헤더 설정
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(500).json({
        success: false,
        error: '데이터베이스 연결 오류가 발생했습니다',
      });
    }
    
    const previewCourses = await PreviewCourse.find()
      .populate({
        path: 'createdBy',
        select: 'userId name email userType',
        strictPopulate: false // 참조가 없어도 에러 발생하지 않도록
      })
      .sort({ createdAt: -1 })
      .lean(); // 성능 향상 및 에러 방지
    
    console.log('맛보기강좌 개수:', previewCourses.length);
    console.log('맛보기강좌 데이터:', previewCourses.map(c => ({ id: c._id, title: c.title })));
    
    res.json({
      success: true,
      count: previewCourses.length,
      data: previewCourses,
    });
    
    console.log('=== 맛보기강좌 목록 조회 완료 ===\n');
  } catch (error) {
    console.error('\n=== 맛보기강좌 목록 가져오기 오류 ===');
    console.error('오류 타입:', error.constructor.name);
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    console.error('===============================\n');
    
    // CORS 헤더 설정
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.status(500).json({
      success: false,
      error: '맛보기강좌 목록을 가져오는 중 오류가 발생했습니다',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 특정 맛보기강좌 조회
exports.getPreviewCourseById = async (req, res) => {
  try {
    const previewCourse = await PreviewCourse.findById(req.params.id)
      .populate('createdBy', 'userId name email userType');
    
    if (!previewCourse) {
      return res.status(404).json({
        success: false,
        error: '맛보기강좌를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: previewCourse,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 맛보기강좌 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '맛보기강좌를 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 새 맛보기강좌 생성 (관리자만)
exports.createPreviewCourse = async (req, res) => {
  try {
    const { title, videoLink } = req.body;

    // 필수 필드 검증
    if (!title || !videoLink) {
      return res.status(400).json({
        success: false,
        error: '강의 제목과 유튜브 링크는 필수입니다',
      });
    }

    // YouTube 링크 유효성 검증
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoLink)) {
      return res.status(400).json({
        success: false,
        error: '올바른 YouTube 링크 형식이 아닙니다',
      });
    }

    const newPreviewCourse = new PreviewCourse({
      title: title.trim(),
      videoLink: videoLink.trim(),
      createdBy: req.user.id, // JWT 미들웨어에서 설정된 사용자 ID
    });

    const savedPreviewCourse = await newPreviewCourse.save();

    // populate하여 반환
    const populatedPreviewCourse = await PreviewCourse.findById(savedPreviewCourse._id)
      .populate('createdBy', 'userId name email userType');

    res.status(201).json({
      success: true,
      message: '맛보기강좌가 성공적으로 생성되었습니다',
      data: populatedPreviewCourse,
    });
  } catch (error) {
    console.error('맛보기강좌 생성 오류:', error);
    
    // Mongoose 유효성 검사 오류 처리
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }
    res.status(500).json({
      success: false,
      error: '맛보기강좌 생성 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 맛보기강좌 정보 수정 (관리자만)
exports.updatePreviewCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, videoLink } = req.body;

    const updateData = {};

    if (title) {
      updateData.title = title.trim();
    }

    if (videoLink) {
      // YouTube 링크 유효성 검증
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(videoLink)) {
        return res.status(400).json({
          success: false,
          error: '올바른 YouTube 링크 형식이 아닙니다',
        });
      }
      updateData.videoLink = videoLink.trim();
    }

    const previewCourse = await PreviewCourse.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true, // 업데이트된 문서 반환
        runValidators: true, // 유효성 검증 실행
      }
    )
      .populate('createdBy', 'userId name email userType');

    if (!previewCourse) {
      return res.status(404).json({
        success: false,
        error: '맛보기강좌를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '맛보기강좌 정보가 성공적으로 수정되었습니다',
      data: previewCourse,
    });
  } catch (error) {
    console.error('맛보기강좌 수정 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 맛보기강좌 ID입니다',
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }
    res.status(500).json({
      success: false,
      error: '맛보기강좌 수정 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 맛보기강좌 삭제 (관리자만)
exports.deletePreviewCourse = async (req, res) => {
  try {
    const previewCourse = await PreviewCourse.findById(req.params.id);

    if (!previewCourse) {
      return res.status(404).json({
        success: false,
        error: '맛보기강좌를 찾을 수 없습니다',
      });
    }

    await PreviewCourse.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '맛보기강좌가 성공적으로 삭제되었습니다',
    });
  } catch (error) {
    console.error('맛보기강좌 삭제 오류:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 맛보기강좌 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '맛보기강좌 삭제 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

