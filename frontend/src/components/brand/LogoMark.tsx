import React from 'react';

interface LogoMarkProps {
  size?: number;
  className?: string;
  withBackground?: boolean;
}

export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 32,
  className = '',
  withBackground = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {withBackground && (
        <rect
          width="32"
          height="32"
          rx="6"
          className="fill-foreground text-background"
        />
      )}

      {/* Scientific precision calibration grid lines */}
      <line
        x1="8"
        y1="16"
        x2="24"
        y2="16"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="16"
        y1="8"
        x2="16"
        y2="24"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="2 2"
      />

      {/* Optical Viewfinder / Aperture corner brackets */}
      <path
        d="M9 13V9H13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 9H23V13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 19V23H19"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 23H9V19"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center diamond aperture reticle */}
      <polygon
        points="16,10.5 21.5,16 16,21.5 10.5,16"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />

      {/* Signature Electric-Lime / Chartreuse focal laser indicator */}
      <circle
        cx="16"
        cy="16"
        r="2.5"
        className="fill-accent-lime"
      />
    </svg>
  );
};
