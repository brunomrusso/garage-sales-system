interface Garage95LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 28, text: 'text-sm' },
  md: { icon: 36, text: 'text-lg' },
  lg: { icon: 48, text: 'text-2xl' },
  xl: { icon: 64, text: 'text-4xl' },
};

export const Garage95Logo = ({ size = 'md', showText = true, className = '' }: Garage95LogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="url(#g95grad)" stroke="#fff" strokeWidth="2" />
        <path
          d="M36 10 L24 32 L33 32 L28 54 L44 26 L34 26 Z"
          fill="#FCD34D"
          stroke="#F59E0B"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <text
          x="32"
          y="58"
          textAnchor="middle"
          fontFamily="Arial Black, Arial, sans-serif"
          fontSize="12"
          fontWeight="900"
          fill="white"
        >
          95
        </text>
        <defs>
          <linearGradient id="g95grad" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
      </svg>
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
