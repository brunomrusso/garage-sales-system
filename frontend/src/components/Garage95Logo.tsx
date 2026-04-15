interface Garage95LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 32, text: 'text-sm' },
  md: { icon: 40, text: 'text-lg' },
  lg: { icon: 56, text: 'text-2xl' },
  xl: { icon: 72, text: 'text-4xl' },
};

export const Garage95Logo = ({ size = 'md', showText = true, className = '' }: Garage95LogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-garage95.png"
        alt="Garage95"
        width={s.icon}
        height={s.icon}
        style={{ objectFit: 'contain' }}
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
