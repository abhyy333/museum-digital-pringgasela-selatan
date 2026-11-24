import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Memuat data warisan budaya...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`${sizeClasses[size]} border-[#1E3246] border-t-terracotta rounded-full animate-spin mb-4`}
      />
      {message && <p className="text-sm font-medium text-[#E8DCC9]/80 tracking-wide font-sans">{message}</p>}
    </div>
  );
};
