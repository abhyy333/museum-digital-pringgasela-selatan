import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Globe, Sparkles, User, MapPin, Wrench, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { Craft } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Badge } from '../../components/common/Badge';
import { getFallbackImage, getFileViewUrl } from '../../utils/media';

export const CraftDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { locale, toggleLocale, t } = useLanguage();
  const [craft, setCraft] = useState<Craft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCraft = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.getCraftBySlug(slug);
        setCraft(res.craft);
      } catch (err: any) {
        setError(err.message || 'Karya kerajinan tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    fetchCraft();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingSpinner message={t('Memuat detail kriya tekstil...', 'Loading textile details...')} size="lg" />
      </div>
    );
  }

  if (error || !craft) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <ErrorState
          title={t('Karya Tidak Ditemukan', 'Craft Not Found')}
          message={error || t('Data kerajinan tidak tersedia.', 'Craft details not found.')}
        />
        <div className="text-center mt-6">
          <Link to="/crafts" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Kembali ke Katalog Kerajinan', 'Back to Crafts')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const trans =
    craft.translations?.find((tr) => tr.locale === locale) ||
    craft.translations?.find((tr) => tr.locale === 'id') ||
    craft.translations?.[0];

  const title = trans?.title || craft.slug;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const primaryMediaId = craft.media?.[0]?.mediaAssetId;
  const mainImageUrl = primaryMediaId
    ? getFileViewUrl(primaryMediaId)
    : getFallbackImage('craft');

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="space-y-4 border-b border-border/80 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/crafts"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Kembali ke Katalog Kerajinan', 'Back to Crafts')}</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium hover:bg-sand-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-secondary" />
              <span>{locale === 'id' ? 'English' : 'Bahasa Indonesia'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium hover:bg-sand-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-muted" />
              <span>{copied ? t('Tautan Disalin!', 'Link Copied!') : t('Bagikan', 'Share')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Badge variant="secondary" size="md">
            {craft.craftType === 'tenun' ? 'Tenun Tradisional Pringgasela' : craft.craftType}
          </Badge>
          {craft.isFeatured && (
            <Badge variant="accent" size="md">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              {t('Mahakarya Unggulan', 'Masterpiece')}
            </Badge>
          )}
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-text leading-tight">
          {title}
        </h1>
      </div>

      {/* Media & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 rounded-2xl border border-border overflow-hidden bg-sand-100 aspect-4/3 shadow-sm">
          <img src={mainImageUrl} alt={title} className="w-full h-full object-cover" />
        </div>

        <aside className="lg:col-span-5 space-y-6">
          {/* Quick Technical Specs */}
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-text border-b border-border/60 pb-3">
              {t('Spesifikasi Kriya', 'Craft Specifications')}
            </h3>

            {trans?.technique && (
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-secondary">
                  <Wrench className="w-3.5 h-3.5" />
                  {t('Teknik Pembuatan', 'Weaving Technique')}
                </span>
                <p className="text-sm text-text/80">{trans.technique}</p>
              </div>
            )}

            {trans?.materials && (
              <div className="space-y-1 pt-2 border-t border-border/40">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-secondary">
                  <Package className="w-3.5 h-3.5" />
                  {t('Bahan & Serat', 'Materials & Fibers')}
                </span>
                <p className="text-sm text-text/80">{trans.materials}</p>
              </div>
            )}

            {craft.contributor && (
              <div className="space-y-1 pt-2 border-t border-border/40">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-secondary">
                  <User className="w-3.5 h-3.5" />
                  {t('Pengrajin / Maestro', 'Artisan')}
                </span>
                <p className="text-sm font-medium text-text">{craft.contributor.name}</p>
                {craft.contributor.dusun && (
                  <p className="text-xs text-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {craft.contributor.dusun}
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Main Narrative Text */}
      <div className="max-w-4xl space-y-8 pt-8 border-t border-border">
        {trans?.description && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
              {t('Uraian Lengkap & Karakteristik Tekstil', 'Comprehensive Textile Overview')}
            </h2>
            <div className="text-base text-text/90 leading-relaxed font-sans whitespace-pre-line bg-surface p-6 rounded-2xl border border-border">
              {trans.description}
            </div>
          </div>
        )}

        {trans?.culturalMeaning && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
              {t('Makna Kultural dalam Masyarakat Sasak', 'Cultural Significance in Sasak Society')}
            </h2>
            <div className="text-base text-text/90 leading-relaxed font-sans whitespace-pre-line bg-sand-50 p-6 rounded-2xl border border-border border-l-4 border-l-secondary">
              {trans.culturalMeaning}
            </div>
          </div>
        )}
      </div>

    </article>
  );
};
