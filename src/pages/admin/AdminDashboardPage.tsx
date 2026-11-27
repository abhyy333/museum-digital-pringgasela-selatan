import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Clock,
  Eye,
  FileEdit,
  Globe,
  History,
  Image as ImageIcon,
  Monitor,
  Radio,
  RefreshCw,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import {
  AdminAnalyticsSummary,
  fetchAdminAnalyticsSummary,
  subscribeToVisitorRealtime,
} from '../../appwrite/analyticsApi';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { TextileMotifAccent } from '../../components/common/TextileMotifAccent';
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
  published: number;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  motif: 'Motif Tenun',
  craft: 'Kriya & Tekstil',
  culture: 'Tradisi Budaya',
  history: 'Sejarah Desa',
  curatorial: 'Kuratorial',
  about: 'Tentang Museum',
  home: 'Beranda',
};

function formatTimeOnly(iso?: string): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function isGatewayAuthoritativeLog(log: AuditLog): boolean {
  if (!log.changesJson) return false;
  try {
    const parsed = JSON.parse(log.changesJson);
    return parsed?.via === 'server-gateway';
  } catch {
    return false;
  }
}

export const AdminDashboardPage: React.FC = () => {
  const { user, role, canPublish, canDelete, refreshAuth } = useAuth();
  const [counts, setCounts] = useState<ContentCounts>({
    motifs: 0,
    crafts: 0,
    cultures: 0,
    history: 0,
    contributors: 0,
    media: 0,
    drafts: 0,
    published: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const [daysWindow, setDaysWindow] = useState<7 | 30>(30);
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const loadAnalytics = useCallback(
    async (quiet = false) => {
      try {
        if (!quiet) setAnalyticsLoading(true);
        setAnalyticsError(null);
        const summary = await fetchAdminAnalyticsSummary(30);
        setAnalytics(summary);
      } catch (err: any) {
        if (err?.status === 401) {
          refreshAuth().catch(() => {});
        }
        setAnalyticsError(err?.message || 'Gagal memuat analitik pengunjung.');
      } finally {
        if (!quiet) setAnalyticsLoading(false);
      }
    },
    [refreshAuth]
  );

  const loadCmsSummary = useCallback(async () => {
    try {
      setContentLoading(true);
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
          for (const r of res.value.rows || []) {
            if ((r as any).status === 'published') publishedCount += 1;
            else if ((r as any).status === 'draft' || (r as any).status === 'in_review') draftsCount += 1;
          }
        }
      }

      setCounts({
        motifs: motifsRes.status === 'fulfilled' ? motifsRes.value.total : 0,
        crafts: craftsRes.status === 'fulfilled' ? craftsRes.value.total : 0,
        cultures: cultsRes.status === 'fulfilled' ? cultsRes.value.total : 0,
        history: histRes.status === 'fulfilled' ? histRes.value.total : 0,
        contributors: contribsRes.status === 'fulfilled' ? contribsRes.value.total : 0,
        media: mediaRes.status === 'fulfilled' ? mediaRes.value.total : 0,
        drafts: draftsCount,
        published: publishedCount,
      });

      if (canPublish) {
        try {
          const logsRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'audit_logs', [
            Query.orderDesc('$createdAt'),
            Query.limit(6),
          ]);
          setRecentLogs(logsRes.rows as unknown as AuditLog[]);
        } catch {
          setRecentLogs([]);
        }
      }
    } finally {
      setContentLoading(false);
    }
  }, [canPublish]);

  useEffect(() => {
    void loadCmsSummary();
    void loadAnalytics(false);
  }, [loadCmsSummary, loadAnalytics]);

  // Realtime Appwrite subscription + polite 45s background sync fallback
  useEffect(() => {
    const unsub = subscribeToVisitorRealtime(
      () => {
        void loadAnalytics(true);
      },
      (connected) => setRealtimeConnected(connected)
    );

    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadAnalytics(true);
      }
    }, 45_000);

    return () => {
      unsub();
      clearInterval(pollTimer);
    };
  }, [loadAnalytics]);

  if (contentLoading && analyticsLoading && !analytics) {
    return <LoadingSpinner message="Menyiapkan ruang kontrol kurator museum..." size="lg" />;
  }

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const roleLabel =
    role === 'super_admin'
      ? 'Super Admin'
      : role === 'admin_desa'
      ? 'Admin Desa'
      : role === 'admin_kkn'
      ? 'Admin KKN'
      : 'Kurator';

  const publishedDisplay = analytics?.publishedContentCount ?? counts.published;

  const contentSections = [
    {
      label: 'Motif Tenun',
      count: counts.motifs,
      description: 'Ensiklopedia motif pusaka',
      to: '/admin/motifs',
      icon: BookOpen,
    },
    {
      label: 'Kerajinan & Tekstil',
      count: counts.crafts,
      description: 'Karya tenun & kriya lokal',
      to: '/admin/crafts',
      icon: Sparkles,
    },
    {
      label: 'Tradisi Budaya',
      count: counts.cultures,
      description: 'Ritual adat & Dzikir Saman',
      to: '/admin/cultures',
      icon: Shield,
    },
    {
      label: 'Sejarah Desa',
      count: counts.history,
      description: 'Kronik peradaban desa',
      to: '/admin/history',
      icon: History,
    },
    {
      label: 'Tokoh & Penenun',
      count: counts.contributors,
      description: 'Maestro & narasumber budaya',
      to: '/admin/contributors',
      icon: Users,
    },
    {
      label: 'Draf & Review',
      count: counts.drafts,
      description: 'Menunggu verifikasi kurasi',
      to: '/admin/motifs',
      icon: FileEdit,
    },
    {
      label: 'Konten Diterbitkan',
      count: publishedDisplay,
      description: 'Aktif di website publik',
      to: '/admin/motifs',
      icon: Globe,
    },
    {
      label: 'Pustaka Media',
      count: counts.media,
      description: 'Foto, video, audio & arsip',
      to: '/admin/media',
      icon: ImageIcon,
    },
  ];

  return (
    <div className="space-y-7">
      {/* A. Editorial Museum Header */}
      <header className="relative overflow-hidden bg-surface border border-softLinen rounded-md px-6 py-5 sm:px-8 sm:py-6">
        <TextileMotifAccent className="hidden sm:block absolute -right-6 -top-6 w-36 h-36 text-terracotta opacity-[0.055] pointer-events-none select-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-mutedBrown">
              <span className="font-semibold uppercase tracking-[0.16em] text-terracotta">
                Museum Digital Pringgasela Selatan
              </span>
              <span aria-hidden="true">•</span>
              <span>{todayFormatted}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal tracking-tight">
              Selamat datang, Kurator
            </h1>

            <p className="text-xs sm:text-sm text-muted max-w-2xl">
              Pusat kendali kurasi warisan budaya dan pemantauan kunjungan publik secara langsung untuk{' '}
              <strong className="text-charcoal font-medium">{user?.name || user?.email}</strong> ({roleLabel}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs border text-xs font-medium ${
                realtimeConnected
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-ivory border-softLinen text-muted'
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  realtimeConnected ? 'text-emerald-600 animate-pulse' : 'text-mutedBrown'
                }`}
              />
              <span>{realtimeConnected ? 'Realtime Aktif' : 'Sinkronisasi Berkala'}</span>
            </span>

            <button
              type="button"
              onClick={() => void loadAnalytics(false)}
              disabled={analyticsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-ivory hover:bg-aged border border-softLinen text-xs font-semibold text-charcoal transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>
      </header>

      {/* B. Realtime Visitor Overview (4 Key Metrics) */}
      <section aria-label="Ringkasan Pengunjung & Kesiapan Konten" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface border border-softLinen rounded-md p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-mutedBrown">
            <span>Pengunjung Aktif</span>
            <Activity className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-serif text-3xl font-bold text-charcoal">
            {analyticsLoading && !analytics ? '—' : analytics?.activeVisitors ?? 0}
          </p>
          <p className="text-xs text-muted">
            Sesi publik aktif dalam 2 menit terakhir
          </p>
        </div>

        <div className="bg-surface border border-softLinen rounded-md p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-mutedBrown">
            <span>Pengunjung Unik Hari Ini</span>
            <Users className="w-4 h-4 text-indigoTextile" />
          </div>
          <p className="font-serif text-3xl font-bold text-charcoal">
            {analyticsLoading && !analytics ? '—' : analytics?.todayUniqueVisitors ?? 0}
          </p>
          <p className="text-xs text-muted">
            Sesi unik anonim tercatat hari ini (WITA)
          </p>
        </div>

        <div className="bg-surface border border-softLinen rounded-md p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-mutedBrown">
            <span>Total Page Views</span>
            <Eye className="w-4 h-4 text-terracotta" />
          </div>
          <p className="font-serif text-3xl font-bold text-charcoal">
            {analyticsLoading && !analytics ? '—' : analytics?.totalPageViews ?? 0}
          </p>
          <p className="text-xs text-muted">
            Hari ini: <strong className="text-charcoal">{analytics?.todayPageViews ?? 0}</strong> tampilan halaman
          </p>
        </div>

        <div className="bg-surface border border-softLinen rounded-md p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-mutedBrown">
            <span>Konten Diterbitkan</span>
            <Globe className="w-4 h-4 text-terracotta" />
          </div>
          <p className="font-serif text-3xl font-bold text-charcoal">
            {publishedDisplay}
          </p>
          <p className="text-xs text-muted">
            Entri publik aktif ({counts.drafts} dalam antrean draf/review)
          </p>
        </div>
      </section>

      {/* C & D. Visitor Trend Chart + Realtime Visitor Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8">
          <VisitorTrendChart
            series={analytics?.dailySeries || []}
            daysWindow={daysWindow}
            onDaysWindowChange={setDaysWindow}
            loading={analyticsLoading}
            error={analyticsError}
            onRetry={() => void loadAnalytics(false)}
          />
        </div>

        <aside className="xl:col-span-4 bg-surface border border-softLinen rounded-md p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-softLinen/80 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedBrown block">
                  Pantauan Langsung
                </span>
                <h2 className="font-serif text-lg font-bold text-charcoal">
                  Aktivitas Pengunjung
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-xs bg-aged border border-naturalBeige/60 text-xs font-bold text-charcoal">
                {analytics?.activeVisitors ?? 0} Aktif
              </span>
            </div>

            {/* Recent Page Activity (Anonymized — Zero PII) */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-mutedBrown">
                Kunjungan Halaman Terbaru
              </h3>
              {!analytics || analytics.recentActivity.length === 0 ? (
                <p className="text-xs text-muted py-4 text-center bg-ivory/60 rounded border border-softLinen/60">
                  Belum ada aktivitas pengunjung publik tercatat.
                </p>
              ) : (
                <ul className="divide-y divide-softLinen/70">
                  {analytics.recentActivity.slice(0, 5).map((item, idx) => (
                    <li key={`${item.path}-${item.lastSeenAt}-${idx}`} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              item.isActive ? 'bg-emerald-600' : 'bg-naturalBeige'
                            }`}
                          />
                          <span className="font-medium text-charcoal truncate" title={item.pageTitle}>
                            {item.pageTitle || item.path}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted font-mono block pl-3 truncate">
                          {item.path}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[11px] text-muted">
                        {item.deviceCategory === 'mobile' ? (
                          <Smartphone className="w-3.5 h-3.5 text-mutedBrown" aria-label="Mobile" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5 text-mutedBrown" aria-label="Desktop" />
                        )}
                        <span>{formatTimeOnly(item.lastSeenAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Most Visited Routes Compact */}
            {analytics && analytics.topPages.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-softLinen/80">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-mutedBrown">
                  Rute Paling Banyak Dikunjungi
                </h3>
                <div className="space-y-1.5">
                  {analytics.topPages.slice(0, 4).map((pg) => (
                    <div key={pg.pageKey} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-charcoal/85 truncate font-mono text-[11px]">
                        {pg.pageKey}
                      </span>
                      <span className="font-semibold text-terracotta shrink-0">
                        {pg.pageViews} views
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-softLinen/80 flex items-center justify-between text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pembaruan terakhir: {formatTimeOnly(analytics?.generatedAt)}
            </span>
            <span>Tanpa PII</span>
          </div>
        </aside>
      </div>

      {/* E. Content Overview */}
      <section className="space-y-3" aria-labelledby="ringkasan-konten-heading">
        <div className="flex items-end justify-between border-b border-softLinen pb-2.5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedBrown block">
              Ringkasan Manajemen Konten
            </span>
            <h2 id="ringkasan-konten-heading" className="font-serif text-xl font-bold text-charcoal">
              Inventaris Kuratorial &amp; Arsip
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {contentSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.label}
                to={sec.to}
                className="group bg-surface border border-softLinen hover:border-naturalBeige rounded-md p-4 transition-colors flex flex-col justify-between space-y-2.5"
              >
                <div className="flex items-center justify-between text-mutedBrown">
                  <Icon className="w-4 h-4 text-terracotta" />
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-charcoal">{sec.count}</p>
                  <p className="text-xs font-semibold text-charcoal mt-0.5">{sec.label}</p>
                  <p className="text-[11px] text-muted mt-0.5">{sec.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* F & G. Popular Public Content + Compact Curatorial Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* G. Content Popularity */}
        <section className="lg:col-span-5 bg-surface border border-softLinen rounded-md p-5 space-y-4">
          <div className="border-b border-softLinen/80 pb-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedBrown block">
              Daya Tarik Koleksi
            </span>
            <h2 className="font-serif text-lg font-bold text-charcoal">
              Konten Publik Terpopuler
            </h2>
          </div>

          {!analytics || analytics.popularContent.length === 0 ? (
            <div className="py-6 px-4 text-center bg-ivory/60 border border-dashed border-naturalBeige rounded text-xs text-muted space-y-1">
              <p className="font-medium text-charcoal">
                Belum ada kunjungan halaman detail konten
              </p>
              <p>
                Saat pengunjung membuka detail motif, kriya, atau tradisi budaya, peringkat tayangan akan muncul di sini.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-softLinen/70">
              {analytics.popularContent.map((item) => (
                <li key={item.pageKey} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.thumbnailFileId ? (
                      <img
                        src={getFilePreviewUrl(item.thumbnailFileId, { width: 96, height: 96 })}
                        alt={item.titleHint}
                        className="w-10 h-10 rounded-xs object-cover border border-softLinen shrink-0 bg-aged"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xs border border-softLinen bg-ivory flex items-center justify-center shrink-0 text-mutedBrown">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-charcoal truncate">
                        {item.titleHint}
                      </p>
                      <span className="text-[11px] text-muted">
                        {CONTENT_TYPE_LABELS[item.contentType] || item.contentType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-serif text-base font-bold text-terracotta block leading-none">
                      {item.pageViews}
                    </span>
                    <span className="text-[10px] text-muted">views</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* F. Compact Curatorial Activity + Role Matrix */}
        <section className="lg:col-span-7 bg-surface border border-softLinen rounded-md p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-softLinen/80 pb-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedBrown block">
                Jejak Administratif
              </span>
              <h2 className="font-serif text-lg font-bold text-charcoal">
                Aktivitas Kurasi Terbaru
              </h2>
            </div>
            <span className="text-[11px] text-muted">
              Penerbitan: <strong className="text-charcoal">{canPublish ? 'Aktif' : 'Terbatas (Desa)'}</strong> •{' '}
              Hapus Permanen: <strong className="text-charcoal">{canDelete ? 'Super Admin' : 'Dibatasi'}</strong>
            </span>
          </div>

          {!canPublish ? (
            <div className="p-4 bg-ivory border border-softLinen rounded text-xs text-muted flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigoTextile shrink-0 mt-0.5" />
              <p>
                Akses log audit lengkap hanya tersedia untuk <strong>Admin Desa</strong> dan{' '}
                <strong>Super Admin</strong>. Seluruh draf dan unggahan media Anda tersimpan dengan atribusi permanen.
              </p>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="py-5 px-4 text-center bg-ivory/60 border border-dashed border-naturalBeige rounded text-xs text-muted">
              Belum ada aktivitas kurasi atau mutasi media tercatat pada log audit.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="divide-y divide-softLinen/70">
                {recentLogs.map((log) => {
                  const serverAuth = isGatewayAuthoritativeLog(log);
                  return (
                    <div
                      key={log.$id}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          variant={
                            log.action === 'delete'
                              ? 'warning'
                              : log.action === 'publish'
                              ? 'success'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {log.action}
                        </Badge>
                        <span className="font-medium text-charcoal truncate">
                          {log.entityType} • <code className="font-mono text-[11px] text-muted">{log.entityId}</code>
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 text-[11px]">
                        <span
                          className={`px-1.5 py-0.5 rounded-xs border font-medium ${
                            serverAuth
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-ivory border-softLinen text-muted'
                          }`}
                        >
                          {serverAuth ? 'Server Gateway' : 'Catatan Klien'}
                        </span>
                        <span className="text-muted">
                          {log.$createdAt ? new Date(log.$createdAt).toLocaleString('id-ID') : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted pt-1">
                Catatan: Entri bertanda <em>Server Gateway</em> diverifikasi langsung di backend media, sedangkan log CRUD teks berasal dari klien.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
