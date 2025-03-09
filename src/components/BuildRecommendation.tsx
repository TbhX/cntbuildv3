import React from 'react';
import type { BuildRecommendation as BuildRecommendationType } from '../types';
import { RoleIcon } from './RoleIcon';
import { ItemIcon } from './ItemIcon';
import { ImageWithFallback } from './ImageWithFallback';
import { Sword, Shield, Sparkles, Award, Copy, Check, Info, Clock, ArrowRight, Target, Crosshair, Zap, Flame, Waypoints, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BuildRecommendationProps {
  recommendation: BuildRecommendationType | null;
  isLoading: boolean;
}

export function BuildRecommendation({ recommendation, isLoading }: BuildRecommendationProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'items' | 'runes' | 'strategy'>('items');

  const copyBuildToClipboard = () => {
    if (!recommendation) return;
    
    const buildText = `
Build pour ${recommendation.forChampion?.name} (${recommendation.forRole})

OBJETS (Ordre de construction):
${recommendation.items.map((item, index) => `${index + 1}. ${item.name}: ${item.description}`).join('\n')}

RUNES:
${recommendation.runes.map(rune => `${rune.name}: ${rune.description}`).join('\n')}

STRATÉGIE:
${recommendation.explanation}
    `.trim();
    
    navigator.clipboard.writeText(buildText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="panel animated-bg flex flex-col items-center justify-center p-12">
        <div className="loading-spinner mb-4"></div>
        <p className="text-[#0AC8B9] font-semibold animate-pulse">{t('common.analyzing')}</p>
        <p className="text-[#F0E6D2]/60 text-sm mt-2">{t('common.generatingBuild')}</p>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  const tabs = [
    { id: 'items', label: t('build.items'), icon: <Sword className="h-4 w-4" /> },
    { id: 'runes', label: t('build.runes'), icon: <Shield className="h-4 w-4" /> },
    { id: 'strategy', label: t('build.strategy'), icon: <Sparkles className="h-4 w-4" /> }
  ] as const;

  // Split strategy text into sections
  const strategyParts = recommendation.explanation.split('\n\n').reduce((acc, part) => {
    if (part.startsWith('📊 Team Analysis:')) acc.teamAnalysis = part;
    else if (part.startsWith('🌅 Early Game:')) acc.earlyGame = part;
    else if (part.startsWith('🌤️ Mid Game:')) acc.midGame = part;
    else if (part.startsWith('🌕 Late Game:')) acc.lateGame = part;
    else if (part.startsWith('⚔️ Build Path:')) acc.buildPath = part;
    return acc;
  }, {} as Record<string, string>);

  // Group items by game phase
  const buildPhases = recommendation.build_order ? {
    starting: recommendation.build_order.starting_phase?.items || [],
    early: recommendation.build_order.early_phase?.core_progression || [],
    mid: recommendation.build_order.mid_phase?.core_items || [],
    late: recommendation.build_order.late_phase?.final_build || []
  } : null;

  return (
    <div className="panel panel-accent animated-bg space-y-6">
      {/* Champion header */}
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {recommendation.forChampion && (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0AC8B9]/30 to-transparent rounded-lg animate-pulse"></div>
                <ImageWithFallback 
                  src={recommendation.forChampion.imageUrl}
                  fallbackSrc={recommendation.forChampion.localImageUrl || '/assets/default-champion.png'}
                  alt={recommendation.forChampion.name}
                  className="w-20 h-20 rounded-lg border-2 border-[#0AC8B9] relative z-10"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#F0E6D2] glow-blue">{recommendation.forChampion.name}</h2>
                {recommendation.forRole && (
                  <div className="flex items-center mt-2 bg-[#0AC8B9]/20 px-3 py-1 rounded-full inline-block border border-[#0AC8B9]/30">
                    <RoleIcon role={recommendation.forRole} size={20} className="role-icon" />
                    <span className="ml-2 text-[#0AC8B9] font-semibold capitalize">{recommendation.forRole}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={copyBuildToClipboard}
            className="flex items-center gap-1 bg-[#1E2328]/80 px-3 py-1 rounded-lg border border-[#785A28] hover:border-[#C8AA6E] transition-colors"
            title={t('common.copyBuild')}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-[#0AC8B9]" />
                <span className="text-sm text-[#0AC8B9]">{t('common.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-[#C8AA6E]" />
                <span className="text-sm text-[#C8AA6E] hidden md:inline">{t('common.copyBuild')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-[#785A28]/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 ${
              activeTab === tab.id 
                ? 'text-[#0AC8B9] border-b-2 border-[#0AC8B9]' 
                : 'text-[#F0E6D2]/70 hover:text-[#F0E6D2]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      <div className="mt-4">
        {activeTab === 'items' && (
          <div className="space-y-8">
            {/* Build phases */}
            {buildPhases ? (
              <>
                {/* Starting items */}
                {buildPhases.starting.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#C8AA6E]" />
                      <h3 className="text-xl font-bold text-[#C8AA6E]">Objets de départ (0-5 min)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {buildPhases.starting.map((item, index) => (
                        <div key={`start-${item.id}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                          <div className="flex items-center gap-4">
                            <ItemIcon item={item} showTooltip={true} size={48} />
                            <div>
                              <h4 className="text-[#F0E6D2] font-semibold">{item.name}</h4>
                              <p className="text-[#F0E6D2]/70 text-sm mt-1">{item.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Early game items */}
                {buildPhases.early.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-[#FF4655]" />
                      <h3 className="text-xl font-bold text-[#FF4655]">Phase de lane (5-15 min)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {buildPhases.early.map((item, index) => (
                        <div key={`early-${item.id}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                          <div className="flex items-center gap-4">
                            <ItemIcon item={item} showTooltip={true} size={48} />
                            <div>
                              <h4 className="text-[#F0E6D2] font-semibold">{item.name}</h4>
                              <p className="text-[#F0E6D2]/70 text-sm mt-1">{item.reason}</p>
                              {item.timing && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-[#0AC8B9]">
                                  <Clock className="h-3 w-3" />
                                  <span>{item.timing}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mid game items */}
                {buildPhases.mid.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Crosshair className="h-5 w-5 text-[#0AC8B9]" />
                      <h3 className="text-xl font-bold text-[#0AC8B9]">Phase de groupe (15-25 min)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {buildPhases.mid.map((item, index) => (
                        <div key={`mid-${item.id}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                          <div className="flex items-center gap-4">
                            <ItemIcon item={item} showTooltip={true} size={48} />
                            <div>
                              <h4 className="text-[#F0E6D2] font-semibold">{item.name}</h4>
                              <p className="text-[#F0E6D2]/70 text-sm mt-1">{item.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Late game items */}
                {buildPhases.late.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[#C8AA6E]" />
                      <h3 className="text-xl font-bold text-[#C8AA6E]">Phase finale (25+ min)</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {buildPhases.late.map((item, index) => (
                        <div key={`late-${item.id}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                          <div className="flex items-center gap-4">
                            <ItemIcon item={item} showTooltip={true} size={48} />
                            <div>
                              <h4 className="text-[#F0E6D2] font-semibold">{item.name}</h4>
                              <p className="text-[#F0E6D2]/70 text-sm mt-1">{item.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Fallback to simple item list if no build phases
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-[#C8AA6E]" />
                  <h3 className="section-title">Ordre de construction</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {recommendation.items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="relative">
                      <div className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30 hover:border-[#C8AA6E]/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            <ItemIcon 
                              item={item} 
                              index={index} 
                              showTooltip={true}
                              size={64}
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-[#C8AA6E] font-semibold text-lg">{item.name}</h4>
                            <p className="text-[#F0E6D2]/80 mt-2">{item.description}</p>
                            {item.gold && (
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#785A28]/30">
                                <img 
                                  src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-game-data/global/default/assets/items/goldicon.png"
                                  alt="gold"
                                  className="w-5 h-5"
                                />
                                <span className="text-[#C8AA6E] font-semibold">{item.gold}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < recommendation.items.length - 1 && (
                        <div className="absolute left-8 -bottom-4 transform translate-x-1/2 z-10">
                          <div className="bg-[#0AC8B9] rounded-full p-1">
                            <ArrowRight className="h-5 w-5 text-[#091428]" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'runes' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="section-title">Runes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendation.runes.map((rune) => (
                  <div key={`${rune.id}-${rune.name}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30 hover:border-[#C8AA6E]/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-[#091428]/50 rounded-lg p-2">
                        <img 
                          src={rune.imageUrl} 
                          alt={rune.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="text-[#C8AA6E] font-semibold text-lg">{rune.name}</h4>
                        <p className="text-[#F0E6D2]/80 mt-2">{rune.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-8">
            {/* Team Analysis */}
            {strategyParts.teamAnalysis && (
              <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-[#C8AA6E]" />
                  <h3 className="text-xl font-bold text-[#C8AA6E]">Analyse d'équipe</h3>
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                    {strategyParts.teamAnalysis.replace('📊 Team Analysis:', '')}
                  </div>
                </div>
              </div>
            )}

            {/* Game Phases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Early Game */}
              {strategyParts.earlyGame && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-5 w-5 text-[#FF4655]" />
                    <h3 className="text-xl font-bold text-[#FF4655]">Début de partie</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                      {strategyParts.earlyGame.replace('🌅 Early Game:', '')}
                    </div>
                  </div>
                </div>
              )}

              {/* Mid Game */}
              {strategyParts.midGame && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Crosshair className="h-5 w-5 text-[#0AC8B9]" />
                    <h3 className="text-xl font-bold text-[#0AC8B9]">Milieu de partie</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                      {strategyParts.midGame.replace('🌤️ Mid Game:', '')}
                    </div>
                  </div>
                </div>
              )}

              {/* Late Game */}
              {strategyParts.lateGame && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-[#C8AA6E]" />
                    <h3 className="text-xl font-bold text-[#C8AA6E]">Fin de partie</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                      {strategyParts.lateGame.replace('🌕 Late Game:', '')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Build Path */}
            {strategyParts.buildPath && (
              <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                <div className="flex items-center gap-2 mb-4">
                  <Waypoints className="h-5 w-5 text-[#0AC8B9]" />
                  <h3 className="text-xl font-bold text-[#0AC8B9]">Progression du build</h3>
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                    {strategyParts.buildPath.replace('⚔️ Build Path:', '')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}