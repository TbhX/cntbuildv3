import React from 'react';
import { Trophy, Sword, Target, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Champion, Role, PopularBuild, BuildFeedback } from '../types';
import { getPopularBuilds } from '../services/riotApi';
import { ItemIcon } from './ItemIcon';
import { RoleIcon } from './RoleIcon';

interface ChampionHoverCardProps {
  champion: Champion;
  role?: Role;
  onFeedback?: (feedback: BuildFeedback) => void;
}

export function ChampionHoverCard({ champion, role, onFeedback }: ChampionHoverCardProps) {
  const [popularBuilds, setPopularBuilds] = React.useState<PopularBuild[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedBuild, setSelectedBuild] = React.useState<PopularBuild | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [playerName, setPlayerName] = React.useState('');

  React.useEffect(() => {
    async function loadPopularBuilds() {
      try {
        setIsLoading(true);
        const builds = await getPopularBuilds(champion.id, role);
        setPopularBuilds(builds);
        if (builds.length > 0) {
          setSelectedBuild(builds[0]); // Select the most popular build by default
        }
      } catch (error) {
        console.error('Error loading popular builds:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPopularBuilds();
  }, [champion.id, role]);

  const handleFeedback = (success: boolean) => {
    if (!selectedBuild || !playerName.trim()) return;

    const feedback: BuildFeedback = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      championId: champion.id,
      role,
      items: selectedBuild.items.map(String),
      success,
      playerName: playerName.trim(),
      timestamp: Date.now()
    };

    onFeedback?.(feedback);
    setShowFeedback(false);
    setPlayerName('');
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-[#1E2328]/95 border border-[#785A28] rounded-lg min-w-[300px]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#785A28]/50 rounded w-3/4"></div>
          <div className="h-20 bg-[#785A28]/50 rounded"></div>
          <div className="h-4 bg-[#785A28]/50 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#1E2328]/95 border border-[#785A28] rounded-lg min-w-[300px] shadow-lg">
      {/* Champion header */}
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={champion.imageUrl} 
          alt={champion.name}
          className="w-12 h-12 rounded-lg border border-[#785A28]"
        />
        <div>
          <h3 className="text-[#C8AA6E] font-bold">{champion.name}</h3>
          {role && (
            <div className="flex items-center gap-1 mt-1">
              <RoleIcon role={role} size={16} />
              <span className="text-sm text-[#F0E6D2]/70 capitalize">{role}</span>
            </div>
          )}
        </div>
      </div>

      {/* Best build section */}
      {selectedBuild && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-[#C8AA6E]" />
            <h4 className="text-[#C8AA6E] font-semibold">Best Build</h4>
            <div className="ml-auto text-sm text-[#0AC8B9]">
              {selectedBuild.winRate.toFixed(1)}% WR
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {selectedBuild.items.map((itemId, index) => (
              <div key={`${itemId}-${index}`} className="relative">
                <ItemIcon 
                  item={{ 
                    id: String(itemId),
                    name: `Item ${itemId}`,
                    imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${itemId}.png`
                  }} 
                  size={40}
                  showTooltip={true}
                />
                {index < selectedBuild.items.length - 1 && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-[#0AC8B9]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 text-sm text-[#F0E6D2]/70">
            Based on {selectedBuild.count} matches
          </div>
        </div>
      )}

      {/* Build feedback section */}
      {selectedBuild && !showFeedback && (
        <button
          onClick={() => setShowFeedback(true)}
          className="w-full mt-2 px-4 py-2 bg-[#0AC8B9]/20 hover:bg-[#0AC8B9]/30 border border-[#0AC8B9]/50 rounded-lg text-[#0AC8B9] text-sm transition-colors"
        >
          Did you use this build?
        </button>
      )}

      {showFeedback && (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Your summoner name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1E2328] border border-[#785A28] rounded-lg text-[#F0E6D2] text-sm focus:border-[#C8AA6E] focus:outline-none"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => handleFeedback(true)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#0AC8B9]/20 hover:bg-[#0AC8B9]/30 border border-[#0AC8B9]/50 rounded-lg text-[#0AC8B9] text-sm"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Won</span>
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#FF4655]/20 hover:bg-[#FF4655]/30 border border-[#FF4655]/50 rounded-lg text-[#FF4655] text-sm"
            >
              <ThumbsDown className="h-4 w-4" />
              <span>Lost</span>
            </button>
          </div>
        </div>
      )}

      {/* Alternative builds */}
      {popularBuilds.length > 1 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Sword className="h-4 w-4 text-[#C8AA6E]" />
            <h4 className="text-[#C8AA6E] font-semibold">Alternative Builds</h4>
          </div>

          <div className="space-y-2">
            {popularBuilds.slice(1, 3).map((build, index) => (
              <button
                key={index}
                onClick={() => setSelectedBuild(build)}
                className="w-full p-2 bg-[#1E2328] hover:bg-[#785A28]/20 border border-[#785A28] rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#F0E6D2]">Build {index + 2}</span>
                  <span className="text-sm text-[#0AC8B9]">{build.winRate.toFixed(1)}% WR</span>
                </div>
                <div className="flex gap-1">
                  {build.items.slice(0, 3).map((itemId) => (
                    <ItemIcon 
                      key={itemId}
                      item={{ 
                        id: String(itemId),
                        name: `Item ${itemId}`,
                        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${itemId}.png`
                      }} 
                      size={24}
                      showTooltip={false}
                    />
                  ))}
                  {build.items.length > 3 && (
                    <div className="flex items-center justify-center w-6 h-6 bg-[#785A28]/30 rounded">
                      <span className="text-xs text-[#F0E6D2]/70">+{build.items.length - 3}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}