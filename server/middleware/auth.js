const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 인증 미들웨어 (protect와 동일한 기능)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
      const decoded = jwt.verify(token, jwtSecret);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, error: '유저를 찾을 수 없습니다' });
      }

      next();
    } catch (error) {
      console.error('토큰 인증 오류:', error);
      return res.status(401).json({ success: false, error: '유효하지 않은 토큰입니다' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: '인증 토큰이 없습니다' });
  }
};

// 권한 확인 미들웨어
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType) && !(roles.includes('관리자') && req.user.isAdmin)) {
      return res.status(403).json({ 
        success: false, 
        error: `사용자 유형 (${req.user.userType})은 이 리소스에 접근할 권한이 없습니다` 
      });
    }
    next();
  };
};

// JWT 토큰 인증 미들웨어 (기존 authenticate 함수 - 하위 호환성)
const authenticate = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다',
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // JWT 토큰 검증
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret);

    // 사용자 정보를 req.user에 저장
    req.user = {
      userId: decoded.userId,
      id: decoded.id,
      userType: decoded.userType,
      isAdmin: decoded.isAdmin,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: '토큰이 만료되었습니다',
      });
    }
    return res.status(500).json({
      success: false,
      error: '인증 처리 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

module.exports = { protect, authorize, authenticate };

