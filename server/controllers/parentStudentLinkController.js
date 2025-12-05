const ParentStudentLink = require('../models/ParentStudentLink');
const User = require('../models/User');

// 학부모의 연동된 학생 목록 조회
exports.getLinkedStudents = async (req, res) => {
  try {
    const { parentId } = req.params;

    const links = await ParentStudentLink.find({ parentId })
      .populate('studentId', 'userId name email phone schoolName studentContact')
      .lean();

    const students = links.map(link => ({
      _id: link.studentId._id,
      userId: link.studentId.userId,
      name: link.studentId.name,
      email: link.studentId.email,
      phone: link.studentId.phone,
      schoolName: link.studentId.schoolName,
      studentContact: link.studentId.studentContact,
      linkId: link._id, // 연동 관계 ID 추가
    }));

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('연동된 학생 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '연동된 학생 목록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 학생의 연동된 학부모 목록 조회
exports.getLinkedParents = async (req, res) => {
  try {
    const { studentId } = req.params;

    const links = await ParentStudentLink.find({ studentId })
      .populate('parentId', 'userId name email phone')
      .lean();

    const parents = links.map(link => ({
      _id: link.parentId._id,
      userId: link.parentId.userId,
      name: link.parentId.name,
      email: link.parentId.email,
      phone: link.parentId.phone,
      linkId: link._id, // 연동 관계 ID 추가
    }));

    res.json({
      success: true,
      data: parents,
    });
  } catch (error) {
    console.error('연동된 학부모 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '연동된 학부모 목록을 가져오는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 연동 관계 생성
exports.createLink = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    if (!parentId || !studentId) {
      return res.status(400).json({
        success: false,
        error: '학부모 ID와 학생 ID는 필수입니다',
      });
    }

    // 학부모와 학생이 존재하는지 확인
    const parent = await User.findById(parentId);
    const student = await User.findById(studentId);

    if (!parent || parent.userType !== '학부모') {
      return res.status(400).json({
        success: false,
        error: '유효한 학부모 계정을 찾을 수 없습니다',
      });
    }

    if (!student || student.userType !== '학생') {
      return res.status(400).json({
        success: false,
        error: '유효한 학생 계정을 찾을 수 없습니다',
      });
    }

    // 이미 연동되어 있는지 확인
    const existingLink = await ParentStudentLink.findOne({ parentId, studentId });
    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: '이미 연동되어 있습니다',
      });
    }

    // 연동 관계 생성
    const link = new ParentStudentLink({
      parentId,
      studentId,
    });

    await link.save();

    res.json({
      success: true,
      message: '연동 관계가 생성되었습니다',
      data: link,
    });
  } catch (error) {
    console.error('연동 관계 생성 오류:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: '이미 연동되어 있습니다',
      });
    }
    res.status(500).json({
      success: false,
      error: '연동 관계를 생성하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// 연동 관계 삭제
exports.deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await ParentStudentLink.findByIdAndDelete(linkId);

    if (!link) {
      return res.status(404).json({
        success: false,
        error: '연동 관계를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '연동 관계가 삭제되었습니다',
    });
  } catch (error) {
    console.error('연동 관계 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '연동 관계를 삭제하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

// parentId와 studentId로 연동 관계 삭제
exports.deleteLinkByIds = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    if (!parentId || !studentId) {
      return res.status(400).json({
        success: false,
        error: '학부모 ID와 학생 ID는 필수입니다',
      });
    }

    const link = await ParentStudentLink.findOneAndDelete({ parentId, studentId });

    if (!link) {
      return res.status(404).json({
        success: false,
        error: '연동 관계를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      message: '연동 관계가 삭제되었습니다',
    });
  } catch (error) {
    console.error('연동 관계 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '연동 관계를 삭제하는 중 오류가 발생했습니다',
      message: error.message,
    });
  }
};

