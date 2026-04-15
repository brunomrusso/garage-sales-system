interface Garage95LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 1 | 2;
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 28, text: 'text-sm' },
  md: { icon: 36, text: 'text-lg' },
  lg: { icon: 48, text: 'text-2xl' },
  xl: { icon: 64, text: 'text-4xl' },
};

// Variante 1: Raio com 95 embaixo
const LogoV1 = ({ w }: { w: number }) => (
  <svg width={w} height={w} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#g95v1)" stroke="#fff" strokeWidth="2" />
    <path
      d="M36 10 L24 32 L33 32 L28 54 L44 26 L34 26 Z"
      fill="#FCD34D"
      stroke="#F59E0B"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <text
      x="32" y="58"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, sans-serif"
      fontSize="12" fontWeight="900" fill="white"
    >95</text>
    <defs>
      <linearGradient id="g95v1" x1="0" y1="0" x2="64" y2="64">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
  </svg>
);

// Variante 2: 95 grande e bold com raio cortando ao lado
const LogoV2 = ({ w }: { w: number }) => (
  <svg width={w} height={w} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#g95v2)" stroke="#fff" strokeWidth="2" />
    {/* Raio atrás do número */}
    <path
      d="M40 4 L27 30 L36 30 L24 60"
      fill="none"
      stroke="#FCD34D"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
    {/* 95 grande e centralizado */}
    <text
      x="32" y="44"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, sans-serif"
      fontSize="30" fontWeight="900"
      fill="white"
      stroke="#000"
      strokeWidth="1.5"
    >95</text>
    {/* Raio pequeno na frente, canto superior direito */}
    <path
      d="M48 8 L43 18 L47 18 L42 28"
      fill="#FCD34D"
      stroke="#F59E0B"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="g95v2" x1="0" y1="0" x2="64" y2="64">
        <stop offset="0%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
  </svg>
);

export const Garage95Logo = ({ size = 'md', variant = 2, showText = true, className = '' }: Garage95LogoProps) => {
  const s = sizeMap[size];
  const Icon = variant === 1 ? LogoV1 : LogoV2;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon w={s.icon} />
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
