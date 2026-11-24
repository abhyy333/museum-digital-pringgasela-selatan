import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight, Compass, Sparkles, ShieldCheck, History } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { WeavingMotif, Craft, Culture, VillageHistory } from '../../types/schema';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [motifs, setMotifs] = useState<WeavingMotif[]>([]);
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [history, setHistory] = useState<VillageHistory[]>([]);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    if (!fetchedOnce) {
      setLoading(true);
      Promise.allSettled([
        publicApi.getMotifs({ limit: 50 }),
        publicApi.getCrafts({ limit: 50 }),
        publicApi.getCultures({ limit: 50 }),
        publicApi.getHistory(),
      ])
        .then(([mRes, cRes, cuRes, hRes]) => {
          if (mRes.status === 'fulfilled') setMotifs(mRes.value.items || []);
          if (cRes.status === 'fulfilled') setCrafts(cRes.value.items || []);
          if (cuRes.status === 'fulfilled') setCultures(cuRes.value.items || []);
          if (hRes.status === 'fulfilled') setHistory(hRes.value.eras || []);
          setFetchedOnce(true);
        })
        .finally(() => setLoading(false));
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, fetchedOnce, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingMotifs = motifs.filter((m) => {
    if (!q) return true;
    const trans = m.translations?.find((tr) => tr.locale === locale) || m.translations?.[0];
    return (
      trans?.name?.toLowerCase().includes(q) ||
      trans?.philosophy?.toLowerCase().includes(q) ||
      m.codeName?.toLowerCase().includes(q) ||
      m.slug.toLowerCase().includes(q)
    );
  });

  const matchingCrafts = crafts.filter((c) => {
    if (!q) return true;
    const trans = c.translations?.find((tr) => tr.locale === locale) || c.translations?.[0];
    return (
      trans?.title?.toLowerCase().includes(q) ||
      trans?.summary?.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    );
  });

  const matchingCultures = cultures.filter((c) => {
    if (!q) return true;
    const trans = c.translations?.find((tr) => tr.locale === locale) || c.translations?.[0];
    return (
      trans?.title?.toLowerCase().includes(q) ||
      trans?.summary?.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    );
  });

  const matchingHistory = history.filter((h) => {
    if (!q) return true;
    const trans = h.translations?.find((tr) => tr.locale === locale) || h.translations?.[0];
    return (
      trans?.eraTitle?.toLowerCase().includes(q) ||
      trans?.narrative?.toLowerCase().includes(q) ||
      h.slug.toLowerCase().includes(q)
    );
  });

  const totalMatches =
    matchingMotifs.length + matchingCrafts.length + matchingCultures.length + matchingHistory.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-charcoal/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={t('Pencarian Koleksi Museum', 'Search Museum Archive')}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-ivory border border-naturalBeige/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-softLinen bg-surface">
          <Search className="w-5 h-5 text-terracotta shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              'Cari motif tenun, kriya, tradisi Dzikir Saman, atau sejarah desa...',
              'Search weaving motifs, crafts, traditions, or village history...'
            )}
            className="flex-1 bg-transparent text-sm sm:text-base text-charcoal placeholder:text-mutedBrown/70 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-mutedBrown hover:text-charcoal px-2 py-1"
            >
              {t('Hapus', 'Clear')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Tutup pencarian', 'Close search')}
            className="p-1.5 text-charcoal hover:text-terracotta transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Panel */}
        <div className="max-h-[65vh] overflow-y-auto p-5 space-y-6">
          {loading ? (
            <p className="text-sm text-mutedBrown text-center py-8">
              {t('Menelusuri arsip museum...', 'Searching museum archive...')}
            </p>
          ) : totalMatches === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="font-serif text-lg text-charcoal">
                {t('Tidak ditemukan arsip yang cocok', 'No matching archive records')}
              </p>
              <p className="text-xs text-mutedBrown">
                {t('Coba kata kunci lain seperti "Subahnale", "Dzikir Saman", atau "1820".', 'Try keywords like "Subahnale", "Dzikir Saman", or "1820".')}
              </p>
            </div>
          ) : (
            <>
              {matchingMotifs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta">
                    <Compass className="w-3.5 h-3.5" />
                    <span>{t('Motif Tenun', 'Weaving Motifs')}</span>
                  </div>
                  <div className="divide-y divide-softLinen border-y border-softLinen">
                    {matchingMotifs.slice(0, 5).map((item) => {
                      const tr =
                        item.translations?.find((tRow) => tRow.locale === locale) ||
                        item.translations?.[0];
                      return (
                        <Link
                          key={item.$id}
                          to={`/motifs/${item.slug}`}
                          onClick={onClose}
                          className="flex items-center justify-between py-3 px-2 hover:bg-aged/60 transition-colors group"
                        >
                          <div>
                            <p className="font-serif text-base font-semibold text-charcoal group-hover:text-terracotta">
                              {tr?.name || item.slug}
                            </p>
                            {tr?.philosophy && (
                              <p className="text-xs text-mutedBrown line-clamp-1">{tr.philosophy}</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-terracotta shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchingCrafts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('Kerajinan & Tenun', 'Crafts & Textiles')}</span>
                  </div>
                  <div className="divide-y divide-softLinen border-y border-softLinen">
                    {matchingCrafts.slice(0, 5).map((item) => {
                      const tr =
                        item.translations?.find((tRow) => tRow.locale === locale) ||
                        item.translations?.[0];
                      return (
                        <Link
                          key={item.$id}
                          to={`/crafts/${item.slug}`}
                          onClick={onClose}
                          className="flex items-center justify-between py-3 px-2 hover:bg-aged/60 transition-colors group"
                        >
                          <div>
                            <p className="font-serif text-base font-semibold text-charcoal group-hover:text-terracotta">
                              {tr?.title || item.slug}
                            </p>
                            {tr?.summary && (
                              <p className="text-xs text-mutedBrown line-clamp-1">{tr.summary}</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-terracotta shrink-0 ml-3" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchingCultures.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('Cerita & Tradisi', 'Stories & Traditions')}</span>
                  </div>
                  <div className="divide-y divide-softLinen border-y border-softLinen">
                    {matchingCultures.slice(0, 5).map((item) => {
                      const tr =
                        item.translations?.find((tRow) => tRow.locale === locale) ||
                        item.translations?.[0];
                      return (
                        <Link
                          key={item.$id}
                          to={`/cultures/${item.slug}`}
                          onClick={onClose}
                          className="flex items-center justify-between py-3 px-2 hover:bg-aged/60 transition-colors group"
                        >
                          <div>
                            <p className="font-serif text-base font-semibold text-charcoal group-hover:text-terracotta">
                              {tr?.title || item.slug}
                            </p>
                            {tr?.summary && (
                              <p className="text-xs text-mutedBrown line-clamp-1">{tr.summary}</p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-terracotta shrink-0 ml-3" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchingHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-terracotta">
                    <History className="w-3.5 h-3.5" />
                    <span>{t('Arsip & Sejarah Desa', 'Archives & Village History')}</span>
                  </div>
                  <div className="divide-y divide-softLinen border-y border-softLinen">
                    {matchingHistory.slice(0, 5).map((item) => {
                      const tr =
                        item.translations?.find((tRow) => tRow.locale === locale) ||
                        item.translations?.[0];
                      return (
                        <Link
                          key={item.$id}
                          to="/history"
                          onClick={onClose}
                          className="flex items-center justify-between py-3 px-2 hover:bg-aged/60 transition-colors group"
                        >
                          <div>
                            <p className="font-serif text-base font-semibold text-charcoal group-hover:text-terracotta">
                              {tr?.eraTitle || item.slug}
                            </p>
                            <p className="text-xs text-mutedBrown line-clamp-1">
                              {item.startYear} {item.endYear ? `– ${item.endYear}` : ''}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-terracotta shrink-0 ml-3" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
