interface ItGeekLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { h: 36, text: 'text-sm' },
  md: { h: 48, text: 'text-lg' },
  lg: { h: 64, text: 'text-2xl' },
  xl: { h: 90, text: 'text-4xl' },
};

export const ItGeekLogo = ({ size = 'md', showText = true, className = '' }: ItGeekLogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-itgeek-vertical.png"
        alt="ItGeek Store"
        height={s.h}
        style={{ height: s.h, width: 'auto', objectFit: 'contain' }}
      />
      {showText && (
        <span className={`font-bold tracking-wide ${s.text} text-white`}>
          ItGeek <span style={{ color: '#19A6A6' }}>Store</span>
        </span>
      )}
    </div>
  );
};
