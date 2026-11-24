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
import { getFallbackImage, getFilePreviewUrl, getFileViewUrl } from '../../utils/media';

export const MotifDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { locale, toggleLocale, t } = useLanguage();
  const [motif, setMotif] = useState<WeavingMotif | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <LoadingSpinner message={t('Membuka manuskrip motif tenun...', 'Loading motif manuscript...')} size="lg" />
      </div>
    );
  }

  if (error || !motif) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <ErrorState
          title={t('Motif Tidak Ditemukan', 'Motif Not Found')}
          message={error || t('Arsip motif yang Anda cari tidak tersedia atau belum dipublikasikan.', 'The requested motif is unavailable or unpublished.')}
        />
        <div className="text-center mt-6">
          <Link
            to="/motifs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Kembali ke Ensiklopedia Motif', 'Back to Motif Encyclopedia')}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Active translation
  const trans =
    motif.translations?.find((tr) => tr.locale === locale) ||
    motif.translations?.find((tr) => tr.locale === 'id') ||
    motif.translations?.[0];

  const name = trans?.name || motif.slug;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Compile media items
  const mediaList = motif.media || [];
  const activeMediaId = mediaList[selectedImageIndex]?.mediaAssetId;
  const mainImageUrl = activeMediaId
    ? getFileViewUrl(activeMediaId)
    : getFallbackImage('motif');

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* 1. EDITORIAL HEADER & BREADCRUMB */}
      <div className="space-y-4 border-b border-[#1E3246]/60 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/motifs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8D9CAE] hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Kembali ke Ensiklopedia Motif', 'Back to Encyclopedia')}</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E3246] bg-[#0E1A27] text-xs font-medium text-[#E8DCC9] hover:bg-[#132334] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-terracotta" />
              <span>{locale === 'id' ? 'English Version' : 'Versi Bahasa Indonesia'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E3246] bg-[#0E1A27] text-xs font-medium text-[#E8DCC9] hover:bg-[#132334] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#8D9CAE]" />
              <span>{copied ? t('Tautan Disalin!', 'Link Copied!') : t('Bagikan', 'Share')}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            {motif.codeName && (
              <span className="px-2.5 py-1 rounded-md bg-[#132334] text-terracotta border border-[#1E3246] text-xs font-mono font-semibold tracking-wider">
                {motif.codeName}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {t('Arsip Budaya Terverifikasi', 'Verified Cultural Archive')}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F8F5EF] leading-[1.1]">
            {name}
          </h1>

          <p className="text-sm sm:text-base text-[#E8DCC9]/80 font-sans max-w-3xl leading-relaxed">
            {trans?.philosophy?.slice(0, 180)}...
          </p>
        </div>
      </div>

      {/* 2. MEDIA GALLERY & CURATORIAL METADATA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Photograph & Multi-angle Switcher (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#101D2B] border border-[#1E3246] shadow-md">
            <img
              src={mainImageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail list if multiple photos */}
          {mediaList.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {mediaList.map((m, idx) => {
                const thumbUrl = getFilePreviewUrl(m.mediaAssetId, { width: 150, height: 100 });
                return (
                  <button
                    key={m.mediaAssetId || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIndex === idx ? 'border-terracotta ring-1 ring-terracotta' : 'border-[#1E3246] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-xs text-[#8D9CAE] italic text-center">
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
            <div className="bg-[#0E1A27] rounded-lg border border-[#1E3246] p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-terracotta uppercase tracking-wider">
                <User className="w-4 h-4 text-terracotta" />
                <span>{t('Atribusi Tokoh Adat / Penenun', 'Artisan & Cultural Informant')}</span>
              </div>

              <div>
                <h4 className="font-serif text-xl font-bold text-[#F8F5EF]">
                  {motif.contributor.name}
                </h4>
                <p className="text-xs text-terracotta font-medium uppercase tracking-wider mt-0.5">
                  {motif.contributor.type === 'penenun' ? t('Maestro Penenun Tradisional', 'Master Traditional Weaver') : motif.contributor.type}
                </p>
              </div>

              {motif.contributor.dusun && (
                <div className="flex items-center gap-2 text-xs text-[#E8DCC9]/80">
                  <MapPin className="w-3.5 h-3.5 text-terracotta" />
                  <span>{motif.contributor.dusun}, Pringgasela Selatan</span>
                </div>
              )}

              {motif.contributor.experienceYears && (
                <div className="flex items-center gap-2 text-xs text-[#E8DCC9]/80">
                  <Calendar className="w-3.5 h-3.5 text-terracotta" />
                  <span>{motif.contributor.experienceYears} {t('Tahun Menenun Gedogan', 'Years Practicing Loom Weaving')}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-[#E8DCC9]/75 leading-relaxed border-t border-[#1E3246] pt-3 font-sans">
                {locale === 'en' ? motif.contributor.bioEn || motif.contributor.bioId : motif.contributor.bioId}
              </p>
            </div>
          )}

          {/* Verification & Metadata Specification Card */}
          <div className="bg-[#132334] rounded-lg border border-[#1E3246] p-6 space-y-4 text-xs">
            <h4 className="font-serif text-sm font-bold text-[#F8F5EF] uppercase tracking-wider">
              {t('Spesifikasi Kurasi Budaya', 'Cultural Curation Specs')}
            </h4>
            <div className="space-y-2.5 text-[#E8DCC9]/80">
              <div className="flex justify-between border-b border-[#1E3246] pb-2">
                <span>{t('Kode Registrasi', 'Catalog Code')}</span>
                <span className="font-mono font-semibold text-[#F8F5EF]">{motif.codeName || 'SBN-PGL'}</span>
              </div>
              <div className="flex justify-between border-b border-[#1E3246] pb-2">
                <span>{t('Alat Tenun', 'Loom Type')}</span>
                <span className="font-medium text-[#F8F5EF]">Gedogan (Cag-cag)</span>
              </div>
              <div className="flex justify-between border-b border-[#1E3246] pb-2">
                <span>{t('Pewarna Alami', 'Dyeing')}</span>
                <span className="font-medium text-[#F8F5EF]">Tarum (Indigo), Mahoni</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Status Preservasi', 'Preservation Status')}</span>
                <span className="font-semibold text-emerald-400">Warisan Budaya Hidup</span>
              </div>
            </div>
          </div>

        </aside>

      </div>

      {/* 3. IN-DEPTH EDITORIAL DOCUMENTATION */}
      <div className="max-w-4xl space-y-12 pt-8 border-t border-[#1E3246]/60">
        
        {/* Section A: Visual Morphology & Description */}
        {trans?.visualDescription && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta">
              <Layers className="w-4 h-4" />
              <span>{t('Morfologi & Deskripsi Visual', 'Visual Morphology & Geometry')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EF]">
              {t('Struktur Pola dan Ragam Hias Simetris', 'Geometric Rhythm & Pattern Layout')}
            </h2>
            <div className="text-sm sm:text-base text-[#E8DCC9]/85 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-[#0E1A27] p-6 rounded-lg border border-[#1E3246]">
              {trans.visualDescription}
            </div>
          </section>
        )}

        {/* Section B: Philosophy & Cultural Symbolism */}
        {trans?.philosophy && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta">
              <Sparkles className="w-4 h-4" />
              <span>{t('Filosofi & Makna Spiritual', 'Philosophy & Cosmic Symbolism')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EF]">
              {t('Pesan Luhur di Balik Setiap Rajutan', 'Ancestral Wisdom Woven in Every Thread')}
            </h2>
            <div className="text-sm sm:text-base text-[#E8DCC9]/90 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-[#132334] p-6 rounded-lg border border-[#1E3246] border-l-4 border-l-terracotta">
              {trans.philosophy}
            </div>
          </section>
        )}

        {/* Section C: Weaving Technique & Loom Mechanics */}
        {trans?.technique && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta">
              <BookOpen className="w-4 h-4" />
              <span>{t('Teknik & Rancang Bangun Tenun', 'Weaving Mechanics & Loom Technique')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EF]">
              {t('Keahlian Tangan dan Perhitungan Pakan-Lungsi', 'Manual Craftsmanship & Weft-Warp Execution')}
            </h2>
            <div className="text-sm sm:text-base text-[#E8DCC9]/85 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-[#0E1A27] p-6 rounded-lg border border-[#1E3246]">
              {trans.technique}
            </div>
          </section>
        )}

        {/* Section D: Historical Usage & Lifecycle Rituals */}
        {trans?.historicalUsage && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-terracotta">
              <Info className="w-4 h-4" />
              <span>{t('Penggunaan Adat & Daur Hidup', 'Customary Usage & Life-Cycle Rites')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EF]">
              {t('Busana Upacara dan Penyambutan Tokoh', 'Ceremonial Attire & Sacred Functions')}
            </h2>
            <div className="text-sm sm:text-base text-[#E8DCC9]/85 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-[#0E1A27] p-6 rounded-lg border border-[#1E3246]">
              {trans.historicalUsage}
            </div>
          </section>
        )}

        {/* Section E: Origin Story & Lineage */}
        {trans?.originStory && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8D9CAE]">
              <HistoryIcon className="w-4 h-4 text-terracotta" />
              <span>{t('Asal-Usul & Tutur Lisan', 'Origin Story & Oral Lineage')}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EF]">
              {t('Warisan Sejarah Sejak Kesultanan Selaparang', 'Historical Lineage in Selaparang Era')}
            </h2>
            <div className="text-sm sm:text-base text-[#E8DCC9]/85 leading-relaxed space-y-4 font-sans whitespace-pre-line bg-[#132334] p-6 rounded-lg border border-[#1E3246]">
              {trans.originStory}
            </div>
          </section>
        )}

      </div>

    </article>
  );
};
