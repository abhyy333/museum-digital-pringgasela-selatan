import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  FileEdit,
  Globe,
  History,
  Image,
  Monitor,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Users,
  Wifi,
} from 'lucide-react';
import { Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import {
  AdminAnalyticsSummary,
  fetchAdminAnalyticsSummary,
  subscribeAnalyticsRealtime,
} from '../../appwrite/analyticsApi';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TextileDivider, TextileMotifBand } from '../../components/common/TextileMotifAccent';
import { VisitorTrendChart } from '../../components/admin/VisitorTrendChart';
import { getFilePreviewUrl } from '../../utils/media';

interface ContentCounts {
  motifs: number;
  crafts: number;
  cultures: number;
  history: number;
  contributors: number;
  media: number;
  drafts: number;
  publishedLocal: number;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  home: 'Beranda Utama',
  motif: 'Motif Tenun',
  craft: 'Kriya & Tekstil',
  culture: 'Tradisi Budaya',
  curatorial: 'Ulasan Kuratorial',
  history: 'Sejarah Desa',
  about: 'Profil Museum',
  catalog: 'Katalog Publik',
};

const REFERRER_LABELS: Record<string, string> = {
  direct: 'Langsung',
  internal: 'Navigasi Internal',
  search: 'Mesin Pencari',
  social: 'Media Sosial',
  other: 'Tautan Luar',
};

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '-';
  const diffSec = Math.max(0, Math.round((Date.now() - Date.parse(isoString)) / 1000));
  if (diffSec < 15) return 'baru saja';
  if (diffSec < 60) return `${diffSec} dtk lalu`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

function isServerGatewayAudit(log: AuditLog): boolean {
  if (!log.changesJson) return false;
  try {
    const parsed = JSON.parse(log.changesJson);
    return parsed?.via === 'server-gateway';
  } catch {
    return false;
  }
}

export const AdminDashboardPage: React.FC = () => {
  const { user, role, canPublish, canDelete } = useAuth();
  const [counts, setCounts] = useState<ContentCounts>({
    motifs: 0,
    crafts: 0,
    cultures: 0,
    history: 0,
    contributors: 0,
    media: 0,
    drafts: 0,
    publishedLocal: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [cmsLoading, setCmsLoading] = useState(true);

  const [range, setRange] = useState<7 | 30>(30);
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const rangeRef = useRef<7 | 30>(30);
  rangeRef.current = range;

  const loadAnalytics = useCallback(async (selectedRange: 7 | 30, silent = false) => {
    try {
      if (!silent) setAnalyticsLoading(true);
      setAnalyticsError(null);
      const summary = await fetchAdminAnalyticsSummary(selectedRange);
      setAnalytics(summary);
    } catch (err: any) {
      if (!silent) {
        setAnalyticsError(err?.message || 'Gagal memuat analitik pengunjung.');
      }
    } finally {
      if (!silent) setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadCmsSnapshot() {
      try {
        setCmsLoading(true);
        const [motifsRes, craftsRes, cultsRes, histRes, contribsRes, mediaRes] =
          await Promise.allSettled([
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'weaving_motifs', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'crafts', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'cultures', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'village_history', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'media_assets', [Query.limit(100)]),
          ]);

        let draftsCount = 0;
        let publishedCount = 0;
        for (const res of [motifsRes, craftsRes, cultsRes, histRes]) {
          if (res.status === 'fulfilled') {
            for (const row of (res.value.rows || []) as Array<{ status?: string }>) {
              if (row.status === 'published') publishedCount += 1;
              else if (row.status === 'draft' || row.status === 'in_review') draftsCount += 1;
            }
          }
        }

        if (mounted) {
          setCounts({
            motifs: motifsRes.status === 'fulfilled' ? motifsRes.value.total : 0,
            crafts: craftsRes.status === 'fulfilled' ? craftsRes.value.total : 0,
            cultures: cultsRes.status === 'fulfilled' ? cultsRes.value.total : 0,
            history: histRes.status === 'fulfilled' ? histRes.value.total : 0,
            contributors: contribsRes.status === 'fulfilled' ? contribsRes.value.total : 0,
            media: mediaRes.status === 'fulfilled' ? mediaRes.value.total : 0,
            drafts: draftsCount,
            publishedLocal: publishedCount,
          });
        }

        if (canPublish && mounted) {
          try {
            const logsRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'audit_logs', [
              Query.orderDesc('$createdAt'),
              Query.limit(8),
            ]);
            if (mounted) setRecentLogs(logsRes.rows as unknown as AuditLog[]);
          } catch {
            if (mounted) setRecentLogs([]);
          }
        }
      } finally {
        if (mounted) setCmsLoading(false);
      }
    }

    loadCmsSnapshot();
    return () => {
      mounted = false;
    };
  }, [canPublish]);

  useEffect(() => {
    loadAnalytics(range);
  }, [range, loadAnalytics]);

  // Realtime Appwrite subscription + gentle 30s expiry refresh so active 2-min window stays accurate
  useEffect(() => {
    const unsubscribe = subscribeAnalyticsRealtime(() => {
      loadAnalytics(rangeRef.current, true);
    });
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAnalytics(rangeRef.current, true);
      }
    }, 30_000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [loadAnalytics]);

  if (cmsLoading && !analytics) {
    return <LoadingSpinner message="Menyiapkan ruang kendali kurator..." size="lg" />;
  }

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(new Date());

  const roleDisplayName =
    role === 'super_admin' ? 'Super Admin' : role === 'admin_desa' ? 'Admin Desa' : 'Admin KKN';

  const publishedTotal = analytics?.publishedCounts?.total ?? counts.publishedLocal;
  const activeCount = analytics?.activeVisitors ?? 0;

  const contentSections = [
    {
      label: 'Motif Tenun',
      value: counts.motifs,
      description: 'Ensiklopedia ragam hias',
      to: '/admin/motifs',
      icon: BookOpen,
    },
    {
      label: 'Kerajinan & Tekstil',
      value: counts.crafts,
      description: 'Gedogan, sesek & sasambo',
      to: '/admin/crafts',
      icon: Sparkles,
    },
    {
      label: 'Tradisi Budaya',
      value: counts.cultures,
      description: 'Dzikir Saman & adat desa',
      to: '/admin/cultures',
      icon: Shield,
    },
    {
      label: 'Sejarah Desa',
      value: counts.history,
      description: 'Linimasa peradaban desa',
      to: '/admin/history',
      icon: History,
    },
    {
      label: 'Tokoh & Penenun',
      value: counts.contributors,
      description: 'Maestro & narasumber',
      to: '/admin/contributors',
      icon: Users,
    },
    {
      label: 'Draf & Review',
      value: counts.drafts,
      description: 'Menunggu pengesahan kurasi',
      to: '/admin/motifs',
      icon: FileEdit,
    },
    {
      label: 'Konten Diterbitkan',
      value: publishedTotal,
      description: 'Tayang di website publik',
      to: '/admin/motifs',
      icon: Globe,
    },
    {
      label: 'Aset Media',
      value: counts.media,
      description: 'Arsip terverifikasi gateway',
      to: '/admin/media',
      icon: Image,
    },
  ];

  return (
    <div className="space-y-8">
      {/* A. EDITORIAL MUSEUM CONTROL HEADER */}
      <header className="relative overflow-hidden bg-surface border border-softLinen rounded-[4px] px-6 py-5 sm:px-8 sm:py-6">
        <TextileMotifBand className="absolute inset-0" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-mutedBrown">
              <span className="font-medium uppercase tracking-[0.14em] text-terracotta">
                Museum Digital Pringgasela Selatan
              </span>
              <span aria-hidden="true">•</span>
              <span>{todayFormatted} WITA</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-charcoal tracking-tight">
              Selamat datang, Kurator
            </h1>
            <p className="text-sm text-charcoal/75 max-w-2xl">
              Pusat kendali pelestarian arsip tenun, validasi naskah budaya, dan pemantauan kunjungan publik secara langsung
              {user?.name ? ` (${user.name} — ${roleDisplayName})` : ''}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-softLinen bg-ivory text-xs text-charcoal"
              title="Diperbarui otomatis via Appwrite Realtime dan sinkronisasi 30 detik"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  analyticsError ? 'bg-amber-600' : 'bg-emerald-600 animate-pulse'
                }`}
              />
              <Wifi className="w-3.5 h-3.5 text-indigoTextile" />
              <span className="font-medium">
                {analyticsError ? 'Mode Sinkron Terbatas' : 'Analitik Realtime Aktif'}
              </span>
            </div>

            <Link
              to="/admin/media"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-terracotta hover:bg-terracotta-hover text-ivory text-xs font-medium transition-colors"
            >
              <span>Kelola Media</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* B. REALTIME VISITOR OVERVIEW */}
      <section aria-labelledby="realtime-overview-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="realtime-overview-heading"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedBrown"
          >
            Ringkasan Pengunjung & Tayangan Publik
          </h2>
          {analytics?.lastUpdatedAt && (
            <span className="text-xs text-mutedBrown flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Diperbarui {formatRelativeTime(analytics.lastUpdatedAt)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Active Visitors */}
          <div className="bg-surface border border-softLinen rounded-[4px] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-mutedBrown">
              <span>Pengunjung Aktif</span>
              <Activity className="w-4 h-4 text-indigoTextile" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-charcoal tabular-nums">
                {analyticsLoading && !analytics ? '—' : activeCount}
              </p>
              {activeCount > 0 && (
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-[2px]">
                  Sedang membaca
                </span>
              )}
            </div>
            <p className="text-xs text-mutedBrown">Sesi anonim aktif dalam 2 menit terakhir</p>
          </div>

          {/* 2. Unique Visitors Today */}
          <div className="bg-surface border border-softLinen rounded-[4px] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-mutedBrown">
              <span>Pengunjung Unik Hari Ini</span>
              <Compass className="w-4 h-4 text-terracotta" />
            </div>
            <p className="text-3xl font-semibold text-charcoal tabular-nums">
              {analyticsLoading && !analytics ? '—' : analytics?.uniqueVisitorsToday ?? 0}
            </p>
            <p className="text-xs text-mutedBrown">Sesi kunjungan berbeda sejak 00:00 WITA</p>
          </div>

          {/* 3. Total Page Views */}
          <div className="bg-surface border border-softLinen rounded-[4px] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-mutedBrown">
              <span>Total Page Views</span>
              <Eye className="w-4 h-4 text-terracotta" />
            </div>
            <p className="text-3xl font-semibold text-charcoal tabular-nums">
              {analyticsLoading && !analytics ? '—' : analytics?.totalPageViews ?? 0}
            </p>
            <p className="text-xs text-mutedBrown">
              Hari ini:{' '}
              <strong className="font-medium text-charcoal tabular-nums">
                {analytics?.pageViewsToday ?? 0}
              </strong>{' '}
              tayangan halaman
            </p>
          </div>

          {/* 4. Published Content */}
          <div className="bg-surface border border-softLinen rounded-[4px] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-mutedBrown">
              <span>Konten Diterbitkan</span>
              <Globe className="w-4 h-4 text-indigoTextile" />
            </div>
            <p className="text-3xl font-semibold text-charcoal tabular-nums">{publishedTotal}</p>
            <p className="text-xs text-mutedBrown">
              Motif, kriya, tradisi & babak sejarah tayang
            </p>
          </div>
        </div>
      </section>

      {/* C. VISITOR ANALYTICS CHART + D. REALTIME VISITOR ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <VisitorTrendChart
            data={analytics?.trends || []}
            range={range}
            onRangeChange={setRange}
            loading={analyticsLoading && !analytics}
            error={analyticsError}
            onRetry={() => loadAnalytics(range)}
          />
        </div>

        {/* D. REALTIME VISITOR ACTIVITY PANEL */}
        <section
          aria-labelledby="realtime-activity-heading"
          className="lg:col-span-4 bg-surface border border-softLinen rounded-[4px] p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-softLinen/80 pb-3">
            <div>
              <h2
                id="realtime-activity-heading"
                className="font-serif text-lg font-semibold text-charcoal"
              >
                Aktivitas Kunjungan
              </h2>
              <p className="text-xs text-mutedBrown">
                Jejak halaman anonim tanpa identitas pribadi
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-[3px] bg-indigoTextile/10 text-indigoTextile tabular-nums">
              {activeCount} aktif
            </span>
          </div>

          {/* Device Distribution Today */}
          {analytics && (
            <div className="grid grid-cols-3 gap-2 text-center bg-aged/45 border border-softLinen/70 rounded-[3px] p-2.5 text-xs">
              <div>
                <span className="inline-flex items-center gap-1 text-mutedBrown text-[11px]">
                  <Monitor className="w-3 h-3" /> Desktop
                </span>
                <p className="font-semibold text-charcoal tabular-nums">
                  {analytics.deviceBreakdown.desktop}
                </p>
              </div>
              <div className="border-x border-softLinen/80">
                <span className="inline-flex items-center gap-1 text-mutedBrown text-[11px]">
                  <Tablet className="w-3 h-3" /> Tablet
                </span>
                <p className="font-semibold text-charcoal tabular-nums">
                  {analytics.deviceBreakdown.tablet}
                </p>
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-mutedBrown text-[11px]">
                  <Smartphone className="w-3 h-3" /> Seluler
                </span>
                <p className="font-semibold text-charcoal tabular-nums">
                  {analytics.deviceBreakdown.mobile}
                </p>
              </div>
            </div>
          )}

          {!analytics || analytics.recentActivity.length === 0 ? (
            <div className="py-8 text-center space-y-1.5 border border-dashed border-softLinen rounded-[3px] bg-sand-50/50 px-3">
              <p className="text-xs font-medium text-charcoal">Belum ada aktivitas kunjungan terkini</p>
              <p className="text-xs text-mutedBrown">
                Kunjungan publik akan muncul otomatis di panel ini.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-softLinen/70 text-xs max-h-[260px] overflow-y-auto pr-1">
              {analytics.recentActivity.map((item, idx) => (
                <li key={`${item.path}-${item.lastSeenAt}-${idx}`} className="py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          item.isActive ? 'bg-emerald-600' : 'bg-naturalBeige'
                        }`}
                      />
                      <span className="font-medium text-charcoal truncate" title={item.path}>
                        {item.path}
                      </span>
                    </div>
                    <p className="text-[11px] text-mutedBrown pl-3 truncate">
                      {REFERRER_LABELS[item.referrerCategory] || 'Langsung'} •{' '}
                      {item.deviceCategory === 'mobile'
                        ? 'Seluler'
                        : item.deviceCategory === 'tablet'
                        ? 'Tablet'
                        : 'Desktop'}
                    </p>
                  </div>
                  <span className="text-[11px] text-mutedBrown shrink-0 tabular-nums">
                    {formatRelativeTime(item.lastSeenAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <TextileDivider />

      {/* E. CONTENT OVERVIEW */}
      <section aria-labelledby="content-overview-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 id="content-overview-heading" className="font-serif text-xl font-semibold text-charcoal">
              Ringkasan Koleksi & Kurasi
            </h2>
            <p className="text-xs text-mutedBrown">
              Seluruh kategori arsip budaya yang dikelola tim kurator dan mahasiswa peneliti
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-mutedBrown">
            <span>
              Publikasi:{' '}
              <strong className="text-charcoal font-medium">
                {canPublish ? 'Diizinkan' : 'Hanya Draf'}
              </strong>
            </span>
            <span>
              Hapus Permanen:{' '}
              <strong className="text-charcoal font-medium">
                {canDelete ? 'Super Admin' : 'Dibatasi'}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contentSections.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className="group bg-surface border border-softLinen hover:border-naturalBeige rounded-[4px] p-4 sm:p-5 transition-colors flex flex-col justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-charcoal/85 group-hover:text-terracotta transition-colors">
                    {item.label}
                  </span>
                  <Icon className="w-4 h-4 text-mutedBrown group-hover:text-terracotta transition-colors shrink-0" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-charcoal tabular-nums">{item.value}</p>
                  <p className="text-xs text-mutedBrown mt-0.5">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* G. CONTENT POPULARITY + F. COMPACT CURATORIAL ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* G. CONTENT POPULARITY */}
        <section
          aria-labelledby="content-popularity-heading"
          className="lg:col-span-6 bg-surface border border-softLinen rounded-[4px] p-5 sm:p-6 space-y-4"
        >
          <div className="border-b border-softLinen/80 pb-3">
            <h2 id="content-popularity-heading" className="font-serif text-lg font-semibold text-charcoal">
              Popularitas Konten Publik
            </h2>
            <p className="text-xs text-mutedBrown mt-0.5">
              Halaman motif, kriya, dan tradisi dengan tayangan terbanyak dari pengunjung
            </p>
          </div>

          {!analytics || analytics.popularContent.length === 0 ? (
            <div className="py-7 text-center border border-dashed border-softLinen rounded-[3px] bg-sand-50/50 px-4">
              <p className="text-xs font-medium text-charcoal">Belum ada data tayangan konten</p>
              <p className="text-xs text-mutedBrown mt-1">
                Daftar konten terpopuler akan terisi otomatis ketika pengunjung membuka katalog museum.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-softLinen/70">
              {analytics.popularContent.slice(0, 6).map((item, idx) => (
                <li key={item.pageKey} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-mutedBrown w-5 shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {item.thumbnailFileId ? (
                      <img
                        src={getFilePreviewUrl(item.thumbnailFileId, { width: 88, height: 64 })}
                        alt=""
                        loading="lazy"
                        className="w-11 h-9 object-cover rounded-[2px] border border-softLinen bg-aged shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-9 rounded-[2px] border border-softLinen bg-aged/60 flex items-center justify-center text-mutedBrown shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{item.title}</p>
                      <p className="text-xs text-mutedBrown truncate">
                        {CONTENT_TYPE_LABELS[item.contentType] || 'Koleksi'} • {item.pageKey}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-charcoal tabular-nums">
                      {item.pageViews}
                    </p>
                    <p className="text-[11px] text-mutedBrown">tayangan</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* F. COMPACT CURATORIAL ACTIVITY */}
        <section
          aria-labelledby="curatorial-activity-heading"
          className="lg:col-span-6 bg-surface border border-softLinen rounded-[4px] p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-3 border-b border-softLinen/80 pb-3">
            <div>
              <h2 id="curatorial-activity-heading" className="font-serif text-lg font-semibold text-charcoal">
                Aktivitas Kuratorial
              </h2>
              <p className="text-xs text-mutedBrown mt-0.5">
                Rekam tindakan media server-side & aktivitas penyuntingan terbaru
              </p>
            </div>
            {canPublish && (
              <span className="text-xs text-mutedBrown tabular-nums shrink-0">
                {recentLogs.length} rekaman
              </span>
            )}
          </div>

          {!canPublish ? (
            <div className="py-6 px-4 border border-softLinen rounded-[3px] bg-aged/35 text-xs text-charcoal/80 space-y-1.5">
              <p className="font-medium text-charcoal">Ringkasan Log Dibatasi</p>
              <p className="text-mutedBrown leading-relaxed">
                Sesuai kebijakan akses Appwrite, riwayat audit sistem hanya dapat ditinjau oleh Admin Desa dan Super Admin. Seluruh draf yang Anda simpan tetap tercatat dengan atribusi penulis Anda.
              </p>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="py-7 text-center border border-dashed border-softLinen rounded-[3px] bg-sand-50/50 px-4">
              <p className="text-xs font-medium text-charcoal">Belum ada aktivitas kurasi terbaru</p>
              <p className="text-xs text-mutedBrown mt-1">
                Perubahan konten atau unggahan media melalui gateway akan tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <ul className="divide-y divide-softLinen/70 text-xs">
                {recentLogs.map((log) => {
                  const authoritative = isServerGatewayAudit(log);
                  return (
                    <li key={log.$id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-charcoal uppercase text-[11px]">
                            {log.action}
                          </span>
                          <span className="text-charcoal/80 truncate">
                            {log.entityType} ({log.entityId})
                          </span>
                          {authoritative ? (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium"
                              title="Dicatat langsung oleh Server Gateway terotorisasi"
                            >
                              <ShieldCheck className="w-3 h-3" /> Server
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[2px] bg-aged text-mutedBrown border border-softLinen text-[10px] font-medium"
                              title="Catatan aktivitas klien (non-otoritatif)"
                            >
                              Klien
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-mutedBrown truncate">
                          Aktor: {log.actorUserId}
                        </p>
                      </div>
                      <span className="text-[11px] text-mutedBrown shrink-0 tabular-nums">
                        {formatRelativeTime(log.$createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="text-[11px] text-mutedBrown pt-2 border-t border-softLinen/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  Label <strong>Server</strong> menandakan log otoritatif media gateway; label{' '}
                  <strong>Klien</strong> menandakan catatan aktivitas non-media.
                </span>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
