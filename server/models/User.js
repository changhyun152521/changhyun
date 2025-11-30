const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, '아이디는 필수입니다'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다'],
      minlength: [7, '비밀번호는 최소 7자 이상이어야 합니다'],
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, '이메일 주소는 필수입니다'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, '올바른 이메일 형식이 아닙니다'],
    },
    phone: {
      type: String,
      required: [true, '휴대폰 번호는 필수입니다'],
      trim: true,
      match: [/^[0-9-]+$/, '올바른 전화번호 형식이 아닙니다'],
    },
    schoolName: {
      type: String,
      required: [true, '학교명은 필수입니다'],
      trim: true,
    },
    studentContact: {
      type: String,
      required: [true, '학생 연락처는 필수입니다'],
      trim: true,
      match: [/^[0-9-]+$/, '올바른 전화번호 형식이 아닙니다'],
    },
    parentContact: {
      type: String,
      required: [true, '부모님 연락처는 필수입니다'],
      trim: true,
      match: [/^[0-9-]+$/, '올바른 전화번호 형식이 아닙니다'],
    },
    userType: {
      type: String,
      required: [true, '사용자 유형은 필수입니다'],
      enum: {
        values: ['학생', '학부모', '강사'],
        message: '사용자 유형은 학생, 학부모, 강사 중 하나여야 합니다',
      },
      default: '학생',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 저장 전 처리 (pre-save hook)
userSchema.pre('save', async function (next) {
  console.log('Pre-save hook 실행 - userType:', this.userType);
  
  // 강사는 자동으로 관리자 권한 부여
  if (this.userType === '강사') {
    this.isAdmin = true;
    console.log('강사로 설정됨 - isAdmin을 true로 설정');
  } else {
    this.isAdmin = false;
    console.log('학생/학부모로 설정됨 - isAdmin을 false로 설정');
  }
  
  console.log('Pre-save hook 완료 - userType:', this.userType, 'isAdmin:', this.isAdmin);

  // password 필드가 없으면 스킵
  if (!this.password) {
    return next();
  }

  // 이미 해시된 비밀번호인지 확인 ($2b$ 또는 $2a$로 시작하는지)
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    console.log('비밀번호가 이미 해시되어 있습니다.');
    return next();
  }

  try {
    console.log('비밀번호 암호화 시작:', this.password.substring(0, 3) + '...');
    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPassword;
    console.log('비밀번호 암호화 완료:', hashedPassword.substring(0, 20) + '...');
    next();
  } catch (error) {
    console.error('비밀번호 암호화 오류:', error);
    next(error);
  }
});

// unique: true가 이미 인덱스를 자동 생성하므로 별도로 index를 추가할 필요 없음

const User = mongoose.model('User', userSchema);

module.exports = User;

