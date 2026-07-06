import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import HeadTeacherDashboard from './pages/HeadTeacherDashboard';
import ParentHub from './pages/ParentHub';
import ParentDashboard from './pages/ParentDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { dashboardPath } from './utils/roles';
import TeacherClassPage from './pages/TeacherClassPage';
import RecordCatMarks from './pages/RecordCatMarks';
import StudentClassPage from './pages/StudentClassPage';
import TakeQuiz from './pages/TakeQuiz';
import TakeGroupQuiz from './pages/TakeGroupQuiz';
import StudentQuizReportsPage from './pages/StudentQuizReportsPage';
import AIRevision from './pages/AIRevision';
import AIRevisionProgress from './pages/AIRevisionProgress';
import QuizResults from './pages/QuizResults';
import AdminDashboard from './pages/AdminDashboard';
import JoinClass from './pages/JoinClass';
import StudentNotes from './pages/StudentNotes';
import ClassMomentsPage from './pages/ClassMomentsPage';
import ShareMomentPage from './pages/ShareMomentPage';
import QuizShareLanding from './pages/QuizShareLanding';
import GuestDashboard from './pages/GuestDashboard';
import GuestClassPage from './pages/GuestClassPage';
import GuestProfile from './pages/GuestProfile';
import InviteSignup from './pages/InviteSignup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Footer from './components/Footer';
import OfflineBanner from './components/OfflineBanner';
import EmailConfirmBanner from './components/EmailConfirmBanner';
import EmailConfirmed from './pages/EmailConfirmed';
import { InstallProvider } from './components/InstallPrompt';
import { usePushNotifications } from './hooks/usePushNotifications';
import './components/Footer.css';
import './styles/WaAppShell.css';
import './styles/WaChatShell.css';
import './styles/AppFullscreen.css';

// ── Alumni Module (lazy loaded) ───────────────────────────────────────────────
const AlumniDashboard = lazy(() => import('./pages/alumni/AlumniDashboard'));
const AlumniProfile = lazy(() => import('./pages/alumni/AlumniProfile'));
const AlumniDirectory = lazy(() => import('./pages/alumni/AlumniDirectory'));
const AlumniCompose = lazy(() => import('./pages/alumni/AlumniCompose'));
const AlumniComposition = lazy(() => import('./pages/alumni/AlumniComposition'));
const AlumniWallet = lazy(() => import('./pages/alumni/AlumniWallet'));
const GraduationManager = lazy(() => import('./pages/alumni/GraduationManager'));
const AlumniGroups = lazy(() => import('./pages/alumni/AlumniGroups'));
const AlumniGroupChat = lazy(() => import('./pages/alumni/AlumniGroupChat'));
const AlumniFeed = lazy(() => import('./pages/alumni/AlumniFeed'));
const AlumniPostDetail = lazy(() => import('./pages/alumni/AlumniPostDetail'));
const AlumniPrimaryThings = lazy(() => import('./pages/alumni/AlumniPrimaryThings'));
const AlumniNotes = lazy(() => import('./pages/alumni/AlumniNotes'));
const AlumniQuizzes = lazy(() => import('./pages/alumni/AlumniQuizzes'));
const AlumniHomework = lazy(() => import('./pages/alumni/AlumniHomework'));
const AlumniLibrary = lazy(() => import('./pages/alumni/AlumniLibrary'));
const AlumniPastPapers = lazy(() => import('./pages/alumni/AlumniPastPapers'));
const AlumniColleagues = lazy(() => import('./pages/alumni/AlumniColleagues'));
const AlumniDirectChat = lazy(() => import('./pages/alumni/AlumniDirectChat'));
const AlumniDean = lazy(() => import('./pages/alumni/AlumniDean'));
const AlumniOpportunities = lazy(() => import('./pages/alumni/AlumniOpportunities'));
const AlumniAdmin = lazy(() => import('./pages/alumni/AlumniAdmin'));

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/welcome" replace />;
  return <Navigate to={dashboardPath(user.role)} replace />;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  usePushNotifications(token);
  const hideFooter = /\/messages(\/|$)|\/parent\/dashboard|\/guest\//.test(location.pathname);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const handler = (event) => {
      if (event.data?.type === 'OPEN_URL' && event.data.url) {
        navigate(event.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [navigate]);

  return (
    <div className={`app-wa-shell${hideFooter ? ' app-wa-shell--chat-fullscreen' : ''}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <OfflineBanner />
      <EmailConfirmBanner />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Routes>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/welcome" element={<Landing />} />
                <Route path="/join" element={<JoinClass />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/invite" element={<InviteSignup />} />
                <Route path="/share/moment/:token" element={<ShareMomentPage />} />
                <Route path="/quiz/share/:token" element={<QuizShareLanding />} />

                <Route path="/guest/dashboard" element={
                  <ProtectedRoute role="guest"><GuestDashboard /></ProtectedRoute>
                } />
                <Route path="/guest/profile" element={
                  <ProtectedRoute role="guest"><GuestProfile /></ProtectedRoute>
                } />
                <Route path="/guest/classes/:classId" element={
                  <ProtectedRoute role="guest"><GuestClassPage /></ProtectedRoute>
                } />
                <Route path="/guest/classes/:classId/quizzes/:quizId" element={
                  <ProtectedRoute role="guest"><TakeQuiz /></ProtectedRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
                } />

                <Route path="/head-teacher/dashboard" element={
                  <ProtectedRoute role="head_teacher"><HeadTeacherDashboard /></ProtectedRoute>
                } />
                <Route path="/head-teacher/classes" element={
                  <ProtectedRoute role="head_teacher"><HeadTeacherDashboard /></ProtectedRoute>
                } />
                <Route path="/head-teacher/classes/:id" element={
                  <ProtectedRoute role="head_teacher"><TeacherClassPage /></ProtectedRoute>
                } />
                <Route path="/head-teacher/classes/:id/record-marks" element={
                  <ProtectedRoute role="head_teacher"><RecordCatMarks /></ProtectedRoute>
                } />
                <Route path="/head-teacher/classes/:classId/quizzes/:quizId/results" element={
                  <ProtectedRoute role="head_teacher"><QuizResults /></ProtectedRoute>
                } />

                <Route path="/teacher/dashboard" element={
                  <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
                } />
                <Route path="/teacher/classes" element={
                  <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
                } />
                <Route path="/teacher/classes/:id" element={
                  <ProtectedRoute role="teacher"><TeacherClassPage /></ProtectedRoute>
                } />
                <Route path="/teacher/classes/:id/record-marks" element={
                  <ProtectedRoute role="teacher"><RecordCatMarks /></ProtectedRoute>
                } />
                <Route path="/teacher/classes/:classId/quizzes/:quizId/results" element={
                  <ProtectedRoute role="teacher"><QuizResults /></ProtectedRoute>
                } />

                <Route path="/parent/dashboard" element={
                  <ProtectedRoute role="parent"><ParentHub /></ProtectedRoute>
                } />
                <Route path="/parent/legacy" element={
                  <ProtectedRoute role="parent"><ParentDashboard /></ProtectedRoute>
                } />
                <Route path="/parent/class-moments" element={
                  <ProtectedRoute role="parent"><ClassMomentsPage backPath="/parent/dashboard" /></ProtectedRoute>
                } />
                <Route path="/parent/class-moments/:id" element={
                  <ProtectedRoute role="parent"><ClassMomentsPage backPath="/parent/dashboard" /></ProtectedRoute>
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
                <Route path="/student/classes/:classId/group-quizzes/:assignmentId" element={
                  <ProtectedRoute role="student"><TakeGroupQuiz /></ProtectedRoute>
                } />
                <Route path="/student/notes" element={
                  <ProtectedRoute role="student"><StudentNotes /></ProtectedRoute>
                } />
                <Route path="/student/quiz-reports" element={
                  <ProtectedRoute role="student"><StudentQuizReportsPage /></ProtectedRoute>
                } />
                <Route path="/student/ai-revision" element={
                  <ProtectedRoute role="student"><AIRevision /></ProtectedRoute>
                } />
                <Route path="/student/ai-revision/progress" element={
                  <ProtectedRoute role="student"><AIRevisionProgress /></ProtectedRoute>
                } />
                <Route path="/student/class-moments" element={
                  <ProtectedRoute role="student"><ClassMomentsPage backPath="/student/dashboard" /></ProtectedRoute>
                } />
                <Route path="/student/class-moments/:id" element={
                  <ProtectedRoute role="student"><ClassMomentsPage backPath="/student/dashboard" /></ProtectedRoute>
                } />

                <Route path="/teacher/class-moments" element={
                  <ProtectedRoute role="teacher"><ClassMomentsPage backPath="/teacher/dashboard" /></ProtectedRoute>
                } />
                <Route path="/teacher/class-moments/:id" element={
                  <ProtectedRoute role="teacher"><ClassMomentsPage backPath="/teacher/dashboard" /></ProtectedRoute>
                } />
                <Route path="/head-teacher/class-moments" element={
                  <ProtectedRoute role="head_teacher"><ClassMomentsPage backPath="/head-teacher/dashboard" /></ProtectedRoute>
                } />
                <Route path="/head-teacher/class-moments/:id" element={
                  <ProtectedRoute role="head_teacher"><ClassMomentsPage backPath="/head-teacher/dashboard" /></ProtectedRoute>
                } />

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/email-confirmed" element={<EmailConfirmed />} />

                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute><Messages /></ProtectedRoute>
                } />

                {/* ── Alumni Module Routes ───────────────────────── */}
                <Route path="/alumni/dashboard" element={
                  <ProtectedRoute role="alumni"><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniDashboard /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/profile/:identifier" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniProfile /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/directory" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniDirectory /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/compose" element={
                  <ProtectedRoute role="alumni"><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniCompose /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/compose/:id" element={
                  <ProtectedRoute role="alumni"><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniCompose /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/composition/:slug" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniComposition /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/wallet" element={
                  <ProtectedRoute role="alumni"><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniWallet /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/graduation" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><GraduationManager /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/groups" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniGroups /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/groups/:id" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniGroupChat /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/feed" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniFeed /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/post/:postId" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniPostDetail /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/primary-things" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniPrimaryThings /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/notes" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniNotes /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/quizzes" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniQuizzes /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/homework" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniHomework /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/library" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniLibrary /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/past-papers" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniPastPapers /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/colleagues" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniColleagues /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/chat/:userId" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniDirectChat /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/dean" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniDean /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/opportunities" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniOpportunities /></Suspense></ProtectedRoute>
                } />
                <Route path="/alumni/admin" element={
                  <ProtectedRoute><Suspense fallback={<div style={{padding:40,textAlign:'center'}}>Loading...</div>}><AlumniAdmin /></Suspense></ProtectedRoute>
                } />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InstallProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
          <AppShell />
        </BrowserRouter>
      </InstallProvider>
    </AuthProvider>
  );
}
