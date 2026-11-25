import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, History, RotateCcw } from 'lucide-react';
import { ID, Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { VillageHistory, HistoryTranslation } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { buildCreatorRowPermissions, formatAppwriteError, recordAuditLog } from '../../utils/audit';
import {
  cascadeDeleteEntityChildren,
  clearDraftFromSession,
  loadDraftFromSession,
  saveDraftToSession,
  slugifyInput,
} from '../../utils/cmsHelpers';

interface HistoryDraftState {
  slug: string;
  startYear: number | '';
  endYear: number | '';
  sortOrder: number;
  status: 'draft' | 'published';
  eraTitle: string;
  narrative: string;
  keyFigures: string;
  legacyToday: string;
  eraTitleEn: string;
  narrativeEn: string;
  keyFiguresEn: string;
  legacyTodayEn: string;
}

export const AdminHistoryPage: React.FC = () => {
  const { user, canPublish, canDelete, refreshAuth } = useAuth();
  const [eras, setEras] = useState<VillageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingDraft, setPendingDraft] = useState<HistoryDraftState | null>(null);

  // Form State
  const [selectedEra, setSelectedEra] = useState<VillageHistory | null>(null);
  const [slug, setSlug] = useState('');
  const [startYear, setStartYear] = useState<number | ''>('');
  const [endYear, setEndYear] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // ID Translation
  const [eraTitle, setEraTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [keyFigures, setKeyFigures] = useState('');
  const [legacyToday, setLegacyToday] = useState('');

  // EN Translation
  const [eraTitleEn, setEraTitleEn] = useState('');
  const [narrativeEn, setNarrativeEn] = useState('');
  const [keyFiguresEn, setKeyFiguresEn] = useState('');
  const [legacyTodayEn, setLegacyTodayEn] = useState('');

  const draftKey = selectedEra ? `history_${selectedEra.$id}` : 'history_new';

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
            const transRes = await tablesDB.listRows(
              APPWRITE_CONFIG.databaseId,
              'history_translations',
              [Query.equal('historyId', era.$id)]
            );
            era.translations = transRes.rows as unknown as HistoryTranslation[];
          } catch {
            era.translations = [];
          }
          return era;
        })
      );

      setEras(withTrans);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    if (!slug && !eraTitle && !narrative) return;
    saveDraftToSession(draftKey, {
      slug,
      startYear,
      endYear,
      sortOrder,
      status,
      eraTitle,
      narrative,
      keyFigures,
      legacyToday,
      eraTitleEn,
      narrativeEn,
      keyFiguresEn,
      legacyTodayEn,
    });
  }, [
    modalOpen,
    draftKey,
    slug,
    startYear,
    endYear,
    sortOrder,
    status,
    eraTitle,
    narrative,
    keyFigures,
    legacyToday,
    eraTitleEn,
    narrativeEn,
    keyFiguresEn,
    legacyTodayEn,
  ]);

  const applyDraft = (draft: HistoryDraftState) => {
    setSlug(draft.slug || '');
    setStartYear(draft.startYear ?? '');
    setEndYear(draft.endYear ?? '');
    setSortOrder(draft.sortOrder || 1);
    setStatus(draft.status || 'draft');
    setEraTitle(draft.eraTitle || '');
    setNarrative(draft.narrative || '');
    setKeyFigures(draft.keyFigures || '');
    setLegacyToday(draft.legacyToday || '');
    setEraTitleEn(draft.eraTitleEn || '');
    setNarrativeEn(draft.narrativeEn || '');
    setKeyFiguresEn(draft.keyFiguresEn || '');
    setLegacyTodayEn(draft.legacyTodayEn || '');
    setPendingDraft(null);
  };

  const openCreateModal = () => {
    setSelectedEra(null);
    setSlug('');
    setStartYear('');
    setEndYear('');
    setSortOrder(eras.length + 1);
    setStatus('draft');

    setEraTitle('');
    setNarrative('');
    setKeyFigures('');
    setLegacyToday('');

    setEraTitleEn('');
    setNarrativeEn('');
    setKeyFiguresEn('');
    setLegacyTodayEn('');

    setPendingDraft(loadDraftFromSession<HistoryDraftState>('history_new'));
    setAlertMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (era: VillageHistory) => {
    setSelectedEra(era);
    setSlug(era.slug);
    setStartYear(era.startYear ?? '');
    setEndYear(era.endYear ?? '');
    setSortOrder(era.sortOrder || 1);
    setStatus(era.status);

    const idTrans = era.translations?.find((t) => t.locale === 'id') || era.translations?.[0];
    const enTrans = era.translations?.find((t) => t.locale === 'en');

    setEraTitle(idTrans?.eraTitle || '');
    setNarrative(idTrans?.narrative || '');
    setKeyFigures(idTrans?.keyFigures || '');
    setLegacyToday(idTrans?.legacyToday || '');

    setEraTitleEn(enTrans?.eraTitle || '');
    setNarrativeEn(enTrans?.narrative || '');
    setKeyFiguresEn(enTrans?.keyFigures || '');
    setLegacyTodayEn(enTrans?.legacyToday || '');

    setPendingDraft(loadDraftFromSession<HistoryDraftState>(`history_${era.$id}`));
    setAlertMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedSlug = slugifyInput(slug || eraTitle);
    if (!normalizedSlug || !eraTitle.trim() || !narrative.trim()) {
      setAlertMsg({
        type: 'error',
        text: 'Mohon isi Slug, Judul Babak (ID), dan Narasi Sejarah (ID).',
      });
      return;
    }

    if (startYear !== '' && endYear !== '' && Number(endYear) < Number(startYear)) {
      setAlertMsg({
        type: 'error',
        text: 'Tahun Akhir tidak boleh lebih kecil dari Tahun Awal.',
      });
      return;
    }

    if (!canPublish && status === 'published') {
      setAlertMsg({
        type: 'error',
        text: 'Akun KKN hanya dapat menyimpan status Draft pada linimasa sejarah. Publikasi disetujui Admin Desa.',
      });
      return;
    }

    const userId = user?.$id;
    if (!userId) {
      setAlertMsg({ type: 'error', text: 'Sesi pengguna tidak valid.' });
      return;
    }

    try {
      setSubmitting(true);
      setAlertMsg(null);

      const eraPayload: Record<string, any> = {
        slug: normalizedSlug,
        startYear: startYear !== '' ? Number(startYear) : null,
        endYear: endYear !== '' ? Number(endYear) : null,
        sortOrder: Number(sortOrder) || 1,
        status,
      };

      let historyId = selectedEra?.$id;

      if (selectedEra) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'village_history',
          selectedEra.$id,
          eraPayload
        );
      } else {
        historyId = ID.unique();
        eraPayload.createdById = userId;
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'village_history',
          historyId,
          eraPayload,
          buildCreatorRowPermissions(userId)
        );
      }

      const existingIdTrans = selectedEra?.translations?.find((t) => t.locale === 'id');
      const idPayload = {
        historyId: historyId!,
        locale: 'id',
        eraTitle: eraTitle.trim(),
        narrative: narrative.trim(),
        keyFigures: keyFigures.trim() || null,
        legacyToday: legacyToday.trim() || null,
      };

      if (existingIdTrans) {
        await tablesDB.updateRow(
          APPWRITE_CONFIG.databaseId,
          'history_translations',
          existingIdTrans.$id,
          idPayload
        );
      } else {
        await tablesDB.createRow(
          APPWRITE_CONFIG.databaseId,
          'history_translations',
          ID.unique(),
          idPayload,
          buildCreatorRowPermissions(userId)
        );
      }

      if (eraTitleEn.trim() || narrativeEn.trim() || keyFiguresEn.trim() || legacyTodayEn.trim()) {
        const existingEnTrans = selectedEra?.translations?.find((t) => t.locale === 'en');
        const enPayload = {
          historyId: historyId!,
          locale: 'en',
          eraTitle: eraTitleEn.trim() || eraTitle.trim(),
          narrative: narrativeEn.trim() || narrative.trim(),
          keyFigures: keyFiguresEn.trim() || null,
          legacyToday: legacyTodayEn.trim() || null,
        };

        if (existingEnTrans) {
          await tablesDB.updateRow(
            APPWRITE_CONFIG.databaseId,
            'history_translations',
            existingEnTrans.$id,
            enPayload
          );
        } else {
          await tablesDB.createRow(
            APPWRITE_CONFIG.databaseId,
            'history_translations',
            ID.unique(),
            enPayload,
            buildCreatorRowPermissions(userId)
          );
        }
      }

      await recordAuditLog({
        actorUserId: userId,
        action: status === 'published' ? 'publish' : selectedEra ? 'update' : 'create',
        entityType: 'village_history',
        entityId: historyId!,
        changes: { slug: normalizedSlug, status, sortOrder: Number(sortOrder) || 1 },
      });

      clearDraftFromSession(draftKey);
      setAlertMsg({ type: 'success', text: `Babak sejarah '${normalizedSlug}' berhasil disimpan!` });
      setModalOpen(false);
      await fetchHistory();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (era: VillageHistory) => {
    if (!user) return;
    if (!canDelete) {
      if (canPublish && era.status === 'published') {
        if (confirm(`Ubah status babak '${era.slug}' kembali menjadi 'draft'?`)) {
          await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'village_history', era.$id, {
            status: 'draft',
          });
          await fetchHistory();
        }
      } else {
        setAlertMsg({
          type: 'error',
          text: 'Hanya Super Admin yang diizinkan menghapus permanen catatan sejarah.',
        });
      }
      return;
    }

    if (confirm(`YAKIN menghapus babak sejarah '${era.slug}' beserta terjemahannya?`)) {
      try {
        await cascadeDeleteEntityChildren('history', era.$id);
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'village_history', era.$id);
        await recordAuditLog({
          actorUserId: user.$id,
          action: 'delete',
          entityType: 'village_history',
          entityId: era.$id,
          changes: { slug: era.slug },
        });
        setAlertMsg({ type: 'success', text: `Babak sejarah '${era.slug}' telah dihapus.` });
        await fetchHistory();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
      }
    }
  };

  const isStatusLockedForKKN =
    !canPublish && Boolean(selectedEra) && selectedEra?.status === 'published';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            <span>Manajemen Linimasa Sejarah Desa</span>
          </h1>
          <p className="text-xs text-muted">
            Kelola babak kronologis berdirinya desa, tokoh sejarah, sumber lisan/arsip, dan
            warisan budaya lestari.
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

      {alertMsg && !modalOpen && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Mengambil data sejarah..." />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Urutan</th>
                  <th className="px-6 py-3.5">Rentang Tahun</th>
                  <th className="px-6 py-3.5">Judul Babak Sejarah (ID / EN)</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {eras.map((era) => {
                  const idTrans = era.translations?.find((t) => t.locale === 'id') || era.translations?.[0];
                  const enTrans = era.translations?.find((t) => t.locale === 'en');
                  return (
                    <tr key={era.$id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-primary">#{era.sortOrder}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-text">
                        {era.startYear ? `${era.startYear} – ${era.endYear || 'Kini'}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-serif font-bold text-text text-sm">
                          {idTrans?.eraTitle || era.slug}
                        </div>
                        {enTrans?.eraTitle ? (
                          <div className="text-[11px] text-muted">{enTrans.eraTitle}</div>
                        ) : (
                          <div className="text-[10px] text-amber-700">Belum ada terjemahan EN</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={era.status === 'published' ? 'success' : 'neutral'} size="sm">
                          {era.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(era)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                          title="Edit Babak"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {(canDelete || canPublish) && (
                          <button
                            onClick={() => handleDelete(era)}
                            className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50"
                            title={canDelete ? 'Hapus Permanen' : 'Kembalikan ke Draft'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedEra ? `Sunting: ${selectedEra.slug}` : 'Tambah Babak Sejarah Baru'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {alertMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{alertMsg.text}</span>
            </div>
          )}

          {pendingDraft && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-amber-900">
              <span>Ditemukan draf lokal sejarah yang belum tersimpan.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyDraft(pendingDraft)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-700 text-white rounded-lg font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Pulihkan Draf
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearDraftFromSession(draftKey);
                    setPendingDraft(null);
                  }}
                  className="px-2.5 py-1 border border-amber-300 rounded-lg"
                >
                  Abaikan
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Slug URL *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugifyInput(e.target.value))}
                placeholder="misal: era-awal-desa"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">
                Urutan Tampil (Sort Order) *
              </label>
              <input
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Status Publikasi</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                disabled={isStatusLockedForKKN}
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              >
                <option value="draft">Draft (Perlu Verifikasi)</option>
                <option value="published" disabled={!canPublish}>
                  Published {!canPublish ? '(Admin Desa)' : ''}
                </option>
              </select>
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
              <label className="block font-semibold text-text mb-1">
                Tahun Akhir (Kosongkan jika kini)
              </label>
              <input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="misal: 1900"
                className="w-full px-3 py-2 rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-4 bg-sand-50 p-4 rounded-xl border border-border">
            <h4 className="font-serif text-sm font-bold text-primary">
              1. Konten Bahasa Indonesia (Wajib)
            </h4>
            <div>
              <label className="block font-semibold text-text mb-1">Judul Babak Sejarah (ID) *</label>
              <input
                type="text"
                value={eraTitle}
                onChange={(e) => {
                  setEraTitle(e.target.value);
                  if (!selectedEra && !slug) setSlug(slugifyInput(e.target.value));
                }}
                placeholder="misal: Era Perintisan Sentra Tenun Pringgasela"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface font-serif font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">
                Narasi Sejarah Lengkap & Sumber Sejarah (ID) *
              </label>
              <textarea
                rows={4}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Uraian peristiwa, latar belakang, serta sumber arsip desa / keterangan tetua adat..."
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-text mb-1">Tokoh-Tokoh Kunci (ID)</label>
                <input
                  type="text"
                  value={keyFigures}
                  onChange={(e) => setKeyFigures(e.target.value)}
                  placeholder="Para tetua dan perintis..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
                />
              </div>
              <div>
                <label className="block font-semibold text-text mb-1">
                  Warisan Abadi Masa Kini (ID)
                </label>
                <input
                  type="text"
                  value={legacyToday}
                  onChange={(e) => setLegacyToday(e.target.value)}
                  placeholder="Tradisi tenun rumahan..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-sand-50 p-4 rounded-xl border border-border">
            <h4 className="font-serif text-sm font-bold text-secondary">
              2. English Translation (Opsional)
            </h4>
            <div>
              <label className="block font-semibold text-text mb-1">Era Title (EN)</label>
              <input
                type="text"
                value={eraTitleEn}
                onChange={(e) => setEraTitleEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface font-serif font-bold text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-text mb-1">Historical Narrative (EN)</label>
              <textarea
                rows={3}
                value={narrativeEn}
                onChange={(e) => setNarrativeEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-text mb-1">Key Figures (EN)</label>
                <input
                  type="text"
                  value={keyFiguresEn}
                  onChange={(e) => setKeyFiguresEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
                />
              </div>
              <div>
                <label className="block font-semibold text-text mb-1">Present Legacy (EN)</label>
                <input
                  type="text"
                  value={legacyTodayEn}
                  onChange={(e) => setLegacyTodayEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border bg-sand-50 text-text"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-hover text-surface font-semibold"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Sejarah'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
