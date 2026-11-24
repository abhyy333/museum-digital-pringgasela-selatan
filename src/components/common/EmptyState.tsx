import React from 'react';
import { Archive } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Belum Ada Dokumentasi',
  message = 'Tidak ada arsip budaya yang sesuai dengan filter atau pencarian Anda.',
  actionLabel,
  actionText,
  onAction,
  icon,
}) => {
  const label = actionLabel || actionText;

  return (
    <div className="bg-[#0E1A27] border border-[#1E3246] rounded-lg p-10 max-w-lg mx-auto text-center my-8 shadow-sm">
      <div className="w-14 h-14 bg-[#132334] text-terracotta rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1E3246]">
        {icon || <Archive className="w-7 h-7" />}
      </div>
      <h3 className="font-serif text-xl font-bold text-[#F8F5EF] mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-[#E8DCC9]/80 mb-6 leading-relaxed font-sans">{message}</p>
      {label && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-lg border border-terracotta text-terracotta hover:bg-terracotta/10 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
        >
          {label}
        </button>
      )}
    </div>
  );
};
