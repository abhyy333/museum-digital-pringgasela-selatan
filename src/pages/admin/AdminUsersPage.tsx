import React, { useEffect, useState } from 'react';
import { UserCheck, Shield, Users, AlertCircle, Info, Lock } from 'lucide-react';
import { teams } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const AdminUsersPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const res = await teams.listMemberships(APPWRITE_CONFIG.adminTeamId);
        setMemberships(res.memberships || []);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat daftar anggota tim.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          <span>Pengguna & Otorisasi Tim Kurator</span>
        </h1>
        <p className="text-xs text-muted">
          Tim: <code className="font-mono text-primary font-bold">{APPWRITE_CONFIG.adminTeamId}</code> • Struktur peran bertingkat Appwrite RBAC.
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
        <LoadingSpinner message="Mengambil data keanggotaan tim..." />
      ) : error ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Nama Staf</th>
                <th className="px-6 py-3.5">Alamat Surel (Email)</th>
                <th className="px-6 py-3.5">Peran dalam Tim</th>
                <th className="px-6 py-3.5">Wewenang Sistem</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {memberships.map((m) => {
                const roleTag = m.roles?.[0] || 'kkn';
                const isOwner = roleTag === 'owner';
                const isDesa = roleTag === 'desa';

                return (
                  <tr key={m.$id} className="hover:bg-sand-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text">{m.userName || m.userId}</td>
                    <td className="px-6 py-4 font-mono text-muted">{m.userEmail}</td>
                    <td className="px-6 py-4">
                      <Badge variant={isOwner ? 'accent' : isDesa ? 'primary' : 'secondary'} size="sm">
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
      )}

      {/* Role Matrix Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-2">
          <span className="text-xs font-bold text-accent uppercase tracking-wider block">Tingkat 1</span>
          <h3 className="font-serif text-lg font-bold text-text">Super Admin (Owner)</h3>
          <p className="text-xs text-muted leading-relaxed">
            Kepala Desa / Arsitek Utama. Memiliki hak penuh atas konfigurasi platform, manajemen peran tim, dan penghapusan permanen.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 space-y-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">Tingkat 2</span>
          <h3 className="font-serif text-lg font-bold text-text">Admin Desa (Desa)</h3>
          <p className="text-xs text-muted leading-relaxed">
            Perangkat Desa & Dewan Kebudayaan. Bertanggung jawab atas kurasi konten, verifikasi motif, dan penerbitan draf publik.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 space-y-2">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider block">Tingkat 3</span>
          <h3 className="font-serif text-lg font-bold text-text">Admin KKN (KKN)</h3>
          <p className="text-xs text-muted leading-relaxed">
            Mahasiswa Peneliti. Berwenang mencatat dokumentasi lapangan, mengunggah foto tenun, dan mengajukan draf riset.
          </p>
        </div>
      </div>

    </div>
  );
};
