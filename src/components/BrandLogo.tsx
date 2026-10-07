import React, { useState } from 'react';
import { Car } from 'lucide-react';

export const APP_LOGO_URL =
  'https://i.postimg.cc/hG3rP7xS/867A955B-953B-4436-971F-279BEC936CF0.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-20 h-20 rounded-2xl',
  }[size];

  const textClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {!imgError ? (
        <img
          src={APP_LOGO_URL}
          alt="Logo GESTÃO CAR"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`${sizeClasses} object-contain bg-[#080808] border border-neutral-800/80 shadow-lg shadow-[#FF202E]/20 shrink-0`}
        />
      ) : (
        <div
          className={`${sizeClasses} bg-[#FF202E] flex items-center justify-center shadow-lg shadow-[#FF202E]/30 shrink-0`}
        >
          <Car className="w-1/2 h-1/2 text-white" />
        </div>
      )}

      {showText && (
        <span
          className={`font-display ${textClasses} font-extrabold tracking-tight text-white whitespace-nowrap`}
        >
          GESTÃO <span className="text-[#FF202E]">CAR</span>
        </span>
      )}
    </div>
  );
};
