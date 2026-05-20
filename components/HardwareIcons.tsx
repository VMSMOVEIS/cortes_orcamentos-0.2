
import React from 'react';

export const ScrewDrawing = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 30" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Head */}
    <path d="M5 5 L15 5 L18 10 L18 20 L15 25 L5 25 Z" fill="#e2e8f0" />
    <line x1="8" y1="10" x2="8" y2="20" />
    {/* Body */}
    <path d="M18 12 L95 12 L95 18 L18 18" />
    {/* Threads (diagonal lines) */}
    <path d="M20 12 L25 18 M30 12 L35 18 M40 12 L45 18 M50 12 L55 18 M60 12 L65 18 M70 12 L75 18 M80 12 L85 18" strokeWidth="1.5" />
    {/* Point */}
    <path d="M95 12 L100 15 L95 18" fill="none" />
  </svg>
);

export const DowelDrawing = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    {/* Main Cylinder */}
    <rect x="5" y="10" width="90" height="20" rx="2" fill="#fef3c7" />
    {/* Flutes (Grooves) */}
    <line x1="15" y1="10" x2="15" y2="30" strokeOpacity="0.5" />
    <line x1="25" y1="10" x2="25" y2="30" strokeOpacity="0.5" />
    <line x1="35" y1="10" x2="35" y2="30" strokeOpacity="0.5" />
    <line x1="45" y1="10" x2="45" y2="30" strokeOpacity="0.5" />
    <line x1="55" y1="10" x2="55" y2="30" strokeOpacity="0.5" />
    <line x1="65" y1="10" x2="65" y2="30" strokeOpacity="0.5" />
    <line x1="75" y1="10" x2="75" y2="30" strokeOpacity="0.5" />
    <line x1="85" y1="10" x2="85" y2="30" strokeOpacity="0.5" />
    {/* Wood grain texture hint */}
    <path d="M10 20 Q 50 25 90 20" strokeOpacity="0.2" />
  </svg>
);

export const HingeDrawing = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 60" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    {/* Cup (Caneco) */}
    <circle cx="20" cy="30" r="15" fill="#e2e8f0" />
    <circle cx="20" cy="30" r="10" strokeOpacity="0.5" />
    
    {/* Arm */}
    <path d="M35 20 L90 20 L95 25 L95 35 L90 40 L35 40 Z" fill="#cbd5e1" />
    
    {/* Adjustment Screws */}
    <circle cx="55" cy="30" r="3" fill="white" />
    <circle cx="75" cy="30" r="3" fill="white" />
    
    {/* Mounting Plate hint */}
    <path d="M60 15 L85 15 L85 45 L60 45" strokeDasharray="2 2" strokeOpacity="0.5" />
  </svg>
);

export const MinifixDrawing = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    {/* Cam Drum */}
    <circle cx="30" cy="30" r="25" fill="#e2e8f0" />
    
    {/* Philips Cross */}
    <path d="M30 15 L30 45" strokeWidth="3" />
    <path d="M15 30 L45 30" strokeWidth="3" />
    
    {/* Arrow Indicator */}
    <path d="M30 10 L35 18 L25 18 Z" fill="currentColor" />
    
    {/* Internal detail */}
    <circle cx="30" cy="30" r="10" strokeOpacity="0.3" />
  </svg>
);

export const NailDrawing = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 20" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 2 L5 18 L10 10 Z" fill="black" /> {/* Head */}
      <line x1="10" y1="10" x2="95" y2="10" />
      <path d="M95 10 L100 10" />
  </svg>
);
