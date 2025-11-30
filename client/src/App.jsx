import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import CourseRegister from './pages/CourseRegister';
import UserEdit from './pages/UserEdit';
import UserRegister from './pages/UserRegister';
import ClassRegister from './pages/ClassRegister';
import MyCourses from './pages/MyCourses';
import CourseDetail from './pages/CourseDetail';
import PreviewCourses from './pages/PreviewCourses';
import PreviewCourseDetail from './pages/PreviewCourseDetail';
import PreviewCourseRegister from './pages/PreviewCourseRegister';
import ClassRecordManage from './pages/ClassRecordManage';
import CoursesList from './pages/CoursesList';
import UsersList from './pages/UsersList';
import ClassesList from './pages/ClassesList';
import PreviewCoursesList from './pages/PreviewCoursesList';
import MyClassStatus from './pages/MyClassStatus';
import ClassStatusDetail from './pages/ClassStatusDetail';
import ParentClassStatus from './pages/ParentClassStatus';
import ParentClassStatusDetail from './pages/ParentClassStatusDetail';
import MyMonthlyStatistics from './pages/MyMonthlyStatistics';
import ParentMonthlyStatistics from './pages/ParentMonthlyStatistics';
import MyMonthlyStatisticsDetail from './pages/MyMonthlyStatisticsDetail';
import ParentMonthlyStatisticsDetail from './pages/ParentMonthlyStatisticsDetail';
import AdminClassMonthlyStatistics from './pages/AdminClassMonthlyStatistics';
import AdminClassMonthlyStatisticsDetail from './pages/AdminClassMonthlyStatisticsDetail';
import AdminClassStudentRecords from './pages/AdminClassStudentRecords';
import AdminClassStudentRecordsDetail from './pages/AdminClassStudentRecordsDetail';
import Notice from './pages/Notice';
import NoticeCreate from './pages/NoticeCreate';
import NoticeDetail from './pages/NoticeDetail';
import NoticeEdit from './pages/NoticeEdit';
import Attendance from './pages/Attendance';
import './App.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/courses" element={<CoursesList />} />
        <Route path="/admin/users" element={<UsersList />} />
        <Route path="/admin/classes" element={<ClassesList />} />
        <Route path="/admin/preview-courses" element={<PreviewCoursesList />} />
        <Route path="/admin/course/register" element={<CourseRegister />} />
        <Route path="/admin/course/edit/:courseId" element={<CourseRegister />} />
        <Route path="/admin/user/register" element={<UserRegister />} />
        <Route path="/admin/user/edit/:userId" element={<UserEdit />} />
        <Route path="/admin/class/register" element={<ClassRegister />} />
        <Route path="/admin/class/edit/:classId" element={<ClassRegister />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-classroom/courses" element={<MyCourses />} />
        <Route path="/my-classroom/courses/:courseId" element={<CourseDetail />} />
        <Route path="/preview-courses" element={<PreviewCourses />} />
        <Route path="/preview-courses/:videoId" element={<PreviewCourseDetail />} />
        <Route path="/admin/preview-course/register" element={<PreviewCourseRegister />} />
        <Route path="/admin/preview-course/edit/:previewCourseId" element={<PreviewCourseRegister />} />
        <Route path="/admin/class/:classId/records" element={<ClassRecordManage />} />
        <Route path="/my-class/status" element={<MyClassStatus />} />
        <Route path="/my-class/:classId/status" element={<ClassStatusDetail />} />
        <Route path="/my-class/statistics" element={<MyMonthlyStatistics />} />
        <Route path="/my-class/:classId/monthly-statistics" element={<MyMonthlyStatisticsDetail />} />
        <Route path="/parent-class/status" element={<ParentClassStatus />} />
        <Route path="/parent-class/:classId/status" element={<ParentClassStatusDetail />} />
        <Route path="/parent-class/statistics" element={<ParentMonthlyStatistics />} />
        <Route path="/parent-class/:classId/monthly-statistics" element={<ParentMonthlyStatisticsDetail />} />
        <Route path="/admin/class-monthly-statistics" element={<AdminClassMonthlyStatistics />} />
        <Route path="/admin/class/:classId/monthly-statistics" element={<AdminClassMonthlyStatisticsDetail />} />
        <Route path="/admin/class-student-records" element={<AdminClassStudentRecords />} />
        <Route path="/admin/class/:classId/student-records" element={<AdminClassStudentRecordsDetail />} />
        <Route path="/community/notice" element={<Notice />} />
        <Route path="/community/notice/create" element={<NoticeCreate />} />
        <Route path="/community/notice/:noticeId" element={<NoticeDetail />} />
        <Route path="/community/notice/edit/:noticeId" element={<NoticeEdit />} />
        <Route path="/community/attendance" element={<Attendance />} />
      </Routes>
    </Router>
  );
}

export default App;

