const AttendanceComment = require('../models/AttendanceComment');

// 모든 댓글 조회 (비회원 포함 모두 볼 수 있음, 비공개는 작성자/관리자만 상세 내용 확인 가능)
exports.getAllComments = async (req, res) => {
  try {
    // 인증 정보가 있으면 사용, 없으면 null
    let user = null;
    let userId = null;
    let isAdmin = false;

    // 토큰이 있으면 사용자 정보 가져오기
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
        const decoded = jwt.verify(token, jwtSecret);
        user = await User.findById(decoded.id).select('-password');
        
        if (user) {
          userId = user._id;
          isAdmin = user.isAdmin === true || user.isAdmin === 'true' || user.isAdmin === 1 || user.userType === '강사';
        }
      } catch (error) {
        // 토큰이 유효하지 않으면 비회원으로 처리
        console.log('토큰 검증 실패, 비회원으로 처리:', error.message);
      }
    }

    // 페이지네이션 파라미터
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // 전체 댓글 수 계산
    const totalCount = await AttendanceComment.countDocuments({});

    // 모든 댓글 조회 (공개/비공개 모두) - 페이지네이션 적용
    const comments = await AttendanceComment.find({})
      .populate('author', 'name userId')
      .populate('reply.author', 'name userId')
      .sort({ createdAt: -1 }) // 최신순 정렬
      .skip(skip)
      .limit(limit);

    // 클라이언트에서 처리할 수 있도록 모든 댓글 반환
    // 비공개 댓글의 경우 작성자 ID 정보도 함께 전달
    const commentsWithAccess = comments.map(comment => {
      const commentObj = comment.toObject();
      
      if (!comment.isPublic) {
        // 비공개 댓글인 경우
        const isOwner = userId && comment.author && (
          comment.author._id.toString() === userId.toString() || 
          comment.author.toString() === userId.toString()
        );
        
        // 작성자/관리자가 아니면 작성자 정보 숨김
        if (!isOwner && !isAdmin) {
          commentObj.author = {
            _id: comment.author._id,
            name: '***',
            userId: '***'
          };
          commentObj.authorName = '***';
          commentObj.hideContent = true; // 상세 내용 숨김 플래그
        }
      }
      
      return commentObj;
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      count: commentsWithAccess.length,
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: page,
      data: commentsWithAccess,
    });
  } catch (error) {
    console.error('수강확인 댓글 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '수강확인 댓글을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 댓글 생성
exports.createComment = async (req, res) => {
  try {
    const { content, courseName, className, isPublic } = req.body;
    const user = req.user; // protect 미들웨어를 통해 User 객체가 들어옴

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '내용은 필수입니다',
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다',
      });
    }

    const newComment = new AttendanceComment({
      content: content.trim(),
      author: user._id,
      authorName: user.name,
      courseName: courseName || '',
      className: className || '',
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    const savedComment = await newComment.save();
    const populatedComment = await AttendanceComment.findById(savedComment._id)
      .populate('author', 'name userId');

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    console.error('수강확인 댓글 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '수강확인 댓글을 생성하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 댓글 수정
exports.updateComment = async (req, res) => {
  try {
    const { content, courseName, className, isPublic } = req.body;
    const user = req.user;
    const userId = user._id || user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '내용은 필수입니다',
      });
    }

    const comment = await AttendanceComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: '댓글을 찾을 수 없습니다',
      });
    }

    const userIdStr = userId.toString ? userId.toString() : String(userId);
    if (comment.author.toString() !== userIdStr) {
      return res.status(403).json({
        success: false,
        error: '댓글을 수정할 권한이 없습니다',
      });
    }

    comment.content = content.trim();
    if (courseName !== undefined) comment.courseName = courseName;
    if (className !== undefined) comment.className = className;
    if (isPublic !== undefined) comment.isPublic = isPublic;
    
    const updatedComment = await comment.save();
    const populatedComment = await AttendanceComment.findById(updatedComment._id)
      .populate('author', 'name userId');

    res.json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    console.error('수강확인 댓글 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '수강확인 댓글을 수정하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const user = req.user;
    const userId = user._id || user.id;

    const comment = await AttendanceComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: '댓글을 찾을 수 없습니다',
      });
    }

    // 관리자이거나 작성자 본인만 삭제 가능
    const isAdmin = user?.isAdmin === true || user?.isAdmin === 'true' || user?.isAdmin === 1;
    const userIdStr = userId.toString ? userId.toString() : String(userId);
    const isOwner = comment.author.toString() === userIdStr;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: '댓글을 삭제할 권한이 없습니다',
      });
    }

    await AttendanceComment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '댓글이 삭제되었습니다',
    });
  } catch (error) {
    console.error('수강확인 댓글 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '수강확인 댓글을 삭제하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 답글 작성 (관리자만 가능)
exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const user = req.user;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '답글 내용은 필수입니다',
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다',
      });
    }

    // 관리자 권한 확인
    const isAdmin = user.isAdmin === true || user.isAdmin === 'true' || user.isAdmin === 1 || user.userType === '강사';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: '답글을 작성할 권한이 없습니다 (관리자만 가능)',
      });
    }

    const comment = await AttendanceComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: '댓글을 찾을 수 없습니다',
      });
    }

    // 답글 추가
    comment.reply = {
      content: content.trim(),
      author: user._id,
      authorName: user.name,
      createdAt: new Date(),
    };

    const updatedComment = await comment.save();
    const populatedComment = await AttendanceComment.findById(updatedComment._id)
      .populate('author', 'name userId')
      .populate('reply.author', 'name userId');

    res.json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    console.error('답글 작성 오류:', error);
    res.status(500).json({
      success: false,
      error: '답글을 작성하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 답글 수정 (관리자만 가능)
exports.updateReply = async (req, res) => {
  try {
    const { content } = req.body;
    const user = req.user;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '답글 내용은 필수입니다',
      });
    }

    // 관리자 권한 확인
    const isAdmin = user.isAdmin === true || user.isAdmin === 'true' || user.isAdmin === 1 || user.userType === '강사';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: '답글을 수정할 권한이 없습니다 (관리자만 가능)',
      });
    }

    const comment = await AttendanceComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: '댓글을 찾을 수 없습니다',
      });
    }

    if (!comment.reply || !comment.reply.content) {
      return res.status(404).json({
        success: false,
        error: '답글이 없습니다',
      });
    }

    // 답글 수정
    comment.reply.content = content.trim();
    comment.reply.createdAt = new Date();

    const updatedComment = await comment.save();
    const populatedComment = await AttendanceComment.findById(updatedComment._id)
      .populate('author', 'name userId')
      .populate('reply.author', 'name userId');

    res.json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    console.error('답글 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '답글을 수정하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 답글 삭제 (관리자만 가능)
exports.deleteReply = async (req, res) => {
  try {
    const user = req.user;

    // 관리자 권한 확인
    const isAdmin = user.isAdmin === true || user.isAdmin === 'true' || user.isAdmin === 1 || user.userType === '강사';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: '답글을 삭제할 권한이 없습니다 (관리자만 가능)',
      });
    }

    const comment = await AttendanceComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: '댓글을 찾을 수 없습니다',
      });
    }

    // 답글 삭제
    comment.reply = undefined;

    await comment.save();

    res.json({
      success: true,
      message: '답글이 삭제되었습니다',
    });
  } catch (error) {
    console.error('답글 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '답글을 삭제하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

