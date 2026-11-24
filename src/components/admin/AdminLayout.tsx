import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Shield,
  History,
  Users,
  Image,
  UserCheck,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { path: '/admin', label: 'Ringkasan Dashboard', icon: LayoutDashboard },
    { path: '/admin/motifs', label: 'Ensiklopedia Motif', icon: BookOpen },
    { path: '/admin/crafts', label: 'Kerajinan & Tenun', icon: Sparkles },
    { path: '/admin/cultures', label: 'Tradisi Budaya', icon: Shield },
    { path: '/admin/history', label: 'Sejarah Desa', icon: History },
    { path: '/admin/contributors', label: 'Tokoh & Pengrajin', icon: Users },
    { path: '/admin/media', label: 'Pustaka Media', icon: Image },
    { path: '/admin/users', label: 'Pengguna & Akses', icon: UserCheck },
    { path: '/admin/settings', label: 'Pengaturan Museum', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const roleBadgeVariant = role === 'super_admin' ? 'accent' : role === 'admin_desa' ? 'primary' : 'secondary';
  const roleLabel =
    role === 'super_admin' ? 'Super Admin' : role === 'admin_desa' ? 'Admin Desa' : 'Admin KKN';

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-indigo-surface border-b border-indigo-border px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="font-serif font-bold text-warm-ivory flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-lg bg-terracotta text-warm-ivory flex items-center justify-center text-xs font-bold shadow-xs">
            M
          </div>
          <span>CMS Pringgasela</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg text-warm-ivory hover:bg-indigo-card border border-indigo-border"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-30 h-screen w-64 bg-indigo-card border-r border-indigo-border flex flex-col justify-between p-4 transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          
          {/* Brand & Portal Header */}
          <div className="px-2 pt-2 pb-4 border-b border-indigo-border">
            <Link to="/admin" className="block group">
              <span className="font-serif text-lg font-bold text-warm-ivory block leading-tight">
                Panel Kurator
              </span>
              <span className="text-[11px] uppercase tracking-wider text-terracotta font-semibold">
                Museum Pringgasela
              </span>
            </Link>
            {role && (
              <div className="mt-3">
                <Badge variant={roleBadgeVariant} size="sm">
                  {roleLabel}
                </Badge>
              </div>
            )}
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-terracotta text-warm-ivory font-semibold shadow-xs'
                      : 'text-warm-ivory/80 hover:bg-indigo-surface hover:text-warm-ivory'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-indigo-border space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-muted-blue hover:text-warm-ivory hover:bg-indigo-surface transition-colors"
          >
            <span>Buka Website Publik</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>

      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>

    </div>
  );
};
