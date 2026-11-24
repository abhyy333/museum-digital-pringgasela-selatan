import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, AlertCircle, Users, MapPin } from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { Contributor, ContributorType } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AdminContributorsPage: React.FC = () => {
  const { canDelete } = useAuth();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContrib, setEditingContrib] = useState<Contributor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ContributorType>('penenun');
  const [dusun, setDusun] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [bioId, setBioId] = useState('');
  const [bioEn, setBioEn] = useState('');

  const fetchContributors = async () => {
    try {
      setLoading(true);
      const res = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'contributors', [
        Query.limit(50),
        Query.orderAsc('name'),
      ]);
      setContributors(res.rows as unknown as Contributor[]);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memuat tokoh.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, []);

  const openCreateModal = () => {
    setEditingContrib(null);
    setSlug('');
    setName('');
    setType('penenun');
    setDusun('');
    setExperienceYears('');
    setBioId('');
    setBioEn('');
    setModalOpen(true);
  };

  const openEditModal = (c: Contributor) => {
    setEditingContrib(c);
    setSlug(c.slug);
    setName(c.name);
    setType(c.type);
    setDusun(c.dusun || '');
    setExperienceYears(c.experienceYears || '');
    setBioId(c.bioId || '');
    setBioEn(c.bioEn || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !name) {
      setAlertMsg({ type: 'error', text: 'Mohon isi kolom Slug dan Nama Tokoh.' });
      return;
    }

    try {
      setSubmitting(true);
      setAlertMsg(null);

      const payload = {
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        type,
        dusun: dusun.trim() || null,
        experienceYears: experienceYears ? Number(experienceYears) : null,
        bioId: bioId || null,
        bioEn: bioEn || null,
      };

      if (editingContrib) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'contributors', editingContrib.$id, payload);
      } else {
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'contributors', ID.unique(), payload);
      }

      setAlertMsg({ type: 'success', text: `Data '${name}' berhasil disimpan!` });
      setModalOpen(false);
      await fetchContributors();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menyimpan data tokoh.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: Contributor) => {
    if (!canDelete) {
      alert('Hanya Super Admin yang diizinkan menghapus data tokoh.');
      return;
    }
    if (confirm(`Yakin menghapus data '${c.name}'?`)) {
      try {
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'contributors', c.$id);
        await fetchContributors();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message || 'Gagal menghapus.' });
      }
    }
  };

  const filtered = contributors.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.dusun?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Manajemen Tokoh Adat & Pengrajin Tenun</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola profil maestro penenun, tetua adat, pembatik Sasambo, dan informan budaya desa.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-surface text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tokoh Baru</span>
        </button>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama tokoh atau dusun..."
          className="w-full text-xs bg-transparent focus:outline-hidden"
        />
      </div>

      {loading ? (
        <LoadingSpinner message="Mengambil profil narasumber..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Nama Lengkap</th>
                <th className="px-6 py-3.5">Peran / Bidang</th>
                <th className="px-6 py-3.5">Dusun</th>
                <th className="px-6 py-3.5">Pengalaman</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((c) => (
                <tr key={c.$id} className="hover:bg-sand-50/60 transition-colors">
                  <td className="px-6 py-4 font-serif font-bold text-text text-sm">{c.name}</td>
                  <td className="px-6 py-4">
                    <Badge variant="primary" size="sm">
                      {c.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {c.dusun || '-'}
                  </td>
                  <td className="px-6 py-4 font-mono">{c.experienceYears ? `${c.experienceYears} Tahun` : '-'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEditModal(c)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContrib ? `Sunting: ${editingContrib.name}` : 'Tambah Tokoh Adat / Pengrajin Baru'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Ibu Mariam"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-serif font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Slug URL *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="misal: ibu-mariam"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Tipe Tokoh</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContributorType)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="penenun">Penenun Tradisional</option>
                <option value="pembatik">Pembatik Sasambo</option>
                <option value="tokoh_adat">Tokoh Adat</option>
                <option value="peneliti">Peneliti Budaya</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Dusun Asal</label>
              <input
                type="text"
                value={dusun}
                onChange={(e) => setDusun(e.target.value)}
                placeholder="misal: Dusun Gubuk Timuk"
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Lama Pengalaman (Thn)</label>
              <input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="35"
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Biografi Singkat (ID)</label>
            <textarea
              rows={3}
              value={bioId}
              onChange={(e) => setBioId(e.target.value)}
              placeholder="Riwayat keahlian menenun, dedikasi pelestarian motif kuno..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Short Biography (EN)</label>
            <textarea
              rows={2}
              value={bioEn}
              onChange={(e) => setBioEn(e.target.value)}
              placeholder="Master traditional weaver, preserver of ancestral motifs..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-border bg-sand-50 text-text">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover text-surface font-semibold">
              {submitting ? 'Menyimpan...' : 'Simpan Profil Tokoh'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
