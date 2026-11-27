import React, { useCallback, useEffect, useState } from 'react';
import { publicApi } from '../../appwrite/publicApi';
import { WeavingMotif, Culture, VillageHistory } from '../../types/schema';
import { HeroStage } from '../../components/home/HeroStage';
import { CollectionShowcase } from '../../components/home/CollectionShowcase';
import { CuratorialExplorer } from '../../components/home/CuratorialExplorer';
import { LiveMuseumArchive } from '../../components/home/LiveMuseumArchive';
import { useLanguage } from '../../context/LanguageContext';
import { useDocumentTitle } from '../../utils/i18n';

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  useDocumentTitle(
    t(
      'Museum Digital Pringgasela Selatan — Arsip Budaya & Tenun Sasak',
      'South Pringgasela Digital Museum — Sasak Cultural & Weaving Archive'
    )
  );
  const [motifs, setMotifs] = useState<WeavingMotif[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [historyEras, setHistoryEras] = useState<VillageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchive = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [motifRes, cultRes, histRes] = await Promise.allSettled([
        publicApi.getMotifs({ limit: 4 }),
        publicApi.getCultures({ limit: 2 }),
        publicApi.getHistory(),
      ]);

      const allFailed =
        motifRes.status === 'rejected' &&
        cultRes.status === 'rejected' &&
        histRes.status === 'rejected';

      if (allFailed) {
        setError('Koneksi ke layanan arsip Appwrite Cloud tidak tersedia saat ini.');
      }

      if (motifRes.status === 'fulfilled') setMotifs(motifRes.value.items || []);
      if (cultRes.status === 'fulfilled') setCultures(cultRes.value.items || []);
      if (histRes.status === 'fulfilled') setHistoryEras(histRes.value.eras || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat arsip museum.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  return (
    <div className="archival-paper-canvas text-[#23211E]">
      {/* Section 1: Layered 3D Hero Stage */}
      <HeroStage />

      {/* Section 2: Featured Collection Strip (Ragam Warisan Pringgasela) */}
      <CollectionShowcase />

      {/* Section 3: Curatorial Essay, Village Landscape & Jelajah Museum */}
      <CuratorialExplorer />

      {/* Section 4: Live Appwrite Cloud Archive Explorer */}
      <LiveMuseumArchive
        motifs={motifs}
        cultures={cultures}
        historyEras={historyEras}
        loading={loading}
        error={error}
        onRetry={fetchArchive}
      />
    </div>
  );
};
