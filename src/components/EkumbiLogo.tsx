import React from 'react';

interface EkumbiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  light?: boolean;
  compactMobile?: boolean;
}

export const EkumbiLogo: React.FC<EkumbiLogoProps> = ({
  size = 'md',
  variant = 'full',
  light = false,
  compactMobile = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: compactMobile ? 'w-7 h-7 sm:w-9 sm:h-9' : 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-base',
    md: compactMobile ? 'text-sm sm:text-xl' : 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const sloganSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  return (
    <div className={`flex items-center select-none ${compactMobile ? 'gap-2 sm:gap-3' : 'gap-3'}`}>
      {/* Official EKUMBI Sun & Railway Emblem */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-black p-1.5 shadow-md shadow-red-950/20 shrink-0 ${iconSizes[size]}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Ekumbi Sun (Rising Golden Rays) */}
          <circle cx="50" cy="50" r="28" fill="#F59E0B" />
          <path d="M50 8V18M50 82V92M8 50H18M82 50H92M20.3 20.3L27.4 27.4M72.6 72.6L79.7 79.7M20.3 79.7L27.4 72.6M72.6 27.4L79.7 20.3" stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" />
          
          {/* Railway Tracks meeting in horizon */}
          <path d="M22 88L45 52H55L78 88" stroke="#171717" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="33" y1="73" x2="67" y2="73" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <line x1="40" y1="62" x2="60" y2="62" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Modern Aerodynamic High-Speed Train Front */}
          <path d="M38 54C38 43 44 38 50 38C56 38 62 43 62 54L64 68C64 71 61 73 58 73H42C39 73 36 71 36 68L38 54Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
          {/* Windshield */}
          <path d="M42 46C42 43 45 42 50 42C55 42 58 43 58 46L57 52H43L42 46Z" fill="#171717" />
          {/* Train Headlights */}
          <circle cx="43" cy="63" r="2.5" fill="#FDE047" />
          <circle cx="57" cy="63" r="2.5" fill="#FDE047" />
        </svg>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 leading-none whitespace-nowrap">
            <span className={`font-display font-black tracking-tight ${light ? 'text-white' : 'text-slate-900'} ${textSizes[size]}`}>
              EKUMBI
            </span>
            <span className={`font-display font-extrabold tracking-wider text-red-600 ${textSizes[size]}`}>
              EXPRESS
            </span>
          </div>
          <span className={`${compactMobile ? 'hidden sm:block' : ''} font-medium tracking-wide mt-0.5 truncate ${light ? 'text-amber-300' : 'text-amber-700'} ${sloganSizes[size]}`}>
            Um novo horizonte em cada viagem
          </span>
        </div>
      )}
    </div>
  );
};
