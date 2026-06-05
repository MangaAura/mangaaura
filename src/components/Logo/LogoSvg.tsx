export function LogoSvg({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/MangaAura_logo_circular.svg"
      alt="MangaAura"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
