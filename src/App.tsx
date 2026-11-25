import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { MotifsPage } from './pages/public/MotifsPage';
import { MotifDetailPage } from './pages/public/MotifDetailPage';
import { CraftsPage } from './pages/public/CraftsPage';
import { CraftDetailPage } from './pages/public/CraftDetailPage';
import { CulturesPage } from './pages/public/CulturesPage';
import { CultureDetailPage } from './pages/public/CultureDetailPage';
import { HistoryPage } from './pages/public/HistoryPage';
import { AboutPage } from './pages/public/AboutPage';

// Admin Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMotifsPage } from './pages/admin/AdminMotifsPage';
import { AdminCraftsPage } from './pages/admin/AdminCraftsPage';
import { AdminCulturesPage } from './pages/admin/AdminCulturesPage';
import { AdminHistoryPage } from './pages/admin/AdminHistoryPage';
import { AdminContributorsPage } from './pages/admin/AdminContributorsPage';
import { AdminMediaPage } from './pages/admin/AdminMediaPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Public Layout Wrapper
const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans ${
        isHome ? 'archival-paper-canvas text-[#23211E]' : 'bg-[#0B1623] text-[#F2E9DC]'
      }`}
    >
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Protected Admin Route Guard
const ProtectedAdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100">
        <LoadingSpinner message="Memeriksa sesi otentikasi kurator..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/motifs" element={<MotifsPage />} />
              <Route path="/motifs/:slug" element={<MotifDetailPage />} />
              <Route path="/crafts" element={<CraftsPage />} />
              <Route path="/crafts/:slug" element={<CraftDetailPage />} />
              <Route path="/cultures" element={<CulturesPage />} />
              <Route path="/cultures/:slug" element={<CultureDetailPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Route>

            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin CMS Routes */}
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="motifs" element={<AdminMotifsPage />} />
              <Route path="crafts" element={<AdminCraftsPage />} />
              <Route path="cultures" element={<AdminCulturesPage />} />
              <Route path="history" element={<AdminHistoryPage />} />
              <Route path="contributors" element={<AdminContributorsPage />} />
              <Route path="media" element={<AdminMediaPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
