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
    // 개인정보 수집 및 이용 동의
    privacyAgreement: {
      type: Boolean,
      required: false,
      default: false,
    },
    privacyAgreementDate: {
      type: Date,
    },
    // 서비스 이용 약관 동의
    termsAgreement: {
      type: Boolean,
      required: false,
      default: false,
    },
    termsAgreementDate: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 저장 전 처리 (pre-save hook)
userSchema.pre('save', async function (next) {
  // 강사는 자동으로 관리자 권한 부여
  if (this.userType === '강사') {
    this.isAdmin = true;
  } else {
    this.isAdmin = false;
  }

  // password 필드가 없으면 스킵
  if (!this.password) {
    return next();
  }

  // 이미 해시된 비밀번호인지 확인 ($2b$ 또는 $2a$로 시작하는지)
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return next();
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// unique: true가 이미 인덱스를 자동 생성하므로 별도로 index를 추가할 필요 없음

const User = mongoose.model('User', userSchema);

module.exports = User;

