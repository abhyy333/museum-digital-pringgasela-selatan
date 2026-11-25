import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import { CuratorialPage } from './pages/public/CuratorialPage';

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
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Public Layout Wrapper
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text font-sans">
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
  const { user, role, loading, logout } = useAuth();

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

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100 px-4">
        <div className="max-w-md w-full bg-surface rounded-2xl border border-border p-8 text-center shadow-sm space-y-4">
          <h2 className="font-serif text-xl font-bold text-text">Akses Pengelola Ditolak</h2>
          <p className="text-sm text-muted leading-relaxed">
            Akun Anda ({user.email}) terautentikasi di Appwrite namun tidak terdaftar sebagai anggota
            aktif tim kurator (<code className="text-xs bg-sand-200 px-1.5 py-0.5 rounded">museum-admins</code>).
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
            >
              Keluar dari Akun
            </button>
            <a
              href="/"
              className="px-4 py-2 border border-border text-sm text-text rounded-xl hover:bg-sand-100 transition-colors"
            >
              Ke Beranda Publik
            </a>
          </div>
        </div>
      </div>
    );
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
              <Route path="/curatorial" element={<CuratorialPage />} />
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
              <Route path="categories" element={<AdminCategoriesPage />} />
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
