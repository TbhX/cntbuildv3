import React from 'react';
import type { BuildRecommendation as BuildRecommendationType } from '../types';
import { RoleIcon } from './RoleIcon';
import { ItemIcon } from './ItemIcon';
import { ImageWithFallback } from './ImageWithFallback';
import { Sword, Shield, Sparkles, Copy, Check, Clock, ArrowRight, Target, Crosshair, Zap, Flame } from 'lucide-react';
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
        <p className="text-[#F0E6D2]/60 text-sm mt-2 text-center max-w-md">
          {t('common.generatingBuild')}
        </p>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  const tabs = [
    { id: 'items' as const, label: t('build.items'), icon: <Sword className="h-4 w-4" /> },
    { id: 'runes' as const, label: t('build.runes'), icon: <Shield className="h-4 w-4" /> },
    { id: 'strategy' as const, label: t('build.strategy'), icon: <Sparkles className="h-4 w-4" /> }
  ];

  // Helper function to safely check array length
  const hasItems = (arr?: any[]): arr is any[] => Array.isArray(arr) && arr.length > 0;

  // Helper function to safely render lists
  const renderList = (items?: any[], renderItem?: (item: any, index: number) => React.ReactNode) => {
    if (!hasItems(items) || !renderItem) return null;
    return items.map(renderItem);
  };

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
                    <span className="ml-2 text-[#0AC8B9] font-semibold capitalize">{recommendation.forRole} Lane</span>
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
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="section-title">{t('build.buildOrder')}</h3>
              </div>
              <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gold scrollbar-track-dark">
                {recommendation.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex-shrink-0">
                    <div className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30 hover:border-[#C8AA6E]/30 transition-colors w-[200px]">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <ItemIcon item={item} index={index} showTooltip={true} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-[#C8AA6E] font-semibold truncate">{item.name}</h4>
                          <p className="text-[#F0E6D2]/80 text-sm mt-1 line-clamp-2">{item.description}</p>
                          {item.gold && (
                            <div className="flex items-center gap-2 mt-2">
                              <img 
                                src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-game-data/global/default/assets/items/goldicon.png"
                                alt="gold"
                                className="w-4 h-4"
                              />
                              <span className="text-[#C8AA6E]">{item.gold}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < recommendation.items.length - 1 && (
                      <div className="flex items-center justify-center mx-2">
                        <ArrowRight className="h-6 w-6 text-[#0AC8B9]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'runes' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="section-title">{t('build.runes')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderList(recommendation.runes, (rune, index) => (
                  <div key={`${rune.id}-${index}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30 hover:border-[#C8AA6E]/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-[#091428]/50 rounded-lg p-2">
                        <img 
                          src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/${rune.id}.png`}
                          alt={rune.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/runesicon.png';
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[#C8AA6E] font-semibold text-lg">{rune.name}</h4>
                          {rune.type === 'keystone' && (
                            <span className="px-2 py-0.5 bg-[#0AC8B9]/20 text-[#0AC8B9] text-xs rounded-full">
                              {t('build.runeTypes.keystone')}
                            </span>
                          )}
                        </div>
                        <p className="text-[#F0E6D2]/80 mt-2 text-sm">{rune.description}</p>
                        {rune.path && (
                          <div className="mt-2 flex items-center gap-1">
                            <img 
                              src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/${rune.path.toLowerCase()}.png`}
                              alt={rune.path}
                              className="w-4 h-4"
                            />
                            <span className="text-xs text-[#C8AA6E] capitalize">
                              {t(`build.runePaths.${rune.path.toLowerCase()}`)}
                            </span>
                          </div>
                        )}
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
            {(hasItems(recommendation.team_analysis?.ally_strengths) || 
              hasItems(recommendation.team_analysis?.enemy_threats) || 
              recommendation.team_analysis?.damage_distribution) && (
              <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-[#C8AA6E]" />
                  <h3 className="text-xl font-bold text-[#C8AA6E]">{t('build.teamAnalysis.title')}</h3>
                </div>
                <div className="space-y-4">
                  {hasItems(recommendation.team_analysis?.ally_strengths) && (
                    <div>
                      <h4 className="text-[#0AC8B9] font-semibold mb-2">{t('build.teamAnalysis.allyStrengths')}</h4>
                      <ul className="space-y-2">
                        {renderList(recommendation.team_analysis.ally_strengths, (strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-[#F0E6D2]/90">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0AC8B9] mt-2"></div>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {hasItems(recommendation.team_analysis?.enemy_threats) && (
                    <div>
                      <h4 className="text-[#FF4655] font-semibold mb-2">{t('build.teamAnalysis.enemyThreats')}</h4>
                      <ul className="space-y-2">
                        {renderList(recommendation.team_analysis.enemy_threats, (threat, index) => (
                          <li key={index} className="flex items-start gap-2 text-[#F0E6D2]/90">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4655] mt-2"></div>
                            <span>{threat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {recommendation.team_analysis?.damage_distribution && (
                    <div>
                      <h4 className="text-[#C8AA6E] font-semibold mb-2">{t('build.teamAnalysis.damageProfile')}</h4>
                      <div className="space-y-2 text-[#F0E6D2]/90">
                        {recommendation.team_analysis.damage_distribution.allied && (
                          <p>
                            <span className="text-[#0AC8B9]">Équipe alliée:</span> {recommendation.team_analysis.damage_distribution.allied}
                          </p>
                        )}
                        {recommendation.team_analysis.damage_distribution.enemy && (
                          <p>
                            <span className="text-[#FF4655]">Équipe ennemie:</span> {recommendation.team_analysis.damage_distribution.enemy}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Game Phases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Early Game */}
              {recommendation.strategy?.early_game && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-5 w-5 text-[#FF4655]" />
                    <h3 className="text-xl font-bold text-[#FF4655]">{t('build.phases.early')}</h3>
                  </div>
                  <div className="space-y-4">
                    {recommendation.strategy.early_game.approach && (
                      <p className="text-[#F0E6D2]/90">{recommendation.strategy.early_game.approach}</p>
                    )}
                    {recommendation.strategy.early_game.trading_pattern && (
                      <div>
                        <h4 className="text-[#C8AA6E] font-semibold mb-2">Pattern de trade</h4>
                        <p className="text-[#F0E6D2]/90">{recommendation.strategy.early_game.trading_pattern}</p>
                      </div>
                    )}
                    {hasItems(recommendation.strategy.early_game.power_spikes) && (
                      <div>
                        <h4 className="text-[#C8AA6E] font-semibold mb-2">Power Spikes</h4>
                        <ul className="space-y-2">
                          {renderList(recommendation.strategy.early_game.power_spikes, (spike, index) => (
                            <li key={index} className="flex items-start gap-2 text-[#F0E6D2]/90">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4655] mt-2"></div>
                              <span>{spike}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mid Game */}
              {recommendation.strategy?.mid_game && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Crosshair className="h-5 w-5 text-[#0AC8B9]" />
                    <h3 className="text-xl font-bold text-[#0AC8B9]">{t('build.phases.mid')}</h3>
                  </div>
                  <div className="space-y-4">
                    {recommendation.strategy.mid_game.approach && (
                      <p className="text-[#F0E6D2]/90">{recommendation.strategy.mid_game.approach}</p>
                    )}
                    {recommendation.strategy.mid_game.role_in_team && (
                      <div>
                        <h4 className="text-[#C8AA6E] font-semibold mb-2">Rôle en équipe</h4>
                        <p className="text-[#F0E6D2]/90">{recommendation.strategy.mid_game.role_in_team}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Late Game */}
              {recommendation.strategy?.late_game && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-[#C8AA6E]" />
                    <h3 className="text-xl font-bold text-[#C8AA6E]">{t('build.phases.late')}</h3>
                  </div>
                  <div className="space-y-4">
                    {recommendation.strategy.late_game.approach && (
                      <p className="text-[#F0E6D2]/90">{recommendation.strategy.late_game.approach}</p>
                    )}
                    {recommendation.strategy.late_game.win_condition && (
                      <div>
                        <h4 className="text-[#C8AA6E] font-semibold mb-2">Condition de victoire</h4>
                        <p className="text-[#F0E6D2]/90">{recommendation.strategy.late_game.win_condition}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}