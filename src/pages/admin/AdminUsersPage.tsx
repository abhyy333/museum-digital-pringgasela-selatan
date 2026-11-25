import React, { useEffect, useState } from 'react';
import { UserCheck, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { Query } from 'appwrite';
import { teams, tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { Profile } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { formatAppwriteError } from '../../utils/audit';

const TEAM_ROLE_TO_PROFILE: Record<string, Profile['role']> = {
  owner: 'super_admin',
  desa: 'admin_desa',
  kkn: 'admin_kkn',
};

export const AdminUsersPage: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamAndProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const [teamRes, profilesRes] = await Promise.allSettled([
          teams.listMemberships(APPWRITE_CONFIG.adminTeamId),
          tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'profiles', [Query.limit(50)]),
        ]);

        if (teamRes.status === 'fulfilled') {
          setMemberships(teamRes.value.memberships || []);
        } else {
          setError(formatAppwriteError(teamRes.reason, refreshAuth));
        }

        if (profilesRes.status === 'fulfilled') {
          setProfiles(profilesRes.value.rows as unknown as Profile[]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeamAndProfiles();
  }, [refreshAuth]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          <span>Pengguna & Otorisasi Tim Kurator</span>
        </h1>
        <p className="text-xs text-muted">
          Tim Appwrite: <code className="font-mono text-primary font-bold">{APPWRITE_CONFIG.adminTeamId}</code> • Daftar kurator aktif di <code className="font-mono">profiles</code> & keanggotaan tim RBAC.
        </p>
      </div>

      {/* Protocol Alert */}
      <div className="bg-sand-50 border border-border p-5 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Protokol Pencabutan Akses Tim Peneliti KKN</span>
        </div>
        <p className="text-text/80 leading-relaxed">
          Saat masa pengabdian mahasiswa KKN berakhir, akun mereka cukup dikeluarkan dari tim <code className="font-mono font-bold">museum-admins</code> melalui Konsol Appwrite. Karena seluruh rekaman data (motif, foto, sejarah) merujuk pada string statis <code className="font-mono">createdById</code>, <strong>100% data budaya yang didokumentasikan mahasiswa tetap aman, utuh, dan teratribusi secara abadi</strong> tanpa risiko terhapus.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Mengambil profil dan keanggotaan tim..." />
      ) : error ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Registered Staff Profiles from TablesDB */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-border bg-sand-50/70 flex items-center justify-between">
              <h2 className="font-serif text-sm font-bold text-text flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Profil Kurator & Pengelola Terdaftar ({profiles.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Nama Pengelola</th>
                    <th className="px-6 py-3.5">User ID</th>
                    <th className="px-6 py-3.5">Peran Sistem</th>
                    <th className="px-6 py-3.5">Institusi</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {profiles.map((p) => {
                    const isSelf = p.userId === user?.$id;
                    return (
                      <tr key={p.$id} className="hover:bg-sand-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-text">
                            {p.fullName} {isSelf && <span className="text-[10px] text-primary">(Anda)</span>}
                          </div>
                          {p.bio && <div className="text-[11px] text-muted mt-0.5">{p.bio}</div>}
                        </td>
                        <td className="px-6 py-4 font-mono text-muted">{p.userId}</td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              p.role === 'super_admin'
                                ? 'accent'
                                : p.role === 'admin_desa'
                                ? 'primary'
                                : 'secondary'
                            }
                            size="sm"
                          >
                            {p.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-text/80">{p.institution || '-'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${
                              p.isActive ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {p.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {profiles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-muted">
                        Belum ada baris profil pada tabel <code className="font-mono">profiles</code>.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Appwrite Team Memberships */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-border bg-sand-50/70">
              <h2 className="font-serif text-sm font-bold text-text">
                Keanggotaan Langsung Tim Appwrite ({memberships.length})
              </h2>
              <p className="text-[11px] text-muted mt-0.5">
                Catatan keamanan Appwrite SDK Klien: nama dan email anggota lain dapat disamarkan
                sebagai privasi akun, sementara peran tim (<code className="font-mono">owner/desa/kkn</code>) diverifikasi server.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Identitas Staf</th>
                    <th className="px-6 py-3.5">Email / Keterangan</th>
                    <th className="px-6 py-3.5">Peran Tim</th>
                    <th className="px-6 py-3.5">Wewenang Sistem</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {memberships.map((m) => {
                    const roleTag = m.roles?.[0] || 'kkn';
                    const isOwner = roleTag === 'owner';
                    const isDesa = roleTag === 'desa';
                    const mappedRole = TEAM_ROLE_TO_PROFILE[roleTag];
                    const matchedProfile =
                      profiles.find((p) => m.userId && p.userId === m.userId) ||
                      profiles.find((p) => mappedRole && p.role === mappedRole);

                    return (
                      <tr key={m.$id} className="hover:bg-sand-50/60 transition-colors">
                        <td className="px-6 py-4 font-semibold text-text">
                          {m.userName || matchedProfile?.fullName || '(Anggota Terdaftar)'}
                        </td>
                        <td className="px-6 py-4 font-mono text-muted">
                          {m.userEmail || 'Disamarkan Appwrite Client Privacy'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={isOwner ? 'accent' : isDesa ? 'primary' : 'secondary'}
                            size="sm"
                          >
                            {roleTag.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-text/80">
                          {isOwner
                            ? 'Super Admin: Kontrol Penuh & Hapus Arsip'
                            : isDesa
                            ? 'Admin Desa: Kurasi & Terbitkan Konten'
                            : 'Admin KKN: Dokumentasi Lapangan (Draf)'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                            {m.confirm ? 'Aktif' : 'Menunggu Konfirmasi'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Role Matrix Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-2">
          <span className="text-xs font-bold text-accent uppercase tracking-wider block">Tingkat 1</span>
          <h3 className="font-serif text-lg font-bold text-text">Super Admin (Owner)</h3>
          <p className="text-xs text-muted leading-relaxed">
            Kepala Desa / Arsitek Utama. Memiliki hak penuh atas konfigurasi platform, manajemen
            kategori, publikasi konten, dan penghapusan permanen.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">Tingkat 2</span>
          <h3 className="font-serif text-lg font-bold text-text">Admin Desa (Desa)</h3>
          <p className="text-xs text-muted leading-relaxed">
            Perangkat Desa & Dewan Kebudayaan. Bertanggung jawab atas kurasi konten, verifikasi
            motif, pengarsipan, dan penerbitan draf publik.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 space-y-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider block">Tingkat 3</span>
          <h3 className="font-serif text-lg font-bold text-text">Admin KKN (KKN)</h3>
          <p className="text-xs text-muted leading-relaxed">
            Mahasiswa Peneliti. Berwenang mencatat dokumentasi lapangan, mengunggah media tenun,
            dan mengajukan draf ke antrean verifikasi desa.
          </p>
        </div>
      </div>
    </div>
  );
};
