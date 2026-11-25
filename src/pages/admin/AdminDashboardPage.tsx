import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  Shield,
  Users,
  Image,
  PlusCircle,
  FileText,
  Activity,
  CheckCircle2,
  History,
  FolderTree,
} from 'lucide-react';
import { Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { AuditLog } from '../../types/schema';

export const AdminDashboardPage: React.FC = () => {
  const { user, role, canPublish, canDelete } = useAuth();
  const [counts, setCounts] = useState({
    motifs: 0,
    crafts: 0,
    cultures: 0,
    history: 0,
    contributors: 0,
    media: 0,
    drafts: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [motifsRes, craftsRes, cultsRes, histRes, contribsRes, mediaRes] =
          await Promise.allSettled([
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'weaving_motifs', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'crafts', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'cultures', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'village_history', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [Query.limit(100)]),
            tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'media_assets', [Query.limit(100)]),
          ]);

        const motifsTotal = motifsRes.status === 'fulfilled' ? motifsRes.value.total : 0;
        const craftsTotal = craftsRes.status === 'fulfilled' ? craftsRes.value.total : 0;
        const cultsTotal = cultsRes.status === 'fulfilled' ? cultsRes.value.total : 0;
        const histTotal = histRes.status === 'fulfilled' ? histRes.value.total : 0;
        const contribsTotal = contribsRes.status === 'fulfilled' ? contribsRes.value.total : 0;
        const mediaTotal = mediaRes.status === 'fulfilled' ? mediaRes.value.total : 0;

        let draftsCount = 0;
        for (const res of [motifsRes, craftsRes, cultsRes, histRes]) {
          if (res.status === 'fulfilled') {
            draftsCount += (res.value.rows || []).filter(
              (r: any) => r.status === 'draft' || r.status === 'in_review'
            ).length;
          }
        }

        setCounts({
          motifs: motifsTotal,
          crafts: craftsTotal,
          cultures: cultsTotal,
          history: histTotal,
          contributors: contribsTotal,
          media: mediaTotal,
          drafts: draftsCount,
        });

        if (canPublish) {
          try {
            const logsRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'audit_logs', [
              Query.orderDesc('$createdAt'),
              Query.limit(10),
            ]);
            setRecentLogs(logsRes.rows as unknown as AuditLog[]);
          } catch {
            setRecentLogs([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [canPublish]);

  if (loading) {
    return <LoadingSpinner message="Menghimpun statistik museum..." size="lg" />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-surface rounded-3xl border border-border p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-secondary block mb-1">
            Selamat Datang di Panel Kurasi
          </span>
          <h1 className="font-serif text-3xl font-bold text-text">
            {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-muted mt-1">
            Peran Aktif:{' '}
            <strong className="text-primary capitalize">{role?.replace('_', ' ')}</strong> • Proyek
            ID: <code className="font-mono">{APPWRITE_CONFIG.projectId}</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/motifs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-surface text-xs font-semibold transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Kelola Motif</span>
          </Link>
          <Link
            to="/admin/media"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-sand-50 hover:bg-sand-100 text-text text-xs font-semibold transition-colors"
          >
            <Image className="w-4 h-4 text-muted" />
            <span>Pustaka Media</span>
          </Link>
          <Link
            to="/admin/categories"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-sand-50 hover:bg-sand-100 text-text text-xs font-semibold transition-colors"
          >
            <FolderTree className="w-4 h-4 text-muted" />
            <span>Kategori</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center justify-between text-primary">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">MTF</span>
          </div>
          <p className="text-2xl font-serif font-bold text-text">{counts.motifs}</p>
          <p className="text-xs text-muted font-medium">Motif Tenun</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center justify-between text-secondary">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">CRF</span>
          </div>
          <p className="text-2xl font-serif font-bold text-text">{counts.crafts}</p>
          <p className="text-xs text-muted font-medium">Kriya & Tekstil</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center justify-between text-accent">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">CLT</span>
          </div>
          <p className="text-2xl font-serif font-bold text-text">{counts.cultures}</p>
          <p className="text-xs text-muted font-medium">Tradisi Budaya</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center justify-between text-primary">
            <History className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">HST</span>
          </div>
          <p className="text-2xl font-serif font-bold text-text">{counts.history}</p>
          <p className="text-xs text-muted font-medium">Babak Sejarah</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center justify-between text-primary">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">CTR</span>
          </div>
          <p className="text-2xl font-serif font-bold text-text">{counts.contributors}</p>
          <p className="text-xs text-muted font-medium">Tokoh & Penenun</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center justify-between text-amber-700">
            <FileText className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">DFT</span>
          </div>
          <p className="text-2xl font-serif font-bold text-text">{counts.drafts}</p>
          <p className="text-xs text-muted font-medium">Draf / Review</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <Image className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">MDA</span>
          </div>
          <p className="text-2xl font-serif font-bold text-text">{counts.media}</p>
          <p className="text-xs text-muted font-medium">Aset Media</p>
        </div>
      </div>

      {/* Permissions & Security Summary */}
      <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-serif text-lg font-bold text-text flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>Matriks Otorisasi Pengguna Anda</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-sand-50 p-4 rounded-xl border border-border/80">
            <span className="font-semibold text-text block mb-1">Penerbitan Konten</span>
            <p className={canPublish ? 'text-emerald-800 font-semibold' : 'text-muted'}>
              {canPublish ? 'DIIZINKAN (Publish/Archive)' : 'Hanya Draf (Perlu Kurasi Desa)'}
            </p>
          </div>
          <div className="bg-sand-50 p-4 rounded-xl border border-border/80">
            <span className="font-semibold text-text block mb-1">Penghapusan Arsip</span>
            <p className={canDelete ? 'text-emerald-800 font-semibold' : 'text-muted'}>
              {canDelete ? 'DIIZINKAN (Super Admin)' : 'Dibatasi (Hanya Super Admin)'}
            </p>
          </div>
          <div className="bg-sand-50 p-4 rounded-xl border border-border/80">
            <span className="font-semibold text-text block mb-1">Preservasi Peneliti KKN</span>
            <p className="text-text/80">
              Atribusi <code className="font-mono">createdById</code> permanen tidak terhapus.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs (Admin Desa & Super Admin) */}
      {canPublish && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-border bg-sand-50/70 flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-text flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>Log Aktivitas Kurasi Terbaru</span>
            </h3>
            <span className="text-[11px] text-muted">{recentLogs.length} rekaman terakhir</span>
          </div>
          {recentLogs.length === 0 ? (
            <div className="p-6 text-xs text-muted text-center">
              Belum ada catatan aktivitas di tabel <code className="font-mono">audit_logs</code>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Waktu</th>
                    <th className="px-6 py-3">Aktor</th>
                    <th className="px-6 py-3">Aksi</th>
                    <th className="px-6 py-3">Entitas</th>
                    <th className="px-6 py-3">Ringkasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentLogs.map((log) => (
                    <tr key={log.$id} className="hover:bg-sand-50/50">
                      <td className="px-6 py-3 font-mono text-[11px] text-muted">
                        {log.$createdAt
                          ? new Date(log.$createdAt).toLocaleString('id-ID')
                          : '-'}
                      </td>
                      <td className="px-6 py-3 font-mono text-text">{log.actorUserId}</td>
                      <td className="px-6 py-3">
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
                      </td>
                      <td className="px-6 py-3 font-mono text-muted">
                        {log.entityType} ({log.entityId})
                      </td>
                      <td className="px-6 py-3 text-[11px] text-muted truncate max-w-xs">
                        {log.changesJson || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
