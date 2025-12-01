const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const User = require('../models/User');

// 모든 공지사항 조회 (최신순, 페이지네이션 지원)
exports.getAllNotices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    // MongoDB 연결 확인
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

    const totalNotices = await Notice.countDocuments();
    const totalPages = Math.ceil(totalNotices / limit);

    const notices = await Notice.find()
      .populate({
        path: 'author',
        select: 'name userId',
        strictPopulate: false // 참조가 없어도 에러 발생하지 않도록
      })
      .sort({ createdAt: -1 }) // 최신순 정렬
      .skip(skip)
      .limit(limit)
      .lean(); // 성능 향상 및 에러 방지

    res.json({
      success: true,
      count: notices.length,
      totalCount: totalNotices,
      totalPages: totalPages,
      currentPage: page,
      data: notices,
    });
  } catch (error) {
    console.error('공지사항 조회 오류:', error);
    console.error('에러 스택:', error.stack);
    // CORS 헤더 설정
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.status(500).json({
      success: false,
      error: '공지사항을 가져오는 중 오류가 발생했습니다',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// 특정 공지사항 조회
exports.getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('author', 'name userId');

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: '공지사항을 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: notice,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 공지사항 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '공지사항을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 새 공지사항 생성 (관리자만)
exports.createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user._id || req.user.id; // 인증 미들웨어에서 설정

    // 필수 필드 검증
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: '제목과 내용은 필수입니다',
      });
    }

    // 작성자 정보 가져오기
    const author = await User.findById(userId);
    if (!author) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다',
      });
    }

    // 공지사항 생성
    const notice = new Notice({
      title,
      content,
      author: userId,
      authorName: author.name,
      attachments: req.body.attachments || [],
    });

    const savedNotice = await notice.save();

    res.status(201).json({
      success: true,
      data: savedNotice,
    });
  } catch (error) {
    console.error('공지사항 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '공지사항을 생성하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 공지사항 수정 (관리자만)
exports.updateNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user._id || req.user.id;

    // 필수 필드 검증
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: '제목과 내용은 필수입니다',
      });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        error: '공지사항을 찾을 수 없습니다',
      });
    }

    // 작성자 확인 (선택사항 - 관리자는 모두 수정 가능하도록)
    const userIdStr = userId.toString ? userId.toString() : String(userId);
    if (notice.author.toString() !== userIdStr) {
      return res.status(403).json({
        success: false,
        error: '공지사항을 수정할 권한이 없습니다',
      });
    }

    notice.title = title;
    notice.content = content;
    notice.attachments = req.body.attachments || [];
    const updatedNotice = await notice.save();

    res.json({
      success: true,
      data: updatedNotice,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 공지사항 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '공지사항을 수정하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 공지사항 삭제 (관리자만)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        error: '공지사항을 찾을 수 없습니다',
      });
    }

    await Notice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '공지사항이 삭제되었습니다',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 공지사항 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '공지사항을 삭제하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

