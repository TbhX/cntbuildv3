import React from 'react';
import { Sword, Sparkles, Shield, Target, Info, HelpCircle, AlertCircle, X } from 'lucide-react';
import { ChampionSelect } from './components/ChampionSelect';
import { BuildRecommendation } from './components/BuildRecommendation';
import { generateBuildRecommendation } from './services/openaiApi';
import { RoleIcon } from './components/RoleIcon';
import { LanguageSelector } from './components/LanguageSelector';
import { Footer } from './components/Footer';
import { useTranslation } from 'react-i18next';
import type { Champion, Team, BuildRecommendation as BuildRecommendationType, Role } from './types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

function App() {
  const { t } = useTranslation();
  const [team, setTeam] = React.useState<Team>({
    allies: [],
    enemies: [],
  });
  const [recommendation, setRecommendation] = React.useState<BuildRecommendationType | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showTutorial, setShowTutorial] = React.useState(true);
  const [tutorialStep, setTutorialStep] = React.useState(1);

  const handleAllySelect = (champion: Champion, isPlayer = false) => {
    if (team.allies.length < 5) {
      setTeam((prev) => {
        // Create a unique ID for the champion
        const uniqueId = `ally-${champion.id}-${Date.now()}`;
        const newChampion = { ...champion, id: uniqueId };
        
        const newTeam = {
          ...prev,
          allies: [...prev.allies, newChampion],
        };
        
        // If this is marked as the player's champion, update playerChampion
        if (isPlayer) {
          newTeam.playerChampion = newChampion;
        }
        
        return newTeam;
      });

      // Auto-advance tutorial if needed
      if (showTutorial && tutorialStep === 1) {
        setTutorialStep(2);
      }
    }
  };

  const handleEnemySelect = (champion: Champion) => {
    if (team.enemies.length < 5) {
      setTeam((prev) => ({
        ...prev,
        enemies: [...prev.enemies, { ...champion, id: `enemy-${champion.id}-${Date.now()}` }],
      }));

      // Auto-advance tutorial if needed
      if (showTutorial && tutorialStep === 3) {
        setTutorialStep(4);
      }
    }
  };

  const handleAllyRemove = (championId: string) => {
    setTeam((prev) => {
      const isRemovingPlayerChampion = prev.playerChampion?.id === championId;
      
      return {
        ...prev,
        allies: prev.allies.filter((c) => c.id !== championId),
        playerChampion: isRemovingPlayerChampion ? undefined : prev.playerChampion,
      };
    });
  };

  const handleEnemyRemove = (championId: string) => {
    setTeam((prev) => ({
      ...prev,
      enemies: prev.enemies.filter((c) => c.id !== championId),
    }));
  };

  const handleAllyRoleChange = (championId: string, role: Role) => {
    setTeam((prev) => {
      const updatedAllies = prev.allies.map(champion => 
        champion.id === championId ? { ...champion, role } : champion
      );
      
      // If this is the player's champion, update the player role too
      const isPlayerChampion = prev.playerChampion?.id === championId;
      
      return {
        ...prev,
        allies: updatedAllies,
        playerRole: isPlayerChampion ? role : prev.playerRole,
        playerChampion: isPlayerChampion ? 
          { ...prev.playerChampion!, role } : 
          prev.playerChampion
      };
    });

    // Auto-advance tutorial if needed
    if (showTutorial && tutorialStep === 2) {
      setTutorialStep(3);
    }
  };

  const handleEnemyRoleChange = (championId: string, role: Role) => {
    setTeam((prev) => ({
      ...prev,
      enemies: prev.enemies.map(champion => 
        champion.id === championId ? { ...champion, role } : champion
      )
    }));
  };

  const setPlayerChampion = (championId: string) => {
    setTeam((prev) => {
      // Find the champion in the allies list
      const champion = prev.allies.find(c => c.id === championId);
      if (!champion) return prev;
      
      return {
        ...prev,
        playerChampion: champion,
        playerRole: champion.role
      };
    });

    // Auto-advance tutorial if needed
    if (showTutorial && tutorialStep === 2) {
      setTutorialStep(3);
    }
  };

  const generateRecommendation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!team.playerChampion) {
        throw new Error(t('errors.missingChampion'));
      }
      
      if (!team.playerRole) {
        throw new Error(t('errors.missingRole'));
      }
      
      if (team.allies.length === 0 || team.enemies.length === 0) {
        throw new Error(t('errors.missingTeams'));
      }
      
      const result = await generateBuildRecommendation(
        team.allies, 
        team.enemies, 
        team.playerChampion,
        team.playerRole
      );
      
      setRecommendation(result);
      
      // End tutorial if it was showing
      if (showTutorial) {
        setShowTutorial(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(errorMessage);
      console.error('Error generating build:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setTeam({
      allies: [],
      enemies: [],
    });
    setRecommendation(null);
    setError(null);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  const renderTutorial = () => {
    if (!showTutorial) return null;

    const steps = [
      {
        title: "Welcome to I Can't Build!",
        content: "This tool helps you get optimal build recommendations for your champion based on team compositions.",
        position: "center"
      },
      {
        title: "Step 1: Select Your Team",
        content: "Start by adding champions to your team using the search box.",
        position: "left"
      },
      {
        title: "Step 2: Choose Your Role",
        content: "Select a role for your champion and mark it as your champion.",
        position: "left"
      },
      {
        title: "Step 3: Add Enemy Champions",
        content: "Add champions to the enemy team to get a build tailored to counter them.",
        position: "right"
      },
      {
        title: "Step 4: Generate Build",
        content: "Click 'Generate Build' to get AI-powered recommendations optimized for your matchup.",
        position: "right"
      }
    ];

    const currentStep = steps[tutorialStep - 1];
    
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
        <div className={`bg-[#1E2328] border-2 border-[#C8AA6E] rounded-lg p-6 max-w-md shadow-2xl shadow-[#C8AA6E]/20 ${
          currentStep.position === "left" ? "ml-[20%] -translate-x-1/2" : 
          currentStep.position === "right" ? "mr-[20%] translate-x-1/2" : ""
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-[#C8AA6E]">{currentStep.title}</h3>
            <button 
              onClick={closeTutorial}
              className="text-[#F0E6D2]/60 hover:text-[#F0E6D2]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-[#F0E6D2] mb-6">{currentStep.content}</p>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full ${tutorialStep === index + 1 ? 'bg-[#0AC8B9]' : 'bg-[#785A28]'}`}
                />
              ))}
            </div>
            
            <div className="flex space-x-2">
              {tutorialStep > 1 && (
                <button 
                  onClick={() => setTutorialStep(prev => prev - 1)}
                  className="px-3 py-1 bg-[#1E2328] border border-[#785A28] rounded text-[#C8AA6E] hover:bg-[#091428]"
                >
                  Previous
                </button>
              )}
              
              {tutorialStep < steps.length ? (
                <button 
                  onClick={() => setTutorialStep(prev => prev + 1)}
                  className="px-3 py-1 bg-gradient-to-r from-[#0AC8B9] to-[#0A7A8F] rounded text-white hover:from-[#0FF3E2] hover:to-[#0AC8B9]"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={closeTutorial}
                  className="px-3 py-1 bg-gradient-to-r from-[#0AC8B9] to-[#0A7A8F] rounded text-white hover:from-[#0FF3E2] hover:to-[#0AC8B9]"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#091428] hexagon-bg">
        {renderTutorial()}
        
        <header className="bg-[#091428]/90 backdrop-blur-md border-b border-[#785A28] text-[#C8AA6E] p-4 sticky top-0 z-40 shadow-lg shadow-black/30">
          <div className="container mx-auto flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#C8AA6E] to-[#785A28] p-2 rounded-lg shadow-lg">
              <Sword className="h-8 w-8 text-[#091428]" />
            </div>
            <h1 className="text-3xl font-bold glow-gold tracking-wider">
              I Can't Build
            </h1>
            <div className="ml-auto flex items-center gap-3">
              <LanguageSelector />
              <button 
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-1 bg-[#1E2328]/80 px-3 py-1 rounded-full border border-[#785A28] hover:border-[#C8AA6E] transition-colors"
                title="Help"
              >
                <HelpCircle className="h-4 w-4 text-[#C8AA6E]" />
                <span className="text-sm text-[#C8AA6E] hidden md:inline">Help</span>
              </button>
              
              <button 
                onClick={resetAll}
                className="flex items-center gap-1 bg-[#1E2328]/80 px-3 py-1 rounded-full border border-[#785A28] hover:border-[#FF4655] transition-colors"
                title="Reset"
              >
                <AlertCircle className="h-4 w-4 text-[#FF4655]" />
                <span className="text-sm text-[#FF4655] hidden md:inline">Reset</span>
              </button>
              
              <div className="hidden md:flex items-center gap-1 bg-[#1E2328]/80 px-3 py-1 rounded-full border border-[#785A28]">
                <Sparkles className="h-4 w-4 text-[#C8AA6E]" />
             
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto py-8 px-4">
          {/* Quick Guide */}
          <div className="mb-8 bg-[#1E2328]/80 border border-[#0AC8B9]/30 rounded-lg p-4 shadow-md">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#0AC8B9] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-[#0AC8B9] mb-1">Quick Guide</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[#F0E6D2]/90 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#0AC8B9]/20 rounded-full w-6 h-6 flex items-center justify-center text-[#0AC8B9] font-bold">1</div>
                    <span>Select your team's champions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#0AC8B9]/20 rounded-full w-6 h-6 flex items-center justify-center text-[#0AC8B9] font-bold">2</div>
                    <span>Choose your champion and role</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#0AC8B9]/20 rounded-full w-6 h-6 flex items-center justify-center text-[#0AC8B9] font-bold">3</div>
                    <span>Add enemy team champions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#0AC8B9]/20 rounded-full w-6 h-6 flex items-center justify-center text-[#0AC8B9] font-bold">4</div>
                    <span>Generate build recommendation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="panel animated-bg mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-[#C8AA6E]" />
                  <h3 className="section-title">Your Team</h3>
                  <div className="ml-auto text-sm text-[#F0E6D2]/70">
                    {team.allies.length}/5 Champions
                  </div>
                </div>
                <ChampionSelect
                  label=""
                  selectedChampions={team.allies}
                  onChampionSelect={handleAllySelect}
                  onChampionRemove={handleAllyRemove}
                  onRoleChange={handleAllyRoleChange}
                  onSetPlayerChampion={setPlayerChampion}
                  playerChampionId={team.playerChampion?.id}
                  isPlayerTeam={true}
                  opposingTeamChampions={team.enemies}
                />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="panel animated-bg mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-[#C8AA6E]" />
                  <h3 className="section-title">Enemy Team</h3>
                  <div className="ml-auto text-sm text-[#F0E6D2]/70">
                    {team.enemies.length}/5 Champions
                  </div>
                </div>
                <ChampionSelect
                  label=""
                  selectedChampions={team.enemies}
                  onChampionSelect={handleEnemySelect}
                  onChampionRemove={handleEnemyRemove}
                  onRoleChange={handleEnemyRoleChange}
                  opposingTeamChampions={team.allies}
                />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="panel animated-bg mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-[#0AC8B9]" />
                  <h3 className="section-title text-[#0AC8B9]">Your Champion</h3>
                </div>
                
                {team.playerChampion ? (
                  <div className="bg-gradient-to-br from-[#1E2328] to-[#091428] border border-[#0AC8B9] rounded-lg p-4 shadow-md shadow-[#0AC8B9]/10">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0AC8B9]/30 to-transparent rounded-lg animate-pulse"></div>
                        <img 
                          src={team.playerChampion.imageUrl} 
                          alt={team.playerChampion.name} 
                          className="w-20 h-20 rounded-lg border-2 border-[#0AC8B9] relative z-10" 
                        />
                      </div>
                      <div className="ml-4">
                        <p className="text-2xl text-[#F0E6D2] font-bold glow-blue">{team.playerChampion.name}</p>
                        <div className="flex items-center mt-2">
                          {team.playerRole ? (
                            <div className="flex items-center bg-[#0AC8B9]/20 px-3 py-1 rounded-full border border-[#0AC8B9]/30">
                              <RoleIcon role={team.playerRole} size={20} />
                              <span className="ml-2 text-[#0AC8B9] font-semibold capitalize">{team.playerRole}</span>
                            </div>
                          ) : (
                            <div className="flex items-center bg-[#785A28]/20 px-3 py-1 rounded-full border border-[#785A28]/30">
                              <span className="text-[#C8AA6E]">No role selected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        onClick={generateRecommendation}
                        disabled={!team.playerChampion || !team.playerRole || team.allies.length === 0 || team.enemies.length === 0 || isLoading}
                        className="btn-blue w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white"></div>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>Generate Build</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Build status indicators */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className={`flex items-center gap-1 p-2 rounded-lg ${team.allies.length > 0 ? 'bg-[#0AC8B9]/20 text-[#0AC8B9]' : 'bg-[#1E2328] text-[#F0E6D2]/40'}`}>
                        <Shield className="h-4 w-4" />
                        <span className="text-xs">Allies: {team.allies.length}/5</span>
                      </div>
                      <div className={`flex items-center gap-1 p-2 rounded-lg ${team.enemies.length > 0 ? 'bg-[#0AC8B9]/20 text-[#0AC8B9]' : 'bg-[#1E2328] text-[#F0E6D2]/40'}`}>
                        <Target className="h-4 w-4" />
                        <span className="text-xs">Enemies: {team.enemies.length}/5</span>
                      </div>
                      <div className={`flex items-center gap-1 p-2 rounded-lg ${team.playerChampion ? 'bg-[#0AC8B9]/20 text-[#0AC8B9]' : 'bg-[#1E2328] text-[#F0E6D2]/40'}`}>
                        <Sword className="h-4 w-4" />
                        <span className="text-xs">Champion: {team.playerChampion ? 'Selected' : 'None'}</span>
                      </div>
                      <div className={`flex items-center gap-1 p-2 rounded-lg ${team.playerRole ? 'bg-[#0AC8B9]/20 text-[#0AC8B9]' : 'bg-[#1E2328] text-[#F0E6D2]/40'}`}>
                        <RoleIcon role={team.playerRole || ''} size={16} />
                        <span className="text-xs">Role: {team.playerRole || 'None'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#1E2328] to-[#091428] border border-[#785A28] rounded-lg p-6 text-center">
                    <p className="text-[#C8AA6E] mb-2">Select Your Champion</p>
                    <p className="text-[#F0E6D2]/60 text-sm">Choose a champion from your team and assign them as your champion</p>
                    
                    <div className="mt-6 flex justify-center">
                      <div className="bg-[#1E2328]/80 border border-[#785A28]/50 rounded-lg p-3 max-w-xs">
                        <div className="flex items-center gap-2 text-left">
                          <div className="bg-[#0AC8B9]/20 rounded-full w-6 h-6 flex items-center justify-center text-[#0AC8B9] font-bold">1</div>
                          <span className="text-sm text-[#F0E6D2]/90">First, add a champion to your team</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mt-4 p-4 bg-[#FF4655]/20 text-[#FF4655] border border-[#FF4655]/50 rounded-lg">
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <BuildRecommendation
              recommendation={recommendation}
              isLoading={isLoading}
            />
          </div>
        </main>
        <Footer />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1E2328',
            color: '#F0E6D2',
            border: '1px solid #785A28',
          },
          success: {
            iconTheme: {
              primary: '#0AC8B9',
              secondary: '#1E2328',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF4655',
              secondary: '#1E2328',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;