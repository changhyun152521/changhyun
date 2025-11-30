const User = require('../models/User');
const Class = require('../models/Class');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 모든 유저 조회
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // 비밀번호 제외
      .sort({ createdAt: -1 }); // 생성일 기준 최신순 정렬
    
    // 각 사용자가 속한 반 정보 및 연동 정보 조회
    const usersWithClasses = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        // 학생 또는 학부모인 경우에만 반 정보 조회
        if (user.userType === '학생' || user.userType === '학부모') {
          const classes = await Class.find({ students: user._id })
            .select('grade className')
            .lean();
          userObj.classes = classes.map(cls => `${cls.grade} ${cls.className}`);
        } else {
          userObj.classes = [];
        }
        
        // 연동 정보 조회 (실제 존재하는 사용자만 표시)
        if (user.userType === '학생') {
          // 학생인 경우: 연동된 학부모 찾기
          // 방법 1: 새로운 형식 (학생userId_parent)
          let linkedParent = await User.findOne({ 
            userId: `${user.userId}_parent`, 
            userType: '학부모' 
          }).select('userId name').lean();
          
          // 방법 2: 기존 형식 (parentContact를 userId로 사용)
          if (!linkedParent && user.parentContact) {
            linkedParent = await User.findOne({ 
              userId: user.parentContact, 
              userType: '학부모' 
            }).select('userId name').lean();
          }
          
          // 연동된 학부모가 실제로 존재하는지 확인
          userObj.linkedUser = linkedParent ? {
            userId: linkedParent.userId,
            name: linkedParent.name,
            userType: '학부모'
          } : null;
        } else if (user.userType === '학부모') {
          // 학부모인 경우: 연동된 학생 찾기
          // 학부모의 userId(부모님 연락처)와 parentContact가 일치하는 학생 찾기
          let linkedStudent = null;
          if (user.userId && user.studentContact) {
            linkedStudent = await User.findOne({ 
              $or: [
                { phone: user.studentContact.trim(), userType: '학생' },
                { studentContact: user.studentContact.trim(), userType: '학생' },
                { parentContact: user.userId.trim(), userType: '학생' }
              ]
            }).select('userId name').lean();
          }
          
          // 연동된 학생이 실제로 존재하는지 확인
          userObj.linkedUser = linkedStudent ? {
            userId: linkedStudent.userId,
            name: linkedStudent.name,
            userType: '학생'
          } : null;
        } else {
          userObj.linkedUser = null;
        }
        
        return userObj;
      })
    );
    
    // Promise.all 후에도 정렬 순서가 유지되도록 다시 정렬 (안전장치)
    usersWithClasses.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // 내림차순 (최신순)
    });
    
    res.json({
      success: true,
      count: usersWithClasses.length,
      data: usersWithClasses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '유저 목록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 특정 유저 조회 (ID로)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '유저를 찾을 수 없습니다',
      });
    }

    const userObj = user.toObject();
    
    // 학생 또는 학부모인 경우에만 반 정보 조회
    if (user.userType === '학생' || user.userType === '학부모') {
      const classes = await Class.find({ students: user._id })
        .select('_id grade className')
        .lean();
      userObj.classes = classes;
    } else {
      userObj.classes = [];
    }

    res.json({
      success: true,
      data: userObj,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 유저 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '유저를 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// userId로 유저 조회
exports.getUserByUserId = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '유저를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '유저를 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 관리자용 유저 생성 (강사 포함 가능)
exports.createUserByAdmin = async (req, res) => {
  try {
    const {
      userId,
      password,
      name,
      email,
      phone,
      schoolName,
      studentContact,
      parentContact,
      userType,
      classIds, // 반 ID 배열
    } = req.body;

    // 필수 필드 검증
    if (!userId || !password || !name || !email || !phone || !schoolName || !studentContact || !parentContact || !userType) {
      return res.status(400).json({
        success: false,
        error: '모든 필수 필드를 입력해주세요',
      });
    }

    // userType 유효성 검증 (관리자는 강사도 생성 가능)
    const validUserTypes = ['학생', '학부모', '강사'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        error: '사용자 유형은 학생, 학부모, 강사 중 하나여야 합니다',
      });
    }

    // 중복 체크
    const existingUser = await User.findOne({
      $or: [{ userId }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.userId === userId ? '이미 사용 중인 아이디입니다' : '이미 사용 중인 이메일입니다',
      });
    }

    // 비밀번호 검증 및 암호화
    if (!password || password.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '비밀번호를 입력해주세요',
      });
    }

    // 비밀번호 암호화
    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (hashError) {
      console.error('비밀번호 암호화 오류:', hashError);
      return res.status(500).json({
        success: false,
        error: '비밀번호 암호화 중 오류가 발생했습니다',
      });
    }

    const user = new User({
      userId,
      password: hashedPassword,
      name,
      email,
      phone,
      schoolName,
      studentContact,
      parentContact,
      userType, // 사용자 유형 (학생, 학부모, 강사)
      // isAdmin은 pre-save hook에서 자동으로 설정됨 (강사일 때 true)
    });

    const savedUser = await user.save();
    
    // 학생인 경우 연동된 학부모 계정 자동 생성
    let parentUser = null;
    if (userType === '학생') {
      try {
        // 학부모 userId는 부모님 연락처(parentContact)로 생성
        const parentUserId = parentContact.trim();
        const parentEmail = `${parentUserId}@mathchang.com`;
        
        const existingParent = await User.findOne({
          $or: [
            { userId: parentUserId },
            { email: parentEmail }
          ]
        });

        if (!existingParent) {
          // 학부모 계정 생성 (userId와 비밀번호 모두 부모님 연락처로 설정)
          const parentPassword = parentContact.trim();
          const saltRounds = 10;
          const hashedParentPassword = await bcrypt.hash(parentPassword, saltRounds);

          const parentUserData = new User({
            userId: parentUserId, // 부모님 연락처를 userId로 사용
            password: hashedParentPassword, // 부모님 연락처를 비밀번호로 사용
            name: `${name}부모님`,
            email: parentEmail,
            phone: parentContact,
            schoolName: schoolName,
            studentContact: studentContact,
            parentContact: parentContact,
            userType: '학부모',
            isAdmin: false,
          });

          parentUser = await parentUserData.save();
          console.log('학부모 계정 자동 생성 완료:', parentUser.userId);
        } else {
          parentUser = existingParent;
          console.log('학부모 계정이 이미 존재합니다:', existingParent.userId);
        }
      } catch (parentError) {
        console.error('학부모 계정 생성 오류:', parentError);
        // 학부모 계정 생성 실패해도 학생 계정은 생성됨
      }
    }
    
    // 학생 또는 학부모인 경우 반에 추가
    if ((userType === '학생' || userType === '학부모') && classIds && Array.isArray(classIds) && classIds.length > 0) {
      // 유효한 반 ID인지 확인
      const validClasses = await Class.find({ _id: { $in: classIds } });
      if (validClasses.length !== classIds.length) {
        return res.status(400).json({
          success: false,
          error: '일부 반을 찾을 수 없습니다',
        });
      }
      
      // 각 반에 사용자 추가
      await Promise.all(
        classIds.map(async (classId) => {
          await Class.findByIdAndUpdate(classId, {
            $addToSet: { students: savedUser._id }, // 중복 방지
          });
        })
      );

      // 학생인 경우 생성된 학부모도 같은 반에 추가
      if (userType === '학생' && parentUser) {
        await Promise.all(
          classIds.map(async (classId) => {
            await Class.findByIdAndUpdate(classId, {
              $addToSet: { students: parentUser._id }, // 중복 방지
            });
          })
        );
      }
    }
    
    // 비밀번호 제외하고 응답
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    const responseData = {
      success: true,
      message: '유저가 성공적으로 생성되었습니다',
      data: userResponse,
    };

    // 학부모 계정이 생성된 경우 응답에 포함
    if (parentUser) {
      const parentResponse = parentUser.toObject();
      delete parentResponse.password;
      responseData.parentAccount = parentResponse;
      responseData.message = '학생 계정과 연동된 학부모 계정이 자동으로 생성되었습니다';
    }

    res.status(201).json(responseData);
  } catch (error) {
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
        error: '이미 사용 중인 아이디 또는 이메일입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '유저를 생성하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 새 유저 생성 (일반 회원가입용)
exports.createUser = async (req, res) => {
  try {
    const {
      userId,
      password,
      name,
      email,
      phone,
      schoolName,
      studentContact,
      parentContact,
      userType,
    } = req.body;

    // 필수 필드 검증
    if (!userId || !password || !name || !email || !phone || !schoolName || !studentContact || !parentContact || !userType) {
      return res.status(400).json({
        success: false,
        error: '모든 필수 필드를 입력해주세요',
      });
    }

    // userType 유효성 검증
    const validUserTypes = ['학생', '학부모'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        error: '사용자 유형은 학생, 학부모 중 하나여야 합니다',
      });
    }

    // 강사는 회원가입으로 생성할 수 없음 (관리자 권한이 있는 사용자만 지정 가능)
    if (userType === '강사') {
      return res.status(403).json({
        success: false,
        error: '강사는 회원가입으로 생성할 수 없습니다. 관리자 권한이 필요합니다',
      });
    }

    console.log('회원가입 - userType:', userType);
    console.log('회원가입 - 받은 데이터:', { userId, name, email, userType });

    // 중복 체크
    const existingUser = await User.findOne({
      $or: [{ userId }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.userId === userId ? '이미 사용 중인 아이디입니다' : '이미 사용 중인 이메일입니다',
      });
    }

    // 비밀번호 검증 및 암호화
    if (!password || password.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '비밀번호를 입력해주세요',
      });
    }

    // 비밀번호 암호화 (명시적으로 암호화하여 저장)
    console.log('회원가입 - 비밀번호 암호화 시작');
    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('회원가입 - 비밀번호 암호화 완료:', hashedPassword.substring(0, 20) + '...');
    } catch (hashError) {
      console.error('비밀번호 암호화 오류:', hashError);
      return res.status(500).json({
        success: false,
        error: '비밀번호 암호화 중 오류가 발생했습니다',
      });
    }

    const user = new User({
      userId,
      password: hashedPassword, // 암호화된 비밀번호 저장
      name,
      email,
      phone,
      schoolName,
      studentContact,
      parentContact,
      userType, // 사용자 유형 (학생, 학부모, 강사)
      // isAdmin은 pre-save hook에서 자동으로 설정됨 (강사일 때 true)
    });

    console.log('회원가입 - User 객체 생성:', { userId: user.userId, userType: user.userType, isAdmin: user.isAdmin });

    const savedUser = await user.save();
    
    // 학생인 경우 연동된 학부모 계정 자동 생성
    let parentUser = null;
    if (userType === '학생') {
      try {
        // 학부모 userId는 부모님 연락처(parentContact)로 생성
        const parentUserId = parentContact.trim();
        const parentEmail = `${parentUserId}@mathchang.com`;
        
        const existingParent = await User.findOne({
          $or: [
            { userId: parentUserId },
            { email: parentEmail }
          ]
        });

        if (!existingParent) {
          // 학부모 계정 생성 (userId와 비밀번호 모두 부모님 연락처로 설정)
          const parentPassword = parentContact.trim();
          const saltRounds = 10;
          const hashedParentPassword = await bcrypt.hash(parentPassword, saltRounds);

          const parentUserData = new User({
            userId: parentUserId, // 부모님 연락처를 userId로 사용
            password: hashedParentPassword, // 부모님 연락처를 비밀번호로 사용
            name: `${name}부모님`,
            email: parentEmail,
            phone: parentContact,
            schoolName: schoolName,
            studentContact: studentContact,
            parentContact: parentContact,
            userType: '학부모',
            isAdmin: false,
          });

          parentUser = await parentUserData.save();
          console.log('회원가입 - 학부모 계정 자동 생성 완료:', parentUser.userId);
        } else {
          parentUser = existingParent;
          console.log('회원가입 - 학부모 계정이 이미 존재합니다:', existingParent.userId);
        }
      } catch (parentError) {
        console.error('회원가입 - 학부모 계정 생성 오류:', parentError);
        // 학부모 계정 생성 실패해도 학생 계정은 생성됨
      }
    }
    
    console.log('회원가입 - 저장된 User:', { 
      userId: savedUser.userId, 
      userType: savedUser.userType, 
      isAdmin: savedUser.isAdmin 
    });
    
    // 비밀번호 제외하고 응답
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    const responseData = {
      success: true,
      message: '유저가 성공적으로 생성되었습니다',
      data: userResponse,
    };

    // 학부모 계정이 생성된 경우 응답에 포함
    if (parentUser) {
      const parentResponse = parentUser.toObject();
      delete parentResponse.password;
      responseData.parentAccount = parentResponse;
      responseData.message = '학생 계정과 연동된 학부모 계정이 자동으로 생성되었습니다';
    }

    res.status(201).json(responseData);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: '유효성 검증 실패',
        details: errors,
      });
    }
    res.status(500).json({
      success: false,
      error: '유저를 생성하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 유저 정보 수정
exports.updateUser = async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      phone,
      schoolName,
      studentContact,
      parentContact,
      password,
      userType,
      profileImage, // 프로필 사진 (강사회원만)
      classIds, // 반 ID 배열
    } = req.body;

    // 기존 사용자 정보 가져오기 (학부모 연동 업데이트를 위해)
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '유저를 찾을 수 없습니다',
      });
    }

    const updateData = {};
    
    // userId 변경이 있는 경우 중복 체크
    if (userId) {
      const existingUserId = await User.findOne({
        userId,
        _id: { $ne: req.params.id },
      });
      if (existingUserId) {
        return res.status(400).json({
          success: false,
          error: '이미 사용 중인 아이디입니다',
        });
      }
      updateData.userId = userId;
    }
    
    // email 변경이 있는 경우 중복 체크
    if (email) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: req.params.id },
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: '이미 사용 중인 이메일입니다',
        });
      }
      updateData.email = email.toLowerCase().trim();
    }
    
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (schoolName) updateData.schoolName = schoolName;
    if (studentContact) updateData.studentContact = studentContact;
    
    // 강사회원인 경우에만 프로필 사진 업데이트
    if (profileImage !== undefined && existingUser.userType === '강사') {
      updateData.profileImage = profileImage.trim();
    }
    
    // 학생회원의 학부모 전화번호가 변경되면 연동된 학부모의 정보만 업데이트
    if (parentContact && existingUser.userType === '학생') {
      updateData.parentContact = parentContact;
      
      // 연동된 학부모 계정 찾기 (부모님 연락처를 userId로 사용)
        const linkedParent = await User.findOne({
        userId: existingUser.parentContact ? existingUser.parentContact.trim() : parentContact.trim(),
          userType: '학부모',
        });
        
        if (linkedParent) {
        // 학부모의 userId는 부모님 연락처로 유지, phone과 parentContact만 업데이트
            linkedParent.phone = parentContact;
            linkedParent.parentContact = parentContact;
        // studentContact도 학생의 phone으로 업데이트
        if (phone) {
          linkedParent.studentContact = phone;
        }
            await linkedParent.save();
        console.log(`학부모 연락처 업데이트 (userId 유지): ${linkedParent.userId} - phone: ${parentContact}`);
      }
    } else if (parentContact) {
      updateData.parentContact = parentContact;
    }
    
    // 학부모 회원의 정보가 변경되면 연동된 학생의 정보도 업데이트 (연동 정보는 유지)
    if (existingUser.userType === '학부모' && studentContact) {
      // 연동된 학생 계정 찾기 (학부모의 userId가 부모님 연락처이므로, parentContact가 학부모 userId와 일치하는 학생 찾기)
      const linkedStudent = await User.findOne({
        parentContact: existingUser.userId.trim(),
        userType: '학생',
      });
      
      if (linkedStudent) {
        // 학생의 phone과 studentContact 업데이트
        if (phone) {
          linkedStudent.phone = phone;
          linkedStudent.studentContact = phone;
        }
        if (studentContact) {
          linkedStudent.studentContact = studentContact;
          linkedStudent.phone = studentContact;
        }
        await linkedStudent.save();
        console.log(`학생 연락처 업데이트 (연동 유지): ${linkedStudent.userId} - phone: ${studentContact || phone}`);
      }
    }
    if (userType) {
      // userType 유효성 검증
      const validUserTypes = ['학생', '학부모', '강사'];
      if (!validUserTypes.includes(userType)) {
        return res.status(400).json({
          success: false,
          error: '사용자 유형은 학생, 학부모, 강사 중 하나여야 합니다',
        });
      }
      updateData.userType = userType;
      // userType이 변경되면 isAdmin도 자동 업데이트
      updateData.isAdmin = userType === '강사';
    }
    if (password) {
      // 비밀번호 검증 및 암호화
      if (password.trim() === '') {
        return res.status(400).json({
          success: false,
          error: '비밀번호를 입력해주세요',
        });
      }
      // findByIdAndUpdate는 pre-save hook을 실행하지 않으므로 여기서 암호화
      const saltRounds = 10;
      try {
        updateData.password = await bcrypt.hash(password, saltRounds);
      } catch (hashError) {
        console.error('비밀번호 암호화 오류:', hashError);
        return res.status(500).json({
          success: false,
          error: '비밀번호 암호화 중 오류가 발생했습니다',
        });
      }
    }

    // 이메일 중복 체크 (다른 유저가 사용 중인지 확인)
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: '이미 사용 중인 이메일입니다',
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true, // 업데이트된 문서 반환
        runValidators: true, // 유효성 검증 실행
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '유저를 찾을 수 없습니다',
      });
    }

    // 학생 또는 학부모인 경우 반 정보 업데이트
    if ((user.userType === '학생' || user.userType === '학부모') && classIds !== undefined) {
      // 기존 반에서 사용자 제거
      await Class.updateMany(
        { students: user._id },
        { $pull: { students: user._id } }
      );
      
      // 새로운 반에 사용자 추가
      if (Array.isArray(classIds) && classIds.length > 0) {
        // 유효한 반 ID인지 확인
        const validClasses = await Class.find({ _id: { $in: classIds } });
        if (validClasses.length !== classIds.length) {
          return res.status(400).json({
            success: false,
            error: '일부 반을 찾을 수 없습니다',
          });
        }
        
        // 각 반에 사용자 추가
        await Promise.all(
          classIds.map(async (classId) => {
            await Class.findByIdAndUpdate(classId, {
              $addToSet: { students: user._id }, // 중복 방지
            });
          })
        );

        // 학생인 경우 연동된 학부모도 같은 반에 추가
        if (user.userType === '학생') {
          try {
            // 연동된 학부모 계정 찾기 (부모님 연락처를 userId로 사용)
            const parentUser = await User.findOne({
              userId: user.parentContact ? user.parentContact.trim() : '',
              userType: '학부모',
            });

            if (parentUser) {
              // 기존 반에서 학부모 제거
              await Class.updateMany(
                { students: parentUser._id },
                { $pull: { students: parentUser._id } }
              );

              // 각 반에 학부모 추가
              await Promise.all(
                classIds.map(async (classId) => {
                  await Class.findByIdAndUpdate(classId, {
                    $addToSet: { students: parentUser._id }, // 중복 방지
                  });
                })
              );
              console.log(`학생 ${updatedUser.userId}의 반 정보가 연동된 학부모 ${parentUser.userId}에게도 적용되었습니다.`);
            }
          } catch (parentError) {
            console.error('연동된 학부모 반 추가 오류:', parentError);
            // 학부모 반 추가 실패해도 학생 반 추가는 성공
          }
        }
      }
    }

    res.json({
      success: true,
      message: '유저 정보가 성공적으로 수정되었습니다',
      data: user,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 유저 ID입니다',
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
    res.status(500).json({
      success: false,
      error: '유저 정보를 수정하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 유저 삭제
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '유저를 찾을 수 없습니다',
      });
    }

    let unlinkedUser = null;

    // 학생을 삭제하는 경우: 연동된 학부모 확인
    if (user.userType === '학생') {
      try {
        // 연동된 학부모 계정 찾기 (부모님 연락처를 userId로 사용)
        if (user.parentContact) {
        const linkedParent = await User.findOne({
            userId: user.parentContact.trim(),
          userType: '학부모',
        });

        if (linkedParent) {
            unlinkedUser = {
            type: '학부모',
            userId: linkedParent.userId,
            name: linkedParent.name,
          };
          }
        }
      } catch (parentError) {
        console.error('연동된 학부모 확인 중 오류:', parentError);
      }
    }

    // 학부모를 삭제하는 경우: 연동된 학생 확인
    if (user.userType === '학부모') {
      try {
        // 연동된 학생 계정 찾기 (학부모의 userId가 부모님 연락처이므로, parentContact가 학부모 userId와 일치하는 학생 찾기)
        const linkedStudent = await User.findOne({
          parentContact: user.userId.trim(),
          userType: '학생',
        });

        if (linkedStudent) {
          unlinkedUser = {
            type: '학생',
            userId: linkedStudent.userId,
            name: linkedStudent.name,
          };
        }
      } catch (studentError) {
        console.error('연동된 학생 확인 중 오류:', studentError);
      }
    }

    // 사용자 삭제
    await User.findByIdAndDelete(req.params.id);

    // 반에서도 제거 (학생 또는 학부모인 경우)
    if (user.userType === '학생' || user.userType === '학부모') {
      await Class.updateMany(
        { students: user._id },
        { $pull: { students: user._id } }
      );
    }

    const responseData = {
      success: true,
      message: '유저가 성공적으로 삭제되었습니다',
      data: {},
    };

    // 연동 정보가 제거된 경우 응답에 포함
    if (unlinkedUser) {
      responseData.unlinkedUser = unlinkedUser;
      responseData.message = `${user.userType} 계정이 삭제되어 연동된 ${unlinkedUser.type} 계정의 연동 정보가 제거되었습니다`;
    }

    res.json(responseData);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 유저 ID입니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '유저를 삭제하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 아이디 찾기 (이름과 이메일로)
exports.findUserId = async (req, res) => {
  console.log('\n=== findUserId 컨트롤러 실행 ===');
  console.log('요청 body:', JSON.stringify(req.body, null, 2));
  console.log('요청 headers:', JSON.stringify(req.headers, null, 2));
  try {
    const { name, email } = req.body;

    console.log('받은 데이터:', { name, email });
    console.log('name 타입:', typeof name, '값:', name);
    console.log('email 타입:', typeof email, '값:', email);

    // 필수 필드 검증 (안전하게 처리)
    if (!name || typeof name !== 'string' || !name.trim()) {
      console.log('필수 필드 누락: name', { name, type: typeof name });
      return res.status(400).json({
        success: false,
        error: '이름을 입력해주세요',
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      console.log('필수 필드 누락: email', { email, type: typeof email });
      return res.status(400).json({
        success: false,
        error: '이메일을 입력해주세요',
      });
    }

    // User 모델 확인
    if (!User) {
      console.error('User 모델이 정의되지 않았습니다');
      return res.status(500).json({
        success: false,
        error: '서버 설정 오류가 발생했습니다',
      });
    }

    // 안전하게 trim 처리
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    console.log('데이터베이스 쿼리 시작:', { name: trimmedName, email: trimmedEmail });

    // MongoDB 연결 상태 확인
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB 연결 상태:', mongoose.connection.readyState);
      console.error('0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting');
      return res.status(500).json({
        success: false,
        error: '데이터베이스에 연결할 수 없습니다',
      });
    }

    // 이름과 이메일로 유저 찾기
    let user;
    try {
      const query = { 
        name: trimmedName, 
        email: trimmedEmail 
      };
      console.log('MongoDB 쿼리:', JSON.stringify(query, null, 2));
      
      user = await User.findOne(query).exec();
      console.log('쿼리 결과:', user ? `유저 찾음 (userId: ${user.userId})` : '유저 없음');
    } catch (queryError) {
      console.error('데이터베이스 쿼리 오류 상세:');
      console.error('오류 타입:', queryError.constructor.name);
      console.error('오류 메시지:', queryError.message);
      console.error('오류 스택:', queryError.stack);
      throw queryError; // 상위 catch로 전달
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다',
      });
    }

    // 아이디 일부만 보여주기 (보안)
    const userId = user.userId;
    if (!userId) {
      console.error('유저 아이디가 없습니다:', user);
      return res.status(500).json({
        success: false,
        error: '유저 정보에 문제가 있습니다',
      });
    }

    const maskedUserId = userId.length > 3 
      ? userId.substring(0, 3) + '*'.repeat(userId.length - 3)
      : '*'.repeat(userId.length);

    console.log('아이디 찾기 성공:', { maskedUserId, fullUserId: userId });

    res.json({
      success: true,
      message: '아이디를 찾았습니다',
      data: {
        userId: maskedUserId,
        fullUserId: userId, // 실제로는 이메일로 전송하는 것이 좋지만, 여기서는 간단히 반환
      },
    });
  } catch (error) {
    console.error('\n=== 아이디 찾기 오류 상세 ===');
    console.error('오류 타입:', error.constructor.name);
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    console.error('요청 body:', JSON.stringify(req.body, null, 2));
    
    // 이미 응답이 전송되었는지 확인
    if (res.headersSent) {
      console.error('응답이 이미 전송되었습니다.');
      return;
    }
    
    // Content-Type을 명시적으로 설정하고 JSON 형식으로 응답
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      error: '아이디 찾기 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 비밀번호 찾기/재설정 (아이디와 이메일로)
exports.resetPassword = async (req, res) => {
  try {
    const { userId, email, newPassword } = req.body;

    // 필수 필드 검증
    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: '아이디와 이메일을 입력해주세요',
      });
    }

    // 아이디와 이메일로 유저 찾기
    const user = await User.findOne({ 
      userId: userId.trim(), 
      email: email.trim().toLowerCase() 
    }).exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다',
      });
    }

        // 새 비밀번호가 제공된 경우 비밀번호 재설정
        if (newPassword) {
          if (newPassword.length < 7) {
            return res.status(400).json({
              success: false,
              error: '비밀번호는 최소 7자 이상이어야 합니다',
            });
          }

      // 비밀번호 암호화
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // 비밀번호 업데이트
      user.password = hashedPassword;
      await user.save();

      return res.json({
        success: true,
        message: '비밀번호가 성공적으로 재설정되었습니다',
      });
    } else {
      // 비밀번호 재설정 요청만 확인 (실제로는 이메일로 임시 비밀번호를 보내야 함)
      return res.json({
        success: true,
        message: '계정 확인이 완료되었습니다. 새 비밀번호를 입력해주세요',
      });
    }
  } catch (error) {
    console.error('=== 비밀번호 재설정 오류 상세 ===');
    console.error('오류 타입:', error.constructor.name);
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    console.error('요청 body:', req.body);
    
    // 이미 응답이 전송되었는지 확인
    if (res.headersSent) {
      console.error('응답이 이미 전송되었습니다.');
      return;
    }
    
    return res.status(500).json({
      success: false,
      error: '비밀번호 재설정 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    console.log('\n=== 로그인 요청 시작 ===');
    console.log('요청 body:', JSON.stringify(req.body, null, 2));
    
    const { userId, password } = req.body;

    // 필수 필드 검증
    if (!userId || !password) {
      console.log('필수 필드 누락:', { userId: !!userId, password: !!password });
      return res.status(400).json({
        success: false,
        error: '아이디와 비밀번호를 입력해주세요',
      });
    }

    console.log('유저 찾기 시작:', { userId });
    
    // userId로 유저 찾기 (비밀번호 포함)
    const user = await User.findOne({ userId }).exec();

    // 유저가 존재하지 않는 경우
    if (!user) {
      console.log('유저를 찾을 수 없음:', userId);
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 올바르지 않습니다',
      });
    }

    console.log('유저 찾음:', { 
      userId: user.userId, 
      hasPassword: !!user.password,
      passwordType: typeof user.password,
      passwordLength: user.password?.length 
    });

    // 비밀번호가 없는 경우
    if (!user.password) {
      console.error('유저 비밀번호가 없음:', user);
      return res.status(500).json({
        success: false,
        error: '유저 정보에 문제가 있습니다. 관리자에게 문의하세요.',
      });
    }

    // 비밀번호 확인
    console.log('비밀번호 비교 시작');
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('비밀번호 비교 결과:', isPasswordValid);
    } catch (compareError) {
      console.error('비밀번호 비교 오류:', compareError);
      return res.status(500).json({
        success: false,
        error: '비밀번호 확인 중 오류가 발생했습니다',
        message: compareError.message,
      });
    }

    if (!isPasswordValid) {
      console.log('비밀번호 불일치');
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 올바르지 않습니다',
      });
    }

    // 로그인 성공 - 비밀번호 제외하고 유저 정보 반환
    const userResponse = user.toObject();
    delete userResponse.password;

    // JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
    if (!jwtSecret || jwtSecret === 'your-super-secret-key-change-in-production') {
      console.warn('⚠️ JWT_SECRET이 기본값으로 설정되어 있습니다. 프로덕션 환경에서는 반드시 변경하세요!');
    }
    
    const token = jwt.sign(
      {
        userId: user.userId,
        id: user._id,
        userType: user.userType,
        isAdmin: user.isAdmin,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d', // 기본 7일
      }
    );

    console.log('로그인 성공:', { 
      userId: user.userId, 
      userType: user.userType, 
      isAdmin: user.isAdmin,
      tokenLength: token?.length,
      hasToken: !!token
    });

    // 토큰이 제대로 생성되었는지 확인
    if (!token) {
      console.error('❌ JWT 토큰 생성 실패!');
      return res.status(500).json({
        success: false,
        error: '토큰 생성 중 오류가 발생했습니다',
      });
    }

    const responseData = {
      success: true,
      message: '로그인에 성공했습니다',
      token: token, // JWT 토큰 반환
      data: userResponse,
    };

    console.log('응답 데이터 확인:', {
      success: responseData.success,
      hasToken: !!responseData.token,
      tokenLength: responseData.token?.length,
      hasData: !!responseData.data
    });

    res.json(responseData);
  } catch (error) {
    console.error('\n=== 로그인 오류 상세 ===');
    console.error('오류 타입:', error.constructor.name);
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    console.error('요청 body:', JSON.stringify(req.body, null, 2));
    
    // 이미 응답이 전송되었는지 확인
    if (res.headersSent) {
      console.error('응답이 이미 전송되었습니다.');
      return;
    }
    
    // Content-Type을 명시적으로 설정하고 JSON 형식으로 응답
    res.setHeader('Content-Type', 'application/json');
    return     res.status(500).json({
      success: false,
      error: '로그인 중 오류가 발생했습니다',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
};

// 사용자 연동
exports.linkUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUser = await User.findById(req.params.id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: '유저를 찾을 수 없습니다',
      });
    }

    // 학생 또는 학부모만 연동 가능
    if (currentUser.userType !== '학생' && currentUser.userType !== '학부모') {
      return res.status(400).json({
        success: false,
        error: '학생 또는 학부모만 연동할 수 있습니다',
      });
    }

    // 이미 연동된 사용자가 있는지 확인
    let existingLinkedUser = null;
    if (currentUser.userType === '학생') {
      // 부모님 연락처를 userId로 사용하는 학부모 찾기
      if (currentUser.parentContact) {
        existingLinkedUser = await User.findOne({
          userId: currentUser.parentContact.trim(),
          userType: '학부모',
        });
      }
    } else if (currentUser.userType === '학부모') {
      // 학부모의 userId(부모님 연락처)와 parentContact가 일치하는 학생 찾기
      existingLinkedUser = await User.findOne({
        parentContact: currentUser.userId.trim(),
        userType: '학생',
      });
    }

    if (existingLinkedUser) {
      return res.status(400).json({
        success: false,
        error: '이미 연동된 사용자가 있습니다. 먼저 연동을 해지해주세요.',
      });
    }

    // 대상 사용자 확인
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: '연동할 사용자를 찾을 수 없습니다',
      });
    }

    // 반대 타입인지 확인
    if (currentUser.userType === '학생' && targetUser.userType !== '학부모') {
      return res.status(400).json({
        success: false,
        error: '학생은 학부모와만 연동할 수 있습니다',
      });
    }
    if (currentUser.userType === '학부모' && targetUser.userType !== '학생') {
      return res.status(400).json({
        success: false,
        error: '학부모는 학생과만 연동할 수 있습니다',
      });
    }

    // 대상 사용자가 이미 연동되어 있는지 확인
    let targetLinkedUser = null;
    if (targetUser.userType === '학생') {
      // 부모님 연락처를 userId로 사용하는 학부모 찾기
      if (targetUser.parentContact) {
        targetLinkedUser = await User.findOne({
          userId: targetUser.parentContact.trim(),
          userType: '학부모',
        });
      }
    } else if (targetUser.userType === '학부모') {
      // 학부모의 userId(부모님 연락처)와 parentContact가 일치하는 학생 찾기
      targetLinkedUser = await User.findOne({
        parentContact: targetUser.userId.trim(),
        userType: '학생',
      });
    }

    if (targetLinkedUser) {
      return res.status(400).json({
        success: false,
        error: '연동할 사용자가 이미 다른 사용자와 연동되어 있습니다',
      });
    }

    // 연동 처리
    if (currentUser.userType === '학생') {
      // 학생의 parentContact를 대상 학부모의 userId로 설정
      // 대상 학부모의 userId는 부모님 연락처로 유지
      if (!currentUser.parentContact) {
        return res.status(400).json({
          success: false,
          error: '학생의 부모님 연락처가 설정되지 않았습니다.',
        });
      }
      
      // 대상 학부모의 userId가 학생의 parentContact와 일치하는지 확인
      if (targetUser.userId.trim() !== currentUser.parentContact.trim()) {
        // 대상 학부모의 userId를 학생의 parentContact로 변경
        const newParentUserId = currentUser.parentContact.trim();
        
        // 기존 userId와 충돌하는지 확인
        const existingUserWithNewId = await User.findOne({ userId: newParentUserId });
        if (existingUserWithNewId && existingUserWithNewId._id.toString() !== targetUser._id.toString()) {
          return res.status(400).json({
            success: false,
            error: '연동할 수 없습니다. userId 충돌이 발생했습니다.',
          });
        }
        
        // 대상 학부모의 userId 변경
        targetUser.userId = newParentUserId;
        targetUser.email = `${newParentUserId}@mathchang.com`;
        await targetUser.save();
      }
    } else if (currentUser.userType === '학부모') {
      // 학부모의 userId(부모님 연락처)를 학생의 parentContact로 설정
      // 학생의 parentContact를 학부모의 userId로 설정
      if (!targetUser.parentContact) {
        return res.status(400).json({
          success: false,
          error: '학생의 부모님 연락처가 설정되지 않았습니다.',
        });
      }
      
      // 학생의 parentContact를 학부모의 userId로 설정
      targetUser.parentContact = currentUser.userId.trim();
      await targetUser.save();
    }

    res.json({
      success: true,
      message: '연동이 완료되었습니다',
    });
  } catch (error) {
    console.error('연동 오류:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '연동할 수 없습니다. userId가 이미 사용 중입니다.',
      });
    }
    res.status(500).json({
      success: false,
      error: '연동 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 사용자 연동 해지
exports.unlinkUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: '유저를 찾을 수 없습니다',
      });
    }

    // 학생 또는 학부모만 연동 해지 가능
    if (currentUser.userType !== '학생' && currentUser.userType !== '학부모') {
      return res.status(400).json({
        success: false,
        error: '학생 또는 학부모만 연동 해지할 수 있습니다',
      });
    }

    // 연동된 사용자 찾기
    let linkedUser = null;
    if (currentUser.userType === '학생') {
      // 부모님 연락처를 userId로 사용하는 학부모 찾기
      if (currentUser.parentContact) {
        linkedUser = await User.findOne({
          userId: currentUser.parentContact.trim(),
          userType: '학부모',
        });
      }
    } else if (currentUser.userType === '학부모') {
      // 학부모의 userId(부모님 연락처)와 parentContact가 일치하는 학생 찾기
      linkedUser = await User.findOne({
        parentContact: currentUser.userId.trim(),
        userType: '학생',
      });
    }

    if (!linkedUser) {
      return res.status(400).json({
        success: false,
        error: '연동된 사용자가 없습니다',
      });
    }

    // 연동 해지 처리: 양쪽 모두에서 연동 정보 제거
    const timestamp = Date.now();
    
    if (currentUser.userType === '학생') {
      // 1. 학부모의 userId를 고유한 값으로 변경하여 연동 정보 제거
      const originalParentUserId = linkedUser.userId;
      const newParentUserId = `${originalParentUserId}_unlinked_${timestamp}`;
      linkedUser.userId = newParentUserId;
      linkedUser.email = `${newParentUserId}@mathchang.com`;
      await linkedUser.save();
      
      // 2. 학생의 parentContact도 변경하여 연동 정보 제거
      const originalParentContact = currentUser.parentContact;
      currentUser.parentContact = `${originalParentContact}_unlinked_${timestamp}`;
      await currentUser.save();
      
      console.log(`연동 해지 완료: 학생 ${currentUser.userId}와 학부모 ${originalParentUserId}의 연동이 양쪽 모두에서 해지되었습니다.`);
    } else if (currentUser.userType === '학부모') {
      // 1. 학부모의 userId를 고유한 값으로 변경하여 연동 정보 제거
      const originalParentUserId = currentUser.userId;
      const newParentUserId = `${originalParentUserId}_unlinked_${timestamp}`;
      currentUser.userId = newParentUserId;
      currentUser.email = `${newParentUserId}@mathchang.com`;
      await currentUser.save();
      
      // 2. 학생의 parentContact도 변경하여 연동 정보 제거 (학부모의 원래 userId와 일치하는 경우)
      if (linkedUser.parentContact && linkedUser.parentContact.trim() === originalParentUserId.trim()) {
        const originalParentContact = linkedUser.parentContact;
        linkedUser.parentContact = `${originalParentContact}_unlinked_${timestamp}`;
        await linkedUser.save();
      }
      
      console.log(`연동 해지 완료: 학부모 ${originalParentUserId}와 학생 ${linkedUser.userId}의 연동이 양쪽 모두에서 해지되었습니다.`);
    }

    res.json({
      success: true,
      message: '연동이 해지되었습니다',
    });
  } catch (error) {
    console.error('연동 해지 오류:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '연동 해지 중 오류가 발생했습니다. userId 충돌이 발생했습니다.',
      });
    }
    res.status(500).json({
      success: false,
      error: '연동 해지 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

