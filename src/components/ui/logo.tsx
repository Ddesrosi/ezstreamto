import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export function Logo({ 
  className, 
  size = 'md', 
  showText = true,
  textColor = 'text-white'
}: LogoProps) {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-20'
  };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Logo SVG */}
      <div className="relative">
        <svg 
          className={cn(sizes[size], 'w-auto relative')}
          viewBox="0 0 252 190" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="252" height="190" fill="url(#gradient)" rx="20" ry="20"/>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgb(255,223,85)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(255,165,0)', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <polygon points="88,45 88,145 188,95" fill="#0047AB" />
        </svg>
      </div>

      {/* Text Logo */}
      {showText && (
        <span className={cn(
          'font-bold tracking-wide font-sans',
          textColor,
          {
            'text-xl': size === 'sm',
            'text-2xl': size === 'md',
            'text-3xl': size === 'lg',
            'text-4xl': size === 'xl'
          }
        )}>
          Ez<span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">Stream</span>To
        </span>
      )}
    </div>
  );
}