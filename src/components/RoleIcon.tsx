import React from 'react';
import type { Role } from '../types';

interface RoleIconProps {
  role: Role;
  size?: number;
  className?: string;
}

const ROLE_ICONS = {
  top: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
  jungle: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
  mid: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
  adc: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
  support: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
  '': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png'
} as const;

export function RoleIcon({ role, size = 24, className = '' }: RoleIconProps) {
  const iconUrl = ROLE_ICONS[role] || ROLE_ICONS[''];
  
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={iconUrl}
        alt={role || 'role'}
        width={size}
        height={size}
        className="w-full h-full object-contain filter brightness-125 drop-shadow-glow"
        loading="lazy"
      />
    </div>
  );
}