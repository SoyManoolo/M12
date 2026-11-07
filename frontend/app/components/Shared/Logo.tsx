/**
 * Logo de FriendsGo: símbolo de dos anillos enlazados y, opcionalmente,
 * el texto "friendsgo" con "go" en el color de acento del tema.
 */

interface LogoProps {
  /** "mark" muestra solo el símbolo; "full" añade el texto. */
  variant?: 'mark' | 'full';
  /** Disposición del texto respecto al símbolo en la variante "full". */
  layout?: 'horizontal' | 'stacked';
  /** Clases de tamaño del símbolo (por ejemplo "h-10 w-10"). */
  markClassName?: string;
  /** Clases del texto (tamaño de fuente). */
  textClassName?: string;
  className?: string;
}

export default function Logo({
  variant = 'full',
  layout = 'horizontal',
  markClassName = 'h-10 w-10',
  textClassName = 'text-2xl',
  className = '',
}: LogoProps) {
  const mark = (
    <img
      src="/images/friendsgo-mark.svg"
      alt={variant === 'mark' ? 'FriendsGo' : ''}
      className={`shrink-0 ${markClassName}`}
    />
  );

  if (variant === 'mark') {
    return <span className={`inline-flex ${className}`}>{mark}</span>;
  }

  const direction = layout === 'stacked' ? 'flex-col gap-2' : 'flex-row gap-2.5';

  return (
    <span className={`inline-flex items-center ${direction} ${className}`} aria-label="FriendsGo">
      {mark}
      <span className={`font-semibold leading-none tracking-tight text-ink ${textClassName}`} aria-hidden="true">
        friends<span className="brand-word">go</span>
      </span>
    </span>
  );
}
