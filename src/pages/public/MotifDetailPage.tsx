import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Layers,
  Sparkles,
  BookOpen,
  User,
  MapPin,
  Calendar,
  Globe,
  Info,
  History as HistoryIcon,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { WeavingMotif } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Badge } from '../../components/common/Badge';
import { MediaGalleryViewer } from '../../components/public/MediaGalleryViewer';
import { pickTranslation, useDocumentTitle } from '../../utils/i18n';

export const MotifDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { locale, toggleLocale, t } = useLanguage();
  const [motif, setMotif] = useState<WeavingMotif | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMotif = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.getMotifBySlug(slug);
        setMotif(res.motif);
      } catch (err: any) {
        setError(err.message || 'Motif tenun tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    fetchMotif();
  }, [slug]);

  const trans = pickTranslation(motif?.translations, locale);
  const resolvedTitle = trans?.name || motif?.slug || t('Motif Tenun', 'Weaving Motif');
  useDocumentTitle(`${resolvedTitle} — Museum Digital Pringgasela Selatan`);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingSpinner message={t('Membuka manuskrip motif tenun...', 'Loading motif manuscript...')} size="lg" />
      </div>
    );
  }

  if (error || !motif) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <ErrorState
          title={t('Motif Tidak Ditemukan', 'Motif Not Found')}
          message={error || t('Arsip motif yang Anda cari tidak tersedia atau belum dipublikasikan.', 'The requested motif is unavailable or unpublished.')}
        />
        <div className="text-center mt-6">
          <Link
            to="/motifs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Kembali ke Ensiklopedia Motif', 'Back to Motif Encyclopedia')}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Active translation resolved safely
  const name = trans?.name || motif.slug;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mediaList = motif.media || [];

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* 1. EDITORIAL HEADER & BREADCRUMB */}
      <div className="space-y-4 border-b border-border/80 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/motifs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Kembali ke Ensiklopedia Motif', 'Back to Encyclopedia')}</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium hover:bg-sand-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-secondary" />
              <span>{locale === 'id' ? 'English Version' : 'Versi Bahasa Indonesia'}</span>
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

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {motif.codeName && (
            <span className="px-3 py-1 rounded-md bg-sand-900 text-sand-100 font-mono text-xs font-medium tracking-wider">
              {motif.codeName}
            </span>
          )}
          <Badge variant="primary" size="md">
            {t('Motif Tradisional Pringgasela', 'Pringgasela Traditional Motif')}
          </Badge>
          <Badge variant="success" size="md">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {t('Terverifikasi Dewan Kebudayaan Desa', 'Verified by Cultural Board')}
          </Badge>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-tight">
          {name}
        </h1>
      </div>

      {/* 2. VISUAL ARTIFACT SPREAD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Cultural Imagery & Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <MediaGalleryViewer
            media={mediaList}
            fallbackType="motif"
            title={name}
            aspectClass="aspect-4/3"
          />

          <p className="text-xs text-muted italic text-center">
            {t(
              '* Dokumentasi visual resmi arsip tenun tradisional Desa Pringgasela Selatan.',
              '* Official visual documentation from South Pringgasela traditional weaving archives.'
            )}
          </p>
        </div>

        {/* Informant & Curatorial Sidebar (5 Cols) */}
        <aside className="lg:col-span-5 space-y-6">
          
          {/* Artisan & Cultural Informant Card */}
          {motif.contributor && (
            <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                <User className="w-4 h-4 text-primary" />
                <span>{t('Atribusi Tokoh Adat / Penenun', 'Artisan & Cultural Informant')}</span>
              </div>

              <div>
                <h4 className="font-serif text-xl font-bold text-text">
                  {motif.contributor.name}
                </h4>
                <p className="text-xs text-secondary font-medium uppercase tracking-wider mt-0.5">
                  {motif.contributor.type === 'penenun' ? t('Maestro Penenun Tradisional', 'Master Traditional Weaver') : motif.contributor.type}
                </p>
              </div>

              {motif.contributor.dusun && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span>{motif.contributor.dusun}, Pringgasela Selatan</span>
                </div>
              )}

              {motif.contributor.experienceYears && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{motif.contributor.experienceYears} {t('Tahun Menenun Gedogan', 'Years Practicing Loom Weaving')}</span>
                </div>
              )}

              <p className="text-sm text-text/80 leading-relaxed border-t border-border/60 pt-3">
                {locale === 'en' ? motif.contributor.bioEn || motif.contributor.bioId : motif.contributor.bioId}
              </p>
            </div>
          )}

          {/* Verification & Metadata Specification Card */}
          <div className="bg-sand-50 rounded-2xl border border-border p-6 space-y-4 text-xs">
            <h4 className="font-serif text-sm font-bold text-text uppercase tracking-wider">
              {t('Spesifikasi Kurasi Budaya', 'Cultural Curation Specs')}
            </h4>
            <div className="space-y-2.5 text-muted">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span>{t('Kode Registrasi', 'Catalog Code')}</span>
                <span className="font-mono font-semibold text-text">{motif.codeName || 'SBN-PGL'}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span>{t('Alat Tenun', 'Loom Type')}</span>
                <span className="font-medium text-text">Gedogan (Cag-cag)</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span>{t('Pewarna Alami', 'Dyeing')}</span>
                <span className="font-medium text-text">Tarum (Indigo), Mahoni</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Status Preservasi', 'Preservation Status')}</span>
                <span className="font-semibold text-emerald-800">Warisan Budaya Hidup</span>
              </div>
            </div>
          </div>

        </aside>

      </div>

      {/* 3. IN-DEPTH EDITORIAL DOCUMENTATION */}
      <div className="max-w-4xl space-y-12 pt-8 border-t border-border">
        
        {/* Section A: Visual Morphology & Description */}
        {trans?.visualDescription && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Layers className="w-4 h-4" />
              <span>{t('Morfologi & Deskripsi Visual', 'Visual Morphology & Geometry')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
              {t('Struktur Pola dan Ragam Hias Simetris', 'Geometric Rhythm & Pattern Layout')}
            </h2>
            <div className="text-base text-text/90 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-surface p-6 rounded-2xl border border-border">
              {trans.visualDescription}
            </div>
          </section>
        )}

        {/* Section B: Philosophy & Cultural Symbolism */}
        {trans?.philosophy && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="w-4 h-4" />
              <span>{t('Filosofi & Makna Spiritual', 'Philosophy & Cosmic Symbolism')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
              {t('Pesan Luhur di Balik Setiap Rajutan', 'Ancestral Wisdom Woven in Every Thread')}
            </h2>
            <div className="text-base text-text/90 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-sand-50 p-6 rounded-2xl border border-border border-l-4 border-l-accent">
              {trans.philosophy}
            </div>
          </section>
        )}

        {/* Section C: Weaving Technique & Loom Mechanics */}
        {trans?.technique && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
              <BookOpen className="w-4 h-4" />
              <span>{t('Teknik & Rancang Bangun Tenun', 'Weaving Mechanics & Loom Technique')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
              {t('Keahlian Tangan dan Perhitungan Pakan-Lungsi', 'Manual Craftsmanship & Weft-Warp Execution')}
            </h2>
            <div className="text-base text-text/90 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-surface p-6 rounded-2xl border border-border">
              {trans.technique}
            </div>
          </section>
        )}

        {/* Section D: Historical Usage & Lifecycle Rituals */}
        {trans?.historicalUsage && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Info className="w-4 h-4" />
              <span>{t('Penggunaan Adat & Daur Hidup', 'Customary Usage & Life-Cycle Rites')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
              {t('Busana Upacara dan Penyambutan Tokoh', 'Ceremonial Attire & Sacred Functions')}
            </h2>
            <div className="text-base text-text/90 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-surface p-6 rounded-2xl border border-border">
              {trans.historicalUsage}
            </div>
          </section>
        )}

        {/* Section E: Origin Story & Lineage */}
        {trans?.originStory && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <HistoryIcon className="w-4 h-4" />
              <span>{t('Asal-Usul & Tutur Lisan', 'Origin Story & Oral Lineage')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
              {t('Warisan Sejarah Sejak Kesultanan Selaparang', 'Historical Lineage in Selaparang Era')}
            </h2>
            <div className="text-base text-text/90 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-sand-100 p-6 rounded-2xl border border-border">
              {trans.originStory}
            </div>
          </section>
        )}

      </div>

    </article>
  );
};
