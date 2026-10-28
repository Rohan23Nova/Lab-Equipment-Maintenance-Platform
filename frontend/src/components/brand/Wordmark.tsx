import React from 'react';
import { LogoMark } from './LogoMark';

interface WordmarkProps {
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Wordmark: React.FC<WordmarkProps> = ({
  showTagline = false,
  size = 'md',
  className = '',
}) => {
  const markSize = size === 'sm' ? 24 : size === 'lg' ? 38 : 30;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} />
      <div className="flex flex-col leading-none">
        <div className={`flex items-baseline font-sans font-bold tracking-tight ${textSize}`}>
          <span className="text-foreground">Lab</span>
          <span className="text-foreground font-black">Ledger</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-lime ml-0.5" aria-hidden="true" />
        </div>
        {showTagline && (
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground mt-0.5">
            Every instrument accounted for.
          </span>
        )}
      </div>
    </div>
  );
};
