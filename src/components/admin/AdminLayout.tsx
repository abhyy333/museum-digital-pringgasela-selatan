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
  FolderTree,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MuseumLogo } from '../common/MuseumLogo';
import { TextileMotifBand } from '../common/TextileMotifAccent';

interface NavGroup {
  label: string;
  items: Array<{
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
  }>;
}

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, canPublish, isSuperAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups: NavGroup[] = [
    {
      label: 'Ringkasan',
      items: [
        {
          path: '/admin',
          label: 'Dashboard',
          icon: LayoutDashboard,
          visible: true,
        },
      ],
    },
    {
      label: 'Koleksi Budaya',
      items: [
        {
          path: '/admin/motifs',
          label: 'Ensiklopedia Motif',
          icon: BookOpen,
          visible: true,
        },
        {
          path: '/admin/crafts',
          label: 'Kerajinan & Tekstil',
          icon: Sparkles,
          visible: true,
        },
        {
          path: '/admin/cultures',
          label: 'Tradisi Budaya',
          icon: Shield,
          visible: true,
        },
        {
          path: '/admin/history',
          label: 'Sejarah Desa',
          icon: History,
          visible: true,
        },
        {
          path: '/admin/contributors',
          label: 'Tokoh & Penenun',
          icon: Users,
          visible: true,
        },
      ],
    },
    {
      label: 'Pengelolaan',
      items: [
        {
          path: '/admin/media',
          label: 'Pustaka Media',
          icon: Image,
          visible: true,
        },
        {
          path: '/admin/categories',
          label: 'Kategori Budaya',
          icon: FolderTree,
          visible: canPublish,
        },
        {
          path: '/admin/users',
          label: 'Pengguna & Akses',
          icon: UserCheck,
          visible: canPublish,
        },
        {
          path: '/admin/settings',
          label: 'Pengaturan Museum',
          icon: Settings,
          visible: isSuperAdmin,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const roleLabel =
    role === 'super_admin'
      ? 'Super Admin'
      : role === 'admin_desa'
      ? 'Admin Desa'
      : role === 'admin_kkn'
      ? 'Admin KKN'
      : 'Tidak Terdaftar';

  const roleBadgeClass =
    role === 'super_admin'
      ? 'bg-terracotta/12 text-terracotta-deep border-terracotta/25'
      : role === 'admin_desa'
      ? 'bg-indigoTextile/10 text-indigoTextile border-indigoTextile/20'
      : 'bg-aged text-charcoal border-naturalBeige';

  return (
    <div className="min-h-screen bg-ivory flex flex-col md:flex-row font-sans text-charcoal">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-surface border-b border-softLinen px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5">
          <MuseumLogo className="w-7 h-7 text-terracotta shrink-0" />
          <div className="leading-none">
            <span className="font-serif text-sm font-semibold text-charcoal block">
              Panel Kurator
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-mutedBrown block mt-0.5">
              Pringgasela Selatan
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={mobileOpen}
          className="p-2 rounded-[4px] border border-softLinen text-charcoal hover:bg-aged transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-charcoal/35 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Editorial Sidebar */}
      <aside
        aria-label="Navigasi CMS Museum"
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-60 bg-surface border-r border-softLinen flex flex-col justify-between transition-transform duration-200 md:translate-x-0 shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand Crown with Subtle Woven Geometry Motif */}
          <div className="relative overflow-hidden px-5 pt-5 pb-4 border-b border-softLinen">
            <TextileMotifBand className="absolute inset-0" />
            <div className="relative z-10 space-y-3">
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 group">
                <MuseumLogo className="w-8 h-8 text-terracotta group-hover:text-terracotta-hover transition-colors shrink-0" />
                <div className="min-w-0 leading-tight">
                  <span className="font-serif text-base font-semibold text-charcoal block truncate">
                    Panel Kurator
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-mutedBrown block mt-0.5">
                    Pringgasela Selatan
                  </span>
                </div>
              </Link>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-[3px] border text-[11px] font-medium ${roleBadgeClass}`}
                >
                  {roleLabel}
                </span>
                {user?.name && (
                  <span className="text-[11px] text-mutedBrown truncate" title={user.email}>
                    {user.name.split(' ')[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grouped Navigation */}
          <nav className="px-3 py-4 space-y-5">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((i) => i.visible);
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.label} className="space-y-1">
                  <h2 className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-mutedBrown/90">
                    {group.label}
                  </h2>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
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
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-[13px] border-l-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                            isActive
                              ? 'border-terracotta bg-aged/65 text-terracotta-deep font-semibold'
                              : 'border-transparent text-charcoal/85 hover:bg-aged/40 hover:text-charcoal font-normal'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-terracotta' : 'text-mutedBrown'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-softLinen bg-sand-50/70 space-y-1">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-2.5 py-2 rounded-[3px] text-xs font-medium text-charcoal/80 hover:text-charcoal hover:bg-aged/50 transition-colors"
          >
            <span>Buka Situs Publik</span>
            <ExternalLink className="w-3.5 h-3.5 text-mutedBrown" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[3px] text-xs font-medium text-terracotta-deep hover:bg-terracotta/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div className="max-w-6xl mx-auto space-y-8">{children}</div>
      </main>
    </div>
  );
};
