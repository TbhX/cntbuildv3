import React from 'react';
import { Sword, Shield, Sparkles, Clock, ArrowRight, Target, Crosshair, Zap, Flame, Copy, Check } from 'lucide-react';
import type { BuildRecommendation as BuildRecommendationType } from '../types';
import { RoleIcon } from './RoleIcon';
import { ItemIcon } from './ItemIcon';
import { useTranslation } from 'react-i18next';

// Helpers
const hasContent = (arr?: any[]): boolean => Array.isArray(arr) && arr.length > 0;

const getRuneImage = (runeId: string): string => {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/${runeId}.png`;
};

const getRunePathImage = (path: string): string => {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/${path.toLowerCase()}.png`;
};

interface BuildRecommendationProps {
  recommendation: BuildRecommendationType | null;
  isLoading: boolean;
}

export function BuildRecommendation({ recommendation, isLoading }: BuildRecommendationProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<'items' | 'runes' | 'strategy'>('items');
  const [copied, setCopied] = React.useState(false);

  const copyBuildToClipboard = () => {
    if (!recommendation) return;

    const buildText = `
Build pour ${recommendation.forChampion?.name} (${recommendation.forRole})

OBJETS (Ordre de construction):
${recommendation.items.map((item, index) => `${index + 1}. ${item.name}`).join('\n')}

RUNES:
${recommendation.runes.map(rune => rune.name).join('\n')}

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
    { id: 'items' as const, label: t('build.items'), icon: <Sword className="h-4 w-4" /> },
    { id: 'runes' as const, label: t('build.runes'), icon: <Shield className="h-4 w-4" /> },
    { id: 'strategy' as const, label: t('build.strategy'), icon: <Sparkles className="h-4 w-4" /> }
  ];

  return (
    <div className="panel panel-accent animated-bg space-y-6">
      {/* Champion header */}
      {recommendation.forChampion && (
        <div className="panel-header flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0AC8B9]/30 to-transparent rounded-lg animate-pulse"></div>
              <img 
                src={recommendation.forChampion.imageUrl}
                alt={recommendation.forChampion.name}
                className="w-20 h-20 rounded-lg border-2 border-[#0AC8B9] relative z-10"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#F0E6D2] glow-blue">{recommendation.forChampion.name}</h2>
              {recommendation.forRole && (
                <div className="flex items-center mt-2 bg-[#0AC8B9]/20 px-3 py-1 rounded-full inline-block border border-[#0AC8B9]/30">
                  <RoleIcon role={recommendation.forRole} size={20} />
                  <span className="ml-2 text-[#0AC8B9] font-semibold capitalize">{recommendation.forRole}</span>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={copyBuildToClipboard}
            className="flex items-center gap-2 px-3 py-2 bg-[#1E2328]/80 rounded-lg border border-[#785A28] hover:border-[#C8AA6E] transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-[#0AC8B9]" />
                <span className="text-[#0AC8B9]">{t('common.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-[#C8AA6E]" />
                <span className="text-[#C8AA6E]">{t('common.copyBuild')}</span>
              </>
            )}
          </button>
        </div>
      )}

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
        {/* Items tab */}
        {activeTab === 'items' && hasContent(recommendation.items) && (
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
                          {typeof item.gold === 'number' && item.gold > 0 && (
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

            {/* Build phases */}
            {recommendation.build_order && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Starting items */}
                {recommendation.build_order.starting_phase?.items && hasContent(recommendation.build_order.starting_phase.items) && (
                  <div className="bg-[#1E2328]/80 rounded-lg p-4 border border-[#785A28]">
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Objets de départ</h4>
                    <div className="space-y-2">
                      {recommendation.build_order.starting_phase.items.map((item, idx) => (
                        <div key={`start-${idx}`} className="flex items-center gap-2">
                          <ItemIcon item={{ id: item.id, name: item.name }} size={32} />
                          <span className="text-sm text-[#F0E6D2]">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Early game items */}
                {recommendation.build_order.early_phase?.first_back.priority_items && hasContent(recommendation.build_order.early_phase.first_back.priority_items) && (
                  <div className="bg-[#1E2328]/80 rounded-lg p-4 border border-[#785A28]">
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Premier retour</h4>
                    <div className="space-y-2">
                      {recommendation.build_order.early_phase.first_back.priority_items.map((item, idx) => (
                        <div key={`early-${idx}`} className="flex items-center gap-2">
                          <ItemIcon item={{ id: item.id, name: item.name }} size={32} />
                          <span className="text-sm text-[#F0E6D2]">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mid game items */}
                {recommendation.build_order.mid_phase?.core_items && hasContent(recommendation.build_order.mid_phase.core_items) && (
                  <div className="bg-[#1E2328]/80 rounded-lg p-4 border border-[#785A28]">
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Objets principaux</h4>
                    <div className="space-y-2">
                      {recommendation.build_order.mid_phase.core_items.map((item, idx) => (
                        <div key={`mid-${idx}`} className="flex items-center gap-2">
                          <ItemIcon item={{ id: item.id, name: item.name }} size={32} />
                          <span className="text-sm text-[#F0E6D2]">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Late game items */}
                {recommendation.build_order.late_phase?.situational_choices && hasContent(recommendation.build_order.late_phase.situational_choices) && (
                  <div className="bg-[#1E2328]/80 rounded-lg p-4 border border-[#785A28]">
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Objets situationnels</h4>
                    <div className="space-y-2">
                      {recommendation.build_order.late_phase.situational_choices.map((item, idx) => (
                        <div key={`late-${idx}`} className="flex items-center gap-2">
                          <ItemIcon item={{ id: item.id, name: item.name }} size={32} />
                          <div className="flex-1">
                            <span className="text-sm text-[#F0E6D2] block">{item.name}</span>
                            <span className="text-xs text-[#F0E6D2]/60">{item.when}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Runes tab */}
        {activeTab === 'runes' && hasContent(recommendation.runes) && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="section-title">{t('build.runes')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendation.runes.map((rune, index) => (
                  <div key={`${rune.id}-${index}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30 hover:border-[#C8AA6E]/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-[#091428]/50 rounded-lg p-2">
                        <img 
                          src={getRuneImage(rune.id)}
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
                              src={getRunePathImage(rune.path)}
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

        {/* Strategy tab */}
        {activeTab === 'strategy' && recommendation.explanation && (
          <div className="space-y-8">
            {/* Team Analysis */}
            <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="text-xl font-bold text-[#C8AA6E]">{t('build.teamAnalysis.title')}</h3>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                  {recommendation.explanation}
                </div>
              </div>
            </div>

            {/* Game Phases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Early Game */}
              {recommendation.strategy.early_game?.approach && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-5 w-5 text-[#FF4655]" />
                    <h3 className="text-xl font-bold text-[#FF4655]">{t('build.phases.early')}</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                      {recommendation.strategy.early_game.approach}
                    </div>
                  </div>
                </div>
              )}

              {/* Mid Game */}
              {recommendation.strategy.mid_game?.approach && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Crosshair className="h-5 w-5 text-[#0AC8B9]" />
                    <h3 className="text-xl font-bold text-[#0AC8B9]">{t('build.phases.mid')}</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                      {recommendation.strategy.mid_game.approach}
                    </div>
                  </div>
                </div>
              )}

              {/* Late Game */}
              {recommendation.strategy.late_game?.approach && (
                <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-[#C8AA6E]" />
                    <h3 className="text-xl font-bold text-[#C8AA6E]">{t('build.phases.late')}</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-line text-[#F0E6D2]/90 leading-relaxed">
                      {recommendation.strategy.late_game.approach}
                    </div>
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