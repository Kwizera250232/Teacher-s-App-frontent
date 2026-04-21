import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherClassPage from './pages/TeacherClassPage';
import StudentClassPage from './pages/StudentClassPage';
import TakeQuiz from './pages/TakeQuiz';
import QuizResults from './pages/QuizResults';
import AdminDashboard from './pages/AdminDashboard';
import JoinClass from './pages/JoinClass';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/join" element={<JoinClass />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />

          <Route path="/teacher/dashboard" element={
            <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
          } />
          <Route path="/teacher/classes/:id" element={
            <ProtectedRoute role="teacher"><TeacherClassPage /></ProtectedRoute>
          } />
          <Route path="/teacher/classes/:classId/quizzes/:quizId/results" element={
            <ProtectedRoute role="teacher"><QuizResults /></ProtectedRoute>
          } />

          <Route path="/student/dashboard" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/classes/:id" element={
            <ProtectedRoute role="student"><StudentClassPage /></ProtectedRoute>
          } />
          <Route path="/student/classes/:classId/quizzes/:quizId" element={
            <ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
