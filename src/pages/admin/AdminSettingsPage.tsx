import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MuseumSetting } from '../../types/schema';

export const AdminSettingsPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
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
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memuat pengaturan.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setAlertMsg(null);

      for (const [key, val] of Object.entries(settings)) {
        const row = settingRows.find((r) => r.settingKey === key);
        if (row) {
          await tablesDB.updateRow(APPWRITE_CONFIG.databaseId, 'museum_settings', row.$id, {
            settingValue: val,
            updatedById: user?.$id || 'unknown',
          });
        }
      }

      setAlertMsg({ type: 'success', text: 'Konfigurasi museum berhasil diperbarui!' });
      await fetchSettings();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memperbarui pengaturan.' });
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
          Konfigurasi identitas platform, alamat sekretariat desa, jam operasional, dan narasi publik.
        </p>
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

      <form onSubmit={handleSave} className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6 text-xs">
        
        <div>
          <label className="block font-semibold text-text mb-1">Nama Resmi Museum</label>
          <input
            type="text"
            value={settings.museum_name || ''}
            onChange={(e) => handleChange('museum_name', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden font-serif font-bold text-sm"
          />
        </div>

        <div>
          <label className="block font-semibold text-text mb-1">Deskripsi Utama Museum (ID)</label>
          <textarea
            rows={3}
            value={settings.museum_description_id || ''}
            onChange={(e) => handleChange('museum_description_id', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden leading-relaxed"
          />
        </div>

        <div>
          <label className="block font-semibold text-text mb-1">Alamat Fisik Sekretariat</label>
          <input
            type="text"
            value={settings.village_address || ''}
            onChange={(e) => handleChange('village_address', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-text mb-1">Surel Resmi Kontak (Email)</label>
            <input
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block font-semibold text-text mb-1">Jam Operasional Layanan</label>
            <input
              type="text"
              value={settings.opening_hours || ''}
              onChange={(e) => handleChange('opening_hours', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
            />
          </div>
        </div>

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

      </form>
    </div>
  );
};
