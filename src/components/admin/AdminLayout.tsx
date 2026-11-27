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
import { useDocumentTitle } from '../../utils/i18n';
import { MuseumLogo } from '../common/MuseumLogo';
import { TextileMotifAccent } from '../common/TextileMotifAccent';

interface NavGroup {
  heading: string;
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

  useDocumentTitle('Ruang Kurator — Museum Digital Pringgasela Selatan', { noindex: true });

  const navGroups: NavGroup[] = [
    {
      heading: 'RINGKASAN',
      items: [
        {
          path: '/admin',
          label: 'Dashboard Kurator',
          icon: LayoutDashboard,
          visible: true,
        },
      ],
    },
    {
      heading: 'KOLEKSI & ARSIP',
      items: [
        {
          path: '/admin/motifs',
          label: 'Ensiklopedia Motif',
          icon: BookOpen,
          visible: true,
        },
        {
          path: '/admin/crafts',
          label: 'Kerajinan & Tenun',
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
      heading: 'MANAJEMEN',
      items: [
        {
          path: '/admin/categories',
          label: 'Kategori Budaya',
          icon: FolderTree,
          visible: canPublish,
        },
        {
          path: '/admin/media',
          label: 'Pustaka Media',
          icon: Image,
          visible: true,
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

  return (
    <div className="min-h-screen bg-ivory flex flex-col lg:flex-row font-sans text-charcoal">
      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-surface border-b border-softLinen px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5 text-charcoal">
          <MuseumLogo className="w-7 h-7 text-terracotta shrink-0" />
          <div>
            <span className="font-serif text-sm font-bold block leading-tight">
              Ruang Kurator
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-mutedBrown font-semibold block">
              Pringgasela Selatan
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-parchment border border-softLinen text-[10px] font-semibold text-indigoTextile">
            {roleLabel}
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="p-2 rounded text-charcoal hover:bg-aged transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-charcoal/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Editorial Museum Sidebar */}
      <aside
        aria-label="Navigasi Ruang Kurator"
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-surface border-r border-softLinen flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Sidebar Identity Header with Subtle Woven Accent */}
          <div className="relative overflow-hidden px-5 py-5 border-b border-softLinen bg-ivory/60">
            <TextileMotifAccent className="absolute -right-4 -top-4 w-24 h-24 text-terracotta opacity-[0.06] pointer-events-none select-none" />
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="relative flex items-center gap-3 group"
            >
              <MuseumLogo className="w-8 h-8 text-terracotta shrink-0 transition-transform duration-200 group-hover:scale-105" />
              <div className="min-w-0">
                <span className="font-serif text-[15px] font-bold text-charcoal block leading-tight">
                  Ruang Kurator
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-mutedBrown font-semibold block truncate mt-0.5">
                  Pringgasela Selatan
                </span>
              </div>
            </Link>
            <div className="relative mt-3.5 pt-3 border-t border-softLinen/70 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-muted truncate font-medium" title={user?.name || user?.email}>
                {user?.name || 'Staf Kurator'}
              </span>
              <span className="px-2 py-0.5 rounded-xs bg-parchment border border-naturalBeige/60 text-indigoTextile font-semibold shrink-0">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Grouped Navigation */}
          <nav className="px-3 py-4 space-y-5">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((i) => i.visible);
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.heading} className="space-y-1">
                  <h2 className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-mutedBrown">
                    {group.heading}
                  </h2>
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.path === '/admin'
                          ? location.pathname === '/admin'
                          : location.pathname.startsWith(item.path);

                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex items-center gap-3 px-3 py-2 rounded-xs text-[13px] transition-colors ${
                              isActive
                                ? 'bg-aged text-charcoal font-semibold border-l-2 border-terracotta'
                                : 'text-charcoal/80 hover:bg-ivory hover:text-charcoal font-medium border-l-2 border-transparent'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-terracotta' : 'text-mutedBrown'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-softLinen bg-ivory/40 space-y-1">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xs text-xs font-medium text-mutedBrown hover:text-charcoal hover:bg-aged/60 transition-colors"
          >
            <span>Lihat Website Publik</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xs text-xs font-semibold text-terracotta-deep hover:bg-terracotta-light transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar dari Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Editorial Workspace */}
      <main className="flex-1 min-w-0 px-4 sm:px-7 lg:px-10 py-6 sm:py-8 overflow-x-hidden">
        <div className="max-w-[1360px] mx-auto">{children}</div>
      </main>
    </div>
  );
};
