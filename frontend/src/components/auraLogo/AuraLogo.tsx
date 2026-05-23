import React from 'react';
import type { AuraLogoProps } from '@/components/auraLogo/types/auraLogo.types';

const VIEW_BOX = '0 0 87 85';

const AuraLogo: React.FC<AuraLogoProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox={VIEW_BOX}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M45.8711 85H87L59.2002 0H27.7998L0 85H42.1289C40.8625 67.7373 39.04 49.2894 36.9287 47.1699C32.8594 43.0858 24 40.0723 24 40.0723C24.0406 40.0584 32.8688 37.0503 36.9287 32.9756C40.998 28.8915 44 20 44 20C44 20 47.002 28.8915 51.0713 32.9756C55.1312 37.0503 63.9594 40.0584 64 40.0723C64 40.0723 55.1406 43.0858 51.0713 47.1699C48.96 49.2893 47.1375 67.7373 45.8711 85Z"
      fill="currentColor"
    />
  </svg>
);

export default AuraLogo;
