import React from 'react';
import { Trophy, Sparkles, ArrowRight, Scale, ThumbsUp } from 'lucide-react';
import type { BuildRecommendation, PopularBuild } from '../types';
import { ItemIcon } from './ItemIcon';
import { RoleIcon } from './RoleIcon';
import { getPopularBuilds } from '../services/riotApi';

interface BuildComparisonProps {
  recommendation: BuildRecommendation;
  onSelectBuild: (items: string[]) => void;
}

export function BuildComparison({ recommendation, onSelectBuild }: BuildComparisonProps) {
  const [popularBuild, setPopularBuild] = React.useState<PopularBuild | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedBuild, setSelectedBuild] = React.useState<'ai' | 'popular'>('ai');

  React.useEffect(() => {
    async function loadPopularBuild() {
      if (!recommendation.forChampion) return;
      
      try {
        setIsLoading(true);
        const builds = await getPopularBuilds(recommendation.forChampion.id, recommendation.forRole);
        if (builds.length > 0) {
          setPopularBuild(builds[0]); // Get the most popular build
        }
      } catch (error) {
        console.error('Error loading popular build:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPopularBuild();
  }, [recommendation]);

  const handleBuildSelect = (type: 'ai' | 'popular') => {
    setSelectedBuild(type);
    if (type === 'ai') {
      onSelectBuild(recommendation.items.map(item => item.id));
    } else if (popularBuild) {
      onSelectBuild(popularBuild.items.map(String));
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-[#785A28]/50 rounded w-3/4"></div>
        <div className="h-20 bg-[#785A28]/50 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#C8AA6E]">Build Comparison</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBuildSelect('ai')}
            className={`px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
              selectedBuild === 'ai'
                ? 'bg-[#0AC8B9] text-[#091428]'
                : 'bg-[#1E2328] text-[#0AC8B9] hover:bg-[#0AC8B9]/20'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Build</span>
          </button>
          <button
            onClick={() => handleBuildSelect('popular')}
            className={`px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
              selectedBuild === 'popular'
                ? 'bg-[#C8AA6E] text-[#091428]'
                : 'bg-[#1E2328] text-[#C8AA6E] hover:bg-[#C8AA6E]/20'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Popular Build</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommended Build */}
        <div className={`p-4 rounded-lg border ${
          selectedBuild === 'ai' 
            ? 'bg-[#0AC8B9]/10 border-[#0AC8B9]' 
            : 'bg-[#1E2328] border-[#785A28]'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#0AC8B9]" />
            <h4 className="text-lg font-semibold text-[#0AC8B9]">AI Recommendation</h4>
          </div>

          <div className="grid grid-cols-6 gap-2 mb-4">
            {recommendation.items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="relative">
                <ItemIcon 
                  item={item}
                  showTooltip={true}
                />
                {index < recommendation.items.length - 1 && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-[#0AC8B9]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-sm text-[#F0E6D2]/70">
            Optimized for your team composition and enemy matchups
          </div>
        </div>

        {/* Popular Build */}
        {popularBuild && (
          <div className={`p-4 rounded-lg border ${
            selectedBuild === 'popular' 
              ? 'bg-[#C8AA6E]/10 border-[#C8AA6E]' 
              : 'bg-[#1E2328] border-[#785A28]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#C8AA6E]" />
                <h4 className="text-lg font-semibold text-[#C8AA6E]">Most Popular Build</h4>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ThumbsUp className="h-4 w-4 text-[#0AC8B9]" />
                <span className="text-[#0AC8B9] font-semibold">{popularBuild.winRate.toFixed(1)}% WR</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-4">
              {popularBuild.items.map((itemId, index) => (
                <div key={`${itemId}-${index}`} className="relative">
                  <ItemIcon 
                    item={{
                      id: String(itemId),
                      name: `Item ${itemId}`,
                      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${itemId}.png`
                    }}
                    showTooltip={true}
                  />
                  {index < popularBuild.items.length - 1 && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-[#C8AA6E]">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-sm text-[#F0E6D2]/70">
              Based on {popularBuild.count} matches in high elo
            </div>
          </div>
        )}
      </div>

      {/* Build Comparison Stats */}
      {popularBuild && (
        <div className="mt-6 p-4 bg-[#1E2328] border border-[#785A28] rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-[#C8AA6E]" />
            <h4 className="text-lg font-semibold text-[#C8AA6E]">Build Analysis</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#0AC8B9]/10 rounded-lg">
              <h5 className="text-[#0AC8B9] font-semibold mb-2">AI Build Strengths</h5>
              <ul className="space-y-2 text-sm text-[#F0E6D2]/80">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0AC8B9]"></div>
                  <span>Optimized for current team composition</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0AC8B9]"></div>
                  <span>Counters enemy champion picks</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0AC8B9]"></div>
                  <span>Adapts to game context</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-[#C8AA6E]/10 rounded-lg">
              <h5 className="text-[#C8AA6E] font-semibold mb-2">Popular Build Strengths</h5>
              <ul className="space-y-2 text-sm text-[#F0E6D2]/80">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8AA6E]"></div>
                  <span>Proven {popularBuild.winRate.toFixed(1)}% win rate</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8AA6E]"></div>
                  <span>Used in {popularBuild.count} high elo matches</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8AA6E]"></div>
                  <span>Consistent performance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}