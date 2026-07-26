'use client';

import React, { useState } from 'react';
import { getPillColor, getPillSvgDataUrl } from '@/lib/pill-color';
import { Pill } from 'lucide-react';

interface MedicineAvatarProps {
  name: string;
  type?: string;
  image?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showColorBadge?: boolean;
}

export function MedicineAvatar({
  name,
  type = 'Tablet',
  image,
  className = '',
  size = 'md',
  showColorBadge = false,
}: MedicineAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const color = getPillColor(name);
  const svgDataUrl = getPillSvgDataUrl(name, type);

  const dimensionClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  }[size];

  // If image provided and no load error, render image with fallback onError handler
  if (image && !imageError) {
    return (
      <div className="relative inline-block">
        <img
          src={image}
          alt={name}
          onError={() => setImageError(true)}
          className={`${dimensionClasses} rounded-xl object-cover border border-slate-200 shadow-2xs ${className}`}
        />
        {showColorBadge && (
          <span
            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
            style={{ backgroundColor: color.bgHex }}
            title={`Color Code: ${color.name}`}
          />
        )}
      </div>
    );
  }

  // Fallback to Color-Coded Pill Badge
  return (
    <div className="relative inline-block">
      <div
        className={`${dimensionClasses} rounded-xl flex items-center justify-center font-bold shadow-2xs border ${color.badgeBg} ${color.badgeText} ${color.badgeBorder} ${className}`}
      >
        <img src={svgDataUrl} alt={name} className="w-full h-full rounded-xl object-cover" />
      </div>
      {showColorBadge && (
        <span
          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
          style={{ backgroundColor: color.bgHex }}
          title={`Color Code: ${color.name}`}
        />
      )}
    </div>
  );
}

export default MedicineAvatar;
