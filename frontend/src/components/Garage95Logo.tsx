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

// Variante 2: Garagem + carro + 95
const LogoV2 = ({ w }: { w: number }) => (
  <svg width={w} height={w} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#g95v2)" stroke="#fff" strokeWidth="2" />

    {/* Teto da garagem */}
    <path d="M10 26 L32 10 L54 26" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

    {/* Paredes da garagem */}
    <line x1="12" y1="26" x2="12" y2="48" stroke="#fff" strokeWidth="2" />
    <line x1="52" y1="26" x2="52" y2="48" stroke="#fff" strokeWidth="2" />

    {/* Chão da garagem */}
    <line x1="10" y1="48" x2="54" y2="48" stroke="#fff" strokeWidth="2" strokeLinecap="round" />

    {/* Porta da garagem (linhas horizontais) */}
    <line x1="16" y1="32" x2="48" y2="32" stroke="#fff" strokeWidth="0.6" opacity="0.3" />
    <line x1="16" y1="36" x2="48" y2="36" stroke="#fff" strokeWidth="0.6" opacity="0.3" />

    {/* Carro silhueta dentro da garagem */}
    <path
      d="M20 44 L22 39 L28 37 L36 37 L42 39 L44 44"
      fill="#1a1a2e"
      stroke="#FCD34D"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Teto do carro */}
    <path
      d="M25 39 L28 35 L36 35 L39 39"
      fill="#222"
      stroke="#FCD34D"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    {/* Rodas */}
    <circle cx="24" cy="44.5" r="2" fill="#333" stroke="#FCD34D" strokeWidth="0.8" />
    <circle cx="40" cy="44.5" r="2" fill="#333" stroke="#FCD34D" strokeWidth="0.8" />
    {/* Farol */}
    <circle cx="43" cy="41" r="1" fill="#FCD34D" opacity="0.9" />

    {/* 95 bold no teto da garagem */}
    <text
      x="32" y="28"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, sans-serif"
      fontSize="14" fontWeight="900"
      fill="#FCD34D"
      stroke="#000"
      strokeWidth="0.5"
    >95</text>

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
