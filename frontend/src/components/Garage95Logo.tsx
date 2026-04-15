interface Garage95LogoProps {
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

export const Garage95Logo = ({ size = 'md', showText = true, className = '' }: Garage95LogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <img
        src="/logo-garage95.svg"
        alt="Garage95"
        height={s.h}
        style={{ height: s.h, width: 'auto', objectFit: 'contain', marginRight: -s.h * 0.3 }}
      />
      {showText && (
        <span className={`font-extrabold tracking-wider uppercase ${s.text}`}
          style={{
            background: 'linear-gradient(135deg, #fff 60%, #fcd34d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GARAGE<span style={{ WebkitTextFillColor: '#FCD34D' }}>95</span>
        </span>
      )}
    </div>
  );
};
