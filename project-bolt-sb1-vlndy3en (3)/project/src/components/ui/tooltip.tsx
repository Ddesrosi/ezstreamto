import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex items-center gap-2">
      {children}
      <div
        ref={triggerRef}
        className={cn(
          "cursor-help relative min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center",
          className
        )}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)} // Toggle on mobile touch
      >
        <Info className="h-4 w-4 sm:h-5 sm:w-5 opacity-50 hover:opacity-100 transition-opacity" />
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-[100]"
          style={{
            left: '50%',
            bottom: '100%',
            transform: 'translate(-50%, -8px)'
          }}
        >
          <div
            className={cn(
              "relative w-64 p-3 sm:p-4 text-xs sm:text-sm rounded-lg shadow-lg",
              "bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
              "animate-in fade-in-0 zoom-in-95"
            )}
          >
            {content}
            <div 
              className="absolute w-2 h-2 bg-blue-50 dark:bg-blue-900 rotate-45"
              style={{
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}