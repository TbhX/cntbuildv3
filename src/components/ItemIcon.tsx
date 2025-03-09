import React from 'react';
import type { Item } from '../types';
import { useTranslation } from 'react-i18next';

interface ItemIconProps {
  item: Item;
  size?: number;
  showTooltip?: boolean;
  index?: number;
}

export function ItemIcon({ item, size = 64, showTooltip = true, index }: ItemIconProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Get DDragon version from environment
  const ddragonVersion = import.meta.env.VITE_DDRAGON_VERSION || '15.5.1';

  // Construct image URLs
  const ddragonUrl = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/item/${item.id}.png`;
  const communityDragonUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/${item.id}.png`;
  const fallbackUrl = '/assets/items/default-item.png';

  return (
    <div 
      className="relative group"
      onMouseEnter={() => showTooltip && setShowDetails(true)}
      onMouseLeave={() => showTooltip && setShowDetails(false)}
    >
      <div className="relative bg-[#1E2328] rounded-lg border border-[#785A28] p-2 transition-all hover:border-[#C8AA6E] hover:shadow-lg">
        {index !== undefined && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#0AC8B9] rounded-full flex items-center justify-center text-[#091428] text-sm font-bold z-10 shadow-glow">
            {index + 1}
          </div>
        )}
        {item.mythic && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full z-10 shadow-glow" />
        )}
        <div className="relative w-full aspect-square">
          <img
            src={imageError ? communityDragonUrl : ddragonUrl}
            alt={item.name}
            style={{ width: size, height: size }}
            className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105"
            onError={(e) => {
              if (!imageError) {
                setImageError(true);
                e.currentTarget.src = communityDragonUrl;
              } else {
                e.currentTarget.src = fallbackUrl;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091428]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
        </div>
        <p className="text-center mt-2 text-sm text-[#F0E6D2] font-semibold truncate">{item.name}</p>
      </div>
      
      {showTooltip && showDetails && (
        <div className="absolute z-20 w-64 bg-[#091428]/95 border border-[#785A28] rounded-lg p-3 shadow-lg -top-2 left-full ml-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 flex-shrink-0">
              <img
                src={imageError ? communityDragonUrl : ddragonUrl}
                alt={item.name}
                className="w-full h-full object-contain rounded"
                onError={(e) => {
                  if (!imageError) {
                    setImageError(true);
                    e.currentTarget.src = communityDragonUrl;
                  } else {
                    e.currentTarget.src = fallbackUrl;
                  }
                }}
              />
            </div>
            <h4 className="text-[#C8AA6E] font-semibold flex items-center gap-2">
              {item.name}
              {item.mythic && (
                <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#091428] rounded-full font-bold">
                  {t('items.mythic')}
                </span>
              )}
            </h4>
          </div>
          
          <div 
            className="text-[#F0E6D2] text-sm prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
          
          {item.gold && (
            <div className="mt-2 text-[#C8AA6E] text-sm flex items-center gap-2">
              <span>{t('items.cost')}:</span>
              <span className="flex items-center gap-1">
                <img 
                  src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-game-data/global/default/assets/items/goldicon.png"
                  alt="gold"
                  className="w-4 h-4"
                />
                {item.gold}
              </span>
            </div>
          )}
          
          {item.tags && item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map(tag => (
                <span 
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-[#785A28]/30 rounded-full text-[#C8AA6E]"
                >
                  {t(`items.tags.${tag.toLowerCase()}`)}
                </span>
              ))}
            </div>
          )}
          
          {item.stats && Object.keys(item.stats).length > 0 && (
            <div className="mt-2 border-t border-[#785A28]/50 pt-2">
              <h5 className="text-[#C8AA6E] text-sm font-semibold mb-1">{t('items.stats')}:</h5>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(item.stats).map(([stat, value]) => (
                  <div key={stat} className="text-xs text-[#F0E6D2]/80">
                    {t(`items.stats.${stat.toLowerCase()}`)} {value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}