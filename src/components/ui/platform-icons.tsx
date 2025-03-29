import { memo } from 'react';

export const NetflixIcon = memo(() => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600" fill="currentColor">
    <text x="3" y="20" fontSize="20" fontWeight="bold">N</text>
  </svg>
));

export const PrimeIcon = memo(() => (
  <svg viewBox="0 0 200 40" className="w-5 h-5" fill="none">
    <text x="0" y="24" fontSize="20" fill="#00A8E1" fontFamily="Arial, sans-serif">prime</text>
    <path d="M0 30 C50 50, 150 50, 200 30" stroke="#00A8E1" strokeWidth="3" fill="none" />
  </svg>
));

export const DisneyIcon = memo(() => (
  <svg viewBox="0 0 100 40" className="w-5 h-5" fill="none">
    <text x="0" y="25" fontSize="20" fill="#1E90FF" fontFamily="Arial, sans-serif">Disney+</text>
    <path d="M0 10 C30 -10, 70 -10, 100 10" stroke="#1E90FF" strokeWidth="2" fill="none" />
  </svg>
));

export const HBOIcon = memo(() => (
  <svg viewBox="0 0 100 40" className="w-5 h-5" fill="none">
    <text x="0" y="25" fontSize="20" fill="#fff" fontFamily="Arial, sans-serif">HBO</text>
    <path d="M0 30 C30 40, 70 40, 100 30" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
));

export const AppleIcon = memo(() => (
  <svg viewBox="0 0 100 40" className="w-5 h-5" fill="none">
    <text x="0" y="25" fontSize="20" fill="#fff" fontFamily="Arial, sans-serif">tv+</text>
    <path d="M0 10 C30 0, 70 0, 100 10" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
));

export const HuluIcon = memo(() => (
  <svg viewBox="0 0 100 40" className="w-5 h-5" fill="none">
    <text x="0" y="25" fontSize="20" fill="#1CE783" fontFamily="Arial, sans-serif">hulu</text>
    <path d="M0 30 C30 40, 70 40, 100 30" stroke="#1CE783" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
));

export const ParamountIcon = memo(() => (
  <svg viewBox="0 0 100 40" className="w-5 h-5" fill="none">
    <text x="0" y="25" fontSize="20" fill="#fff" fontFamily="Arial, sans-serif">Para+</text>
    <path d="M0 10 C30 0, 70 0, 100 10" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
));

export const PeacockIcon = memo(() => (
  <svg viewBox="0 0 100 40" className="w-5 h-5" fill="none">
    <text x="0" y="25" fontSize="20" fill="#0096A5" fontFamily="Arial, sans-serif">peacock</text>
    <path d="M0 30 C30 40, 70 40, 100 30" stroke="#0096A5" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
));

export const platformIcons = {
  Netflix: NetflixIcon,
  'Amazon Prime': PrimeIcon,
  'Disney+': DisneyIcon,
  'HBO Max': HBOIcon,
  'Apple TV+': AppleIcon,
  'Hulu': HuluIcon,
  'Paramount+': ParamountIcon,
  'Peacock': PeacockIcon
} as const;