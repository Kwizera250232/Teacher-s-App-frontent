import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherClassPage from './pages/TeacherClassPage';
import StudentClassPage from './pages/StudentClassPage';
import TakeQuiz from './pages/TakeQuiz';
import QuizResults from './pages/QuizResults';

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
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
