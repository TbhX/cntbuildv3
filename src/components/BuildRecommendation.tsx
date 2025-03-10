import React from 'react';
import { Sword, Shield, Sparkles, Clock, ArrowRight, Target, Crosshair, Zap, Flame, Copy, Check, DollarSign, AlertTriangle } from 'lucide-react';
import type { BuildRecommendation as BuildRecommendationType } from '../types';
import { RoleIcon } from './RoleIcon';
import { ItemIcon } from './ItemIcon';
import { useTranslation } from 'react-i18next';

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

  const renderPhaseItems = (items: any[], showReason = false) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div key={`${item.id}-${index}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
          <div className="flex items-start gap-3">
            <ItemIcon item={item} size={48} showTooltip={true} />
            <div>
              <h4 className="text-[#C8AA6E] font-semibold">{item.name}</h4>
              {showReason && item.reason && (
                <p className="text-sm text-[#F0E6D2]/70 mt-1">{item.reason}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
        {activeTab === 'items' && (
          <div className="space-y-8">
            {/* Starting items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="text-lg font-bold text-[#C8AA6E]">Objets de départ</h3>
                {recommendation.build_order.starting_phase.timing && (
                  <span className="text-sm text-[#F0E6D2]/70">({recommendation.build_order.starting_phase.timing})</span>
                )}
              </div>
              {renderPhaseItems(recommendation.build_order.starting_phase.items, true)}
              
              {/* Adaptations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                  <h4 className="text-[#C8AA6E] font-semibold mb-2">Adaptations selon le matchup</h4>
                  <p className="text-[#F0E6D2]/80 text-sm">{recommendation.build_order.starting_phase.adaptations.matchup_specific}</p>
                </div>
                <div className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                  <h4 className="text-[#C8AA6E] font-semibold mb-2">Adaptations selon la composition</h4>
                  <p className="text-[#F0E6D2]/80 text-sm">{recommendation.build_order.starting_phase.adaptations.team_comp}</p>
                </div>
              </div>
            </div>

            {/* First back items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="text-lg font-bold text-[#C8AA6E]">Premier retour</h3>
                <span className="text-sm text-[#F0E6D2]/70">
                  (Or idéal: {recommendation.build_order.early_phase.first_back.ideal_gold} gold)
                </span>
              </div>
              {renderPhaseItems(recommendation.build_order.early_phase.first_back.priority_items, true)}
              
              {/* Variations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {recommendation.build_order.early_phase.first_back.variations.ahead && (
                  <div className="bg-[#0AC8B9]/10 p-4 rounded-lg border border-[#0AC8B9]/30">
                    <h4 className="text-[#0AC8B9] font-semibold mb-2">Si en avance</h4>
                    <p className="text-[#F0E6D2]/80 text-sm">{recommendation.build_order.early_phase.first_back.variations.ahead}</p>
                  </div>
                )}
                {recommendation.build_order.early_phase.first_back.variations.even && (
                  <div className="bg-[#785A28]/10 p-4 rounded-lg border border-[#785A28]/30">
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Si égalité</h4>
                    <p className="text-[#F0E6D2]/80 text-sm">{recommendation.build_order.early_phase.first_back.variations.even}</p>
                  </div>
                )}
                {recommendation.build_order.early_phase.first_back.variations.behind && (
                  <div className="bg-[#FF4655]/10 p-4 rounded-lg border border-[#FF4655]/30">
                    <h4 className="text-[#FF4655] font-semibold mb-2">Si en retard</h4>
                    <p className="text-[#F0E6D2]/80 text-sm">{recommendation.build_order.early_phase.first_back.variations.behind}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Core items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sword className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="text-lg font-bold text-[#C8AA6E]">Objets principaux</h3>
                {recommendation.build_order.mid_phase.mythic_timing && (
                  <span className="text-sm text-[#F0E6D2]/70">(Mythique: {recommendation.build_order.mid_phase.mythic_timing})</span>
                )}
              </div>
              {renderPhaseItems(recommendation.build_order.mid_phase.core_items, true)}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                  <h4 className="text-[#C8AA6E] font-semibold mb-2">Focus sur les objectifs</h4>
                  <p className="text-[#F0E6D2]/80 text-sm">{recommendation.build_order.mid_phase.objectives_focus}</p>
                </div>
                <div className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                  <h4 className="text-[#C8AA6E] font-semibold mb-2">Adaptations d'équipe</h4>
                  <p className="text-[#F0E6D2]/80 text-sm">{recommendation.build_order.mid_phase.team_adaptations}</p>
                </div>
              </div>
            </div>

            {/* Situational items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="text-lg font-bold text-[#C8AA6E]">Objets situationnels</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendation.build_order.late_phase.situational_choices.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                    <div className="flex items-start gap-3">
                      <ItemIcon item={item} size={48} showTooltip={true} />
                      <div>
                        <h4 className="text-[#C8AA6E] font-semibold">{item.name}</h4>
                        <p className="text-sm text-[#F0E6D2]/70 mt-1">Quand: {item.when}</p>
                        {item.instead_of && (
                          <p className="text-sm text-[#FF4655]/70 mt-1">Remplace: {item.instead_of}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Runes tab */}
        {activeTab === 'runes' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendation.runes.map((rune, index) => (
                <div key={`${rune.id}-${index}`} className="bg-[#1E2328]/50 p-4 rounded-lg border border-[#785A28]/30">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-[#091428]/50 rounded-lg p-2">
                      <img 
                        src={rune.imageUrl}
                        alt={rune.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[#C8AA6E] font-semibold text-lg">{rune.name}</h4>
                        {rune.type === 'keystone' && (
                          <span className="px-2 py-0.5 bg-[#0AC8B9]/20 text-[#0AC8B9] text-xs rounded-full">
                            Pierre angulaire
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
                          <span className="text-xs text-[#C8AA6E] capitalize">{rune.path}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy tab */}
        {activeTab === 'strategy' && (
          <div className="space-y-8">
            {/* Team Analysis */}
            <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-[#C8AA6E]" />
                <h3 className="text-xl font-bold text-[#C8AA6E]">Analyse d'équipe</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[#0AC8B9] font-semibold mb-2">Forces alliées</h4>
                  <ul className="space-y-2">
                    {recommendation.team_analysis.ally_strengths.map((strength, index) => (
                      <li key={index} className="flex items-center gap-2 text-[#F0E6D2]/90">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0AC8B9]"></div>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-[#FF4655] font-semibold mb-2">Menaces ennemies</h4>
                  <ul className="space-y-2">
                    {recommendation.team_analysis.enemy_threats.map((threat, index) => (
                      <li key={index} className="flex items-center gap-2 text-[#F0E6D2]/90">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF4655]"></div>
                        {threat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-[#C8AA6E] font-semibold mb-2">Distribution des dégâts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#1E2328]/50 p-3 rounded-lg">
                    <p className="text-[#F0E6D2]/90">
                      <span className="text-[#0AC8B9] font-semibold">Équipe alliée:</span> {recommendation.team_analysis.damage_distribution.allied}
                    </p>
                  </div>
                  <div className="bg-[#1E2328]/50 p-3 rounded-lg">
                    <p className="text-[#F0E6D2]/90">
                      <span className="text-[#FF4655] font-semibold">Équipe ennemie:</span> {recommendation.team_analysis.damage_distribution.enemy}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Phases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Early Game */}
              <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-[#FF4655]" />
                  <h3 className="text-xl font-bold text-[#FF4655]">Début de partie</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Approche</h4>
                    <p className="text-[#F0E6D2]/90">{recommendation.strategy.early_game.approach}</p>
                  </div>
                  <div>
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Pattern de trade</h4>
                    <p className="text-[#F0E6D2]/90">{recommendation.strategy.early_game.trading_pattern}</p>
                  </div>
                  <div>
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Pics de puissance</h4>
                    <ul className="space-y-1">
                      {recommendation.strategy.early_game.power_spikes.map((spike, index) => (
                        <li key={index} className="flex items-center gap-2 text-[#F0E6D2]/90">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF4655]"></div>
                          {spike}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mid Game */}
              <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                <div className="flex items-center gap-2 mb-4">
                  <Crosshair className="h-5 w-5 text-[#0AC8B9]" />
                  <h3 className="text-xl font-bold text-[#0AC8B9]">Milieu de partie</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Approche</h4>
                    <p className="text-[#F0E6D2]/90">{recommendation.strategy.mid_game.approach}</p>
                  </div>
                  <div>
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Rôle en équipe</h4>
                    <p className="text-[#F0E6D2]/90">{recommendation.strategy.mid_game.role_in_team}</p>
                  </div>
                </div>
              </div>

              {/* Late Game */}
              <div className="bg-[#1E2328]/80 rounded-lg p-6 border border-[#785A28]">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-[#C8AA6E]" />
                  <h3 className="text-xl font-bold text-[#C8AA6E]">Fin de partie</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Approche</h4>
                    <p className="text-[#F0E6D2]/90">{recommendation.strategy.late_game.approach}</p>
                  </div>
                  <div>
                    <h4 className="text-[#C8AA6E] font-semibold mb-2">Condition de victoire</h4>
                    <p className="text-[#F0E6D2]/90">{recommendation.strategy.late_game.win_condition}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}