import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal Memuat Konten',
  message = 'Terjadi kendala saat menghubungkan ke gerbang data museum.',
  onRetry,
}) => {
  return (
    <div className="bg-[#0E1A27] border border-[#1E3246] rounded-lg p-8 max-w-lg mx-auto text-center my-8 shadow-sm">
      <div className="w-12 h-12 bg-terracotta/15 text-terracotta rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-xl font-bold text-[#F8F5EF] mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-[#E8DCC9]/80 mb-6 leading-relaxed font-sans">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-[#F8F5EF] text-xs font-semibold tracking-wide transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Lagi</span>
        </button>
      )}
    </div>
  );
};
