import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminRoute from '@/components/common/AdminRoute';
import { PageLoadingFallback } from '@/components/common/LoadingSkeleton';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const RoadmapPage = lazy(() => import('@/pages/RoadmapPage'));
const PracticePage = lazy(() => import('@/pages/PracticePage'));
const ProblemSolvePage = lazy(() => import('@/pages/ProblemSolvePage'));
const LanguagePage = lazy(() => import('@/pages/LanguagePage'));
const DailyChallengePage = lazy(() => import('@/pages/DailyChallengePage'));
const RevisionPage = lazy(() => import('@/pages/RevisionPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const PerformancePage = lazy(() => import('@/pages/PerformancePage'));
const BookmarksPage = lazy(() => import('@/pages/BookmarksPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotesPage = lazy(() => import('@/pages/NotesPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export function App() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/languages" element={<LanguagePage />} />
        <Route path="/languages/:lang" element={<LanguagePage />} />

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/practice/:slug" element={<ProblemSolvePage />} />
            <Route path="/daily-challenge" element={<DailyChallengePage />} />
            <Route path="/revision" element={<RevisionPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notes/:topicSlug" element={<NotesPage />} />
          </Route>
        </Route>

        {/* Admin Only Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/*" element={<AdminPage />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
