import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { Permission, Role } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MuseumSetting } from '../../types/schema';
import { formatAppwriteError, recordAuditLog } from '../../utils/audit';

export const AdminSettingsPage: React.FC = () => {
  const { user, isSuperAdmin, refreshAuth } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingRows, setSettingRows] = useState<MuseumSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'museum_settings');
      const rows = res.rows as unknown as MuseumSetting[];
      setSettingRows(rows);

      const map: Record<string, string> = {};
      rows.forEach((r) => {
        map[r.settingKey] = r.settingValue;
      });
      setSettings(map);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    if (!isSuperAdmin) return;
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !user) return;
    try {
      setSubmitting(true);
      setAlertMsg(null);

      for (const [key, val] of Object.entries(settings)) {
        const row = settingRows.find((r) => r.settingKey === key);
        if (row) {
          await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'museum_settings', row.$id, {
            settingValue: val,
            updatedById: user.$id,
          });
        } else if (val.trim()) {
          await tablesDB.createRow(
            APPWRITE_CONFIG.databaseId,
            'museum_settings',
            `set-${key}`.slice(0, 36),
            {
              settingKey: key,
              settingValue: val.trim(),
              description: key === 'museum_description_en' ? 'Deskripsi publik museum (EN)' : 'Konfigurasi museum',
              updatedById: user.$id,
            },
            [Permission.read(Role.team(APPWRITE_CONFIG.adminTeamId))]
          );
        }
      }

      await recordAuditLog({
        actorUserId: user.$id,
        action: 'update',
        entityType: 'museum_settings',
        entityId: 'global',
        changes: { keys: Object.keys(settings) },
      });

      setAlertMsg({ type: 'success', text: 'Konfigurasi museum berhasil diperbarui!' });
      await fetchSettings();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Mengambil pengaturan museum..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <span>Pengaturan Global Museum Digital</span>
        </h1>
        <p className="text-xs text-muted">
          Konfigurasi identitas platform, alamat sekretariat desa, jam operasional, dan narasi
          publik.
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
          <p>
            Mode Baca-Saja: Sesuai kebijakan Appwrite (<code className="font-mono">owner</code>),
            hanya <strong>Super Admin</strong> yang dapat mengubah pengaturan global museum.
          </p>
        </div>
      )}

      {alertMsg && (
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

      <form
        onSubmit={handleSave}
        className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6 text-xs"
      >
        <div>
          <label className="block font-semibold text-text mb-1">Nama Resmi Museum</label>
          <input
            type="text"
            disabled={!isSuperAdmin}
            value={settings.museum_name || ''}
            onChange={(e) => handleChange('museum_name', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-serif font-bold text-sm disabled:opacity-70"
          />
        </div>

        <div>
          <label className="block font-semibold text-text mb-1">Deskripsi Utama Museum (ID)</label>
          <textarea
            rows={3}
            disabled={!isSuperAdmin}
            value={settings.museum_description_id || ''}
            onChange={(e) => handleChange('museum_description_id', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden leading-relaxed disabled:opacity-70"
          />
        </div>

        <div>
          <label className="block font-semibold text-text mb-1">
            Main Museum Description (EN — Opsional)
          </label>
          <textarea
            rows={2}
            disabled={!isSuperAdmin}
            value={settings.museum_description_en || ''}
            onChange={(e) => handleChange('museum_description_en', e.target.value)}
            placeholder="Digital Museum of South Pringgasela preserves Sasak weaving motifs and living traditions..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden leading-relaxed disabled:opacity-70"
          />
        </div>

        <div>
          <label className="block font-semibold text-text mb-1">Alamat Fisik Sekretariat</label>
          <input
            type="text"
            disabled={!isSuperAdmin}
            value={settings.village_address || ''}
            onChange={(e) => handleChange('village_address', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden disabled:opacity-70"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-text mb-1">Surel Resmi Kontak (Email)</label>
            <input
              type="email"
              disabled={!isSuperAdmin}
              value={settings.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden disabled:opacity-70"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1">Jam Operasional Layanan</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={settings.opening_hours || ''}
              onChange={(e) => handleChange('opening_hours', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden disabled:opacity-70"
            />
          </div>
        </div>

        {isSuperAdmin && (
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-surface text-xs font-semibold transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
