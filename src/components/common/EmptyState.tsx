import React from 'react';
import { Archive } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Belum Ada Dokumentasi',
  message = 'Tidak ada arsip budaya yang sesuai dengan filter atau pencarian Anda.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="bg-sand-50 border border-border/80 rounded-xl p-10 max-w-lg mx-auto text-center my-8">
      <div className="w-14 h-14 bg-sand-200 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
        {icon || <Archive className="w-7 h-7" />}
      </div>
      <h3 className="font-serif text-xl font-bold text-text mb-2">{title}</h3>
      <p className="text-sm text-muted mb-6 leading-relaxed">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 text-sm font-medium transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
