import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { VillageHistory, HistoryTranslation } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminHistoryPage: React.FC = () => {
  const { user, canPublish, canDelete } = useAuth();
  const [eras, setEras] = useState<VillageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEra, setEditingEra] = useState<VillageHistory[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [selectedEra, setSelectedEra] = useState<VillageHistory | null>(null);
  const [slug, setSlug] = useState('');
  const [startYear, setStartYear] = useState<number | ''>('');
  const [endYear, setEndYear] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Translation Form State
  const [eraTitle, setEraTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [keyFigures, setKeyFigures] = useState('');
  const [legacyToday, setLegacyToday] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'village_history', [
        Query.orderAsc('sortOrder'),
        Query.limit(50),
      ]);

      const rawEras = res.rows as unknown as VillageHistory[];
      const withTrans = await Promise.all(
        rawEras.map(async (era) => {
          try {
            const transRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'history_translations', [
              Query.equal('historyId', era.$id),
            ]);
            era.translations = transRes.rows as unknown as HistoryTranslation[];
          } catch (e) {
            era.translations = [];
          }
          return era;
        })
      );

      setEras(withTrans);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memuat sejarah.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openCreateModal = () => {
    setSelectedEra(null);
    setSlug('');
    setStartYear('');
    setEndYear('');
    setSortOrder(eras.length + 1);
    setStatus('published');
    setEraTitle('');
    setNarrative('');
    setKeyFigures('');
    setLegacyToday('');
    setModalOpen(true);
  };

  const openEditModal = (era: VillageHistory) => {
    setSelectedEra(era);
    setSlug(era.slug);
    setStartYear(era.startYear || '');
    setEndYear(era.endYear || '');
    setSortOrder(era.sortOrder || 1);
    setStatus(era.status);

    const trans = era.translations?.find((t) => t.locale === 'id') || era.translations?.[0];
    setEraTitle(trans?.eraTitle || '');
    setNarrative(trans?.narrative || '');
    setKeyFigures(trans?.keyFigures || '');
    setLegacyToday(trans?.legacyToday || '');

    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !eraTitle || !narrative) {
      setAlertMsg({ type: 'error', text: 'Mohon isi Slug, Judul Babak, dan Narasi Sejarah.' });
      return;
    }

    try {
      setSubmitting(true);
      setAlertMsg(null);

      const eraPayload = {
        slug: slug.trim().toLowerCase(),
        startYear: startYear ? Number(startYear) : null,
        endYear: endYear ? Number(endYear) : null,
        sortOrder: Number(sortOrder) || 1,
        status,
        createdById: user?.$id || 'unknown',
      };

      let historyId = selectedEra?.$id;

      if (selectedEra) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'village_history', selectedEra.$id, eraPayload);
      } else {
        historyId = ID.unique();
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'village_history', historyId, eraPayload);
      }

      // Handle translation
      const existingTrans = selectedEra?.translations?.find((t) => t.locale === 'id');
      const transPayload = {
        historyId: historyId!,
        locale: 'id',
        eraTitle,
        narrative,
        keyFigures: keyFigures || null,
        legacyToday: legacyToday || null,
      };

      if (existingTrans) {
        await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'history_translations', existingTrans.$id, transPayload);
      } else {
        await tablesDB.createRow(APPWRITE_CONFIG.databaseId, 'history_translations', ID.unique(), transPayload);
      }

      setAlertMsg({ type: 'success', text: 'Babak sejarah desa berhasil disimpan!' });
      setModalOpen(false);
      await fetchHistory();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menyimpan babak sejarah.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (era: VillageHistory) => {
    if (!canDelete) {
      alert('Hanya Super Admin yang diizinkan menghapus catatan sejarah.');
      return;
    }
    if (confirm(`Yakin menghapus babak sejarah '${era.slug}'?`)) {
      try {
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'village_history', era.$id);
        await fetchHistory();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message || 'Gagal menghapus.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            <span>Manajemen Linimasa Sejarah Desa</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola babak kronologis berdirinya desa, era kepemimpinan, dan warisan budaya lestari.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-surface text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Babak Sejarah</span>
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

      {loading ? (
        <LoadingSpinner message="Mengambil data sejarah..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Urutan</th>
                <th className="px-6 py-3.5">Rentang Tahun</th>
                <th className="px-6 py-3.5">Judul Babak Sejarah</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {eras.map((era) => {
                const trans = era.translations?.find((t) => t.locale === 'id') || era.translations?.[0];
                return (
                  <tr key={era.$id} className="hover:bg-sand-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary">#{era.sortOrder}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-text">
                      {era.startYear ? `${era.startYear} – ${era.endYear || 'Kini'}` : '-'}
                    </td>
                    <td className="px-6 py-4 font-serif font-bold text-text text-sm">{trans?.eraTitle || era.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${era.status === 'published' ? 'bg-emerald-50 text-emerald-800' : 'bg-sand-200 text-muted'}`}>
                        {era.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEditModal(era)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(era)} className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedEra ? `Sunting: ${selectedEra.slug}` : 'Tambah Babak Sejarah Baru'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Slug URL *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="misal: era-awal-desa"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Urutan Tampil (Sort Order)</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Tahun Awal</label>
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="misal: 1820"
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Tahun Akhir (Kosongkan jika kini)</label>
              <input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="misal: 1900"
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Judul Babak Sejarah *</label>
            <input
              type="text"
              value={eraTitle}
              onChange={(e) => setEraTitle(e.target.value)}
              placeholder="misal: Era Perintisan Sentra Tenun Pringgasela"
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface font-serif font-bold text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">Narasi Sejarah Lengkap *</label>
            <textarea
              rows={4}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Uraian peristiwa, latar belakang, dan perkembangan desa..."
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Tokoh-Tokoh Kunci</label>
              <input
                type="text"
                value={keyFigures}
                onChange={(e) => setKeyFigures(e.target.value)}
                placeholder="Para tetua dan perintis..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Warisan Abadi Masa Kini</label>
              <input
                type="text"
                value={legacyToday}
                onChange={(e) => setLegacyToday(e.target.value)}
                placeholder="Tradisi tenun rumahan..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-border bg-sand-50 text-text">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover text-surface font-semibold">
              {submitting ? 'Menyimpan...' : 'Simpan Sejarah'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
