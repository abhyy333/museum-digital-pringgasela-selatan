import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Globe, Moon, Sparkles, Scroll, Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { Culture } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Badge } from '../../components/common/Badge';
import { getFallbackImage, getFileViewUrl } from '../../utils/media';

export const CultureDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { locale, toggleLocale, t } = useLanguage();
  const [culture, setCulture] = useState<Culture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCulture = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.getCultureBySlug(slug);
        setCulture(res.culture);
      } catch (err: any) {
        setError(err.message || 'Warisan budaya tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    fetchCulture();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingSpinner message={t('Membuka risalah tradisi adat...', 'Loading cultural manuscript...')} size="lg" />
      </div>
    );
  }

  if (error || !culture) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <ErrorState
          title={t('Tradisi Tidak Ditemukan', 'Cultural Tradition Not Found')}
          message={error || t('Data tradisi tidak tersedia.', 'Tradition details not found.')}
        />
        <div className="text-center mt-6">
          <Link to="/cultures" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Kembali ke Tradisi Budaya', 'Back to Cultural Heritage')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const trans =
    culture.translations?.find((tr) => tr.locale === locale) ||
    culture.translations?.find((tr) => tr.locale === 'id') ||
    culture.translations?.[0];

  const title = trans?.title || culture.slug;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const primaryMediaId = culture.media?.[0]?.mediaAssetId;
  const mainImageUrl = primaryMediaId
    ? getFileViewUrl(primaryMediaId)
    : getFallbackImage('culture');

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="space-y-4 border-b border-border/80 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/cultures"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Kembali ke Tradisi Budaya', 'Back to Cultural Heritage')}</span>
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
          <Badge variant="accent" size="md">
            <Moon className="w-3.5 h-3.5 mr-1" />
            {culture.periodicity}
          </Badge>
          <Badge variant="primary" size="md">
            {t('Warisan Takbenda Sasak', 'Sasak Intangible Heritage')}
          </Badge>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-text leading-tight">
          {title}
        </h1>
      </div>

      {/* Main Image */}
      <div className="max-w-4xl rounded-2xl border border-border overflow-hidden bg-sand-100 aspect-16/9 shadow-sm">
        <img src={mainImageUrl} alt={title} className="w-full h-full object-cover" />
      </div>

      {/* In-Depth Cultural Sections */}
      <div className="max-w-4xl space-y-10">
        
        {trans?.summary && (
          <div className="bg-sand-50 p-6 rounded-2xl border border-border text-lg font-serif italic text-text/90 leading-relaxed">
            "{trans.summary}"
          </div>
        )}

        {trans?.description && (
          <div className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
              <Scroll className="w-5 h-5 text-accent" />
              <span>{t('Hakikat dan Riwayat Tradisi', 'Heritage Essence & Historical Account')}</span>
            </h2>
            <div className="text-base text-text/90 leading-relaxed font-sans whitespace-pre-line bg-surface p-6 rounded-2xl border border-border">
              {trans.description}
            </div>
          </div>
        )}

        {trans?.ritualProcedure && (
          <div className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>{t('Tata Cara & Prosedur Pelaksanaan Adat', 'Ritual Execution & Ceremonial Order')}</span>
            </h2>
            <div className="text-base text-text/90 leading-relaxed font-sans whitespace-pre-line bg-surface p-6 rounded-2xl border border-border">
              {trans.ritualProcedure}
            </div>
          </div>
        )}

        {trans?.spiritualValue && (
          <div className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
              <Heart className="w-5 h-5 text-accent" />
              <span>{t('Nilai Luhur & Spiritualitas Komunal', 'Spiritual Philosophy & Social Harmony')}</span>
            </h2>
            <div className="text-base text-text/90 leading-relaxed font-sans whitespace-pre-line bg-sand-100 p-6 rounded-2xl border border-border border-l-4 border-l-accent">
              {trans.spiritualValue}
            </div>
          </div>
        )}

      </div>

    </article>
  );
};
