import React from 'react';
import { Search, X, ChevronDown, ChevronUp, UserCircle2, Star, History, Clock, Filter } from 'lucide-react';
import type { Champion, Role } from '../types';
import { getChampions, searchChampions } from '../services/riotApi';
import { RoleIcon } from './RoleIcon';

interface ChampionSelectProps {
  label: string;
  selectedChampions: Champion[];
  onChampionSelect: (champion: Champion, isPlayer?: boolean) => void;
  onChampionRemove: (championId: string) => void;
  onRoleChange?: (championId: string, role: Role) => void;
  onSetPlayerChampion?: (championId: string) => void;
  playerChampionId?: string;
  isPlayerTeam?: boolean;
  opposingTeamChampions?: Champion[];
}

// Champion classes for quick filtering
const CHAMPION_CLASSES = [
  { id: 'assassin', name: 'Assassin', icon: '🗡️' },
  { id: 'fighter', name: 'Fighter', icon: '⚔️' },
  { id: 'mage', name: 'Mage', icon: '🔮' },
  { id: 'marksman', name: 'Marksman', icon: '🏹' },
  { id: 'support', name: 'Support', icon: '🛡️' },
  { id: 'tank', name: 'Tank', icon: '🛡️' },
];

// Champion difficulty for filtering
const CHAMPION_DIFFICULTY = [
  { id: 'easy', name: 'Easy', icon: '⭐' },
  { id: 'medium', name: 'Medium', icon: '⭐⭐' },
  { id: 'hard', name: 'Hard', icon: '⭐⭐⭐' },
];

// Popular champions by role for quick selection
const POPULAR_BY_ROLE: Record<Role, string[]> = {
  'top': ['Darius', 'Garen', 'Sett', 'Mordekaiser', 'Fiora'],
  'jungle': ['Lee Sin', 'Vi', 'Warwick', 'Kayn', 'Hecarim'],
  'mid': ['Yasuo', 'Ahri', 'Zed', 'Lux', 'Vex'],
  'adc': ['Jinx', 'Caitlyn', 'Jhin', 'Ezreal', 'Kai\'Sa'],
  'support': ['Thresh', 'Lulu', 'Leona', 'Yuumi', 'Pyke'],
  '': []
};

export function ChampionSelect({
  label,
  selectedChampions,
  onChampionSelect,
  onChampionRemove,
  onRoleChange,
  onSetPlayerChampion,
  playerChampionId,
  isPlayerTeam = false,
  opposingTeamChampions = [],
}: ChampionSelectProps) {
  const [search, setSearch] = React.useState('');
  const [champions, setChampions] = React.useState<Champion[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showChampionList, setShowChampionList] = React.useState(false);
  const [hoveredRole, setHoveredRole] = React.useState<string | null>(null);
  const [recentChampions, setRecentChampions] = React.useState<Champion[]>([]);
  const [favoriteChampions, setFavoriteChampions] = React.useState<Champion[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'recent' | 'popular' | 'favorites' | 'all' | 'byRole'>('byRole');
  const [selectedRole, setSelectedRole] = React.useState<Role>('top');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Load champions on mount
  React.useEffect(() => {
    async function loadChampions() {
      try {
        setIsLoading(true);
        const data = await getChampions();
        setChampions(data);
        
        // Load recent champions from localStorage if available
        const storedRecents = localStorage.getItem('recentChampions');
        if (storedRecents) {
          try {
            const parsed = JSON.parse(storedRecents);
            // Find the actual champion objects from the loaded data
            const recentChampObjects = parsed.map((recentId: string) => 
              data.find(c => c.id === recentId)
            ).filter(Boolean);
            setRecentChampions(recentChampObjects.slice(0, 10)); // Limit to 10 recent champions
          } catch (e) {
            console.error('Error parsing recent champions:', e);
          }
        }
        
        // Load favorite champions from localStorage if available
        const storedFavorites = localStorage.getItem('favoriteChampions');
        if (storedFavorites) {
          try {
            const parsed = JSON.parse(storedFavorites);
            // Find the actual champion objects from the loaded data
            const favoriteChampObjects = parsed.map((favoriteId: string) => 
              data.find(c => c.id === favoriteId)
            ).filter(Boolean);
            setFavoriteChampions(favoriteChampObjects);
          } catch (e) {
            console.error('Error parsing favorite champions:', e);
          }
        }
      } catch (err) {
        setError('Failed to load champions');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadChampions();
  }, []);

  // Search champions when query changes
  React.useEffect(() => {
    async function searchChampionsList() {
      if (!search.trim()) {
        const allChamps = await getChampions();
        setChampions(allChamps);
        return;
      }

      const results = await searchChampions(search);
      setChampions(results);
    }
    searchChampionsList();
  }, [search]);

  // Keyboard shortcut for focusing search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or / to focus search
      if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Escape to close champion list
      if (e.key === 'Escape') {
        setShowChampionList(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save a champion to recent list when selected
  const addToRecentChampions = (champion: Champion) => {
    setRecentChampions(prev => {
      // Remove if already exists
      const filtered = prev.filter(c => c.id !== champion.id);
      // Add to beginning of array
      const updated = [champion, ...filtered].slice(0, 10);
      
      // Save to localStorage
      try {
        localStorage.setItem('recentChampions', JSON.stringify(updated.map(c => c.id)));
      } catch (e) {
        console.error('Error saving recent champions:', e);
      }
      
      return updated;
    });
  };
  
  // Toggle favorite status for a champion
  const toggleFavorite = (champion: Champion) => {
    setFavoriteChampions(prev => {
      const isFavorite = prev.some(c => c.id === champion.id);
      let updated;
      
      if (isFavorite) {
        // Remove from favorites
        updated = prev.filter(c => c.id !== champion.id);
      } else {
        // Add to favorites
        updated = [...prev, champion];
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('favoriteChampions', JSON.stringify(updated.map(c => c.id)));
      } catch (e) {
        console.error('Error saving favorite champions:', e);
      }
      
      return updated;
    });
  };
  
  // Check if a champion is in favorites
  const isFavorite = (championId: string) => {
    return favoriteChampions.some(c => c.id === championId);
  };

  // Filter champions that are already selected in either team
  const filteredChampions = champions.filter(
    (champion) => 
      champion.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedChampions.some((selected) => selected.name === champion.name) &&
      !opposingTeamChampions.some((opposing) => opposing.name === champion.name)
  );
  
  // Get popular champions for the selected role
  const getPopularChampionsByRole = (role: Role | ''): Champion[] => {
    if (!role) return [];
    
    const popularNames = POPULAR_BY_ROLE[role];
    return champions.filter(
      champion => 
        popularNames.includes(champion.name) &&
        !selectedChampions.some((selected) => selected.name === champion.name) &&
        !opposingTeamChampions.some((opposing) => opposing.name === champion.name)
    );
  };

  // Get champions by their suggested roles
  const getAvailableChampionsByRole = (role: Role): Champion[] => {
    return champions.filter(
      champion => 
        champion.suggestedRoles?.includes(role) &&
        !selectedChampions.some((selected) => selected.name === champion.name) &&
        !opposingTeamChampions.some((opposing) => opposing.name === champion.name)
    );
  };

  const roles: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];
  
  // Role descriptions for tooltips
  const roleDescriptions: Record<Role, string> = {
    'top': 'Solo lane fighter or tank',
    'jungle': 'Roams the jungle and ganks lanes',
    'mid': 'Solo lane mage or assassin',
    'adc': 'Ranged damage carry',
    'support': 'Protects and enables the team',
    '': ''
  };

  // Check if a role is already taken in the current team
  const isRoleTaken = (role: Role, championId: string): boolean => {
    return selectedChampions.some(
      (champion) => champion.role === role && champion.id !== championId
    );
  };

  // Get the champion that has taken a specific role
  const getChampionWithRole = (role: Role): Champion | undefined => {
    return selectedChampions.find(
      (champion) => champion.role === role
    );
  };

  const handleChampionSelect = (champion: Champion) => {
    // If champion has suggested roles, use the first one
    const roleToUse = champion.suggestedRoles && champion.suggestedRoles.length > 0 
      ? champion.suggestedRoles[0] 
      : undefined;
    
    // Create a new champion object with the role
    const championWithRole = roleToUse 
      ? { ...champion, role: roleToUse } 
      : champion;
    
    onChampionSelect(championWithRole);
    addToRecentChampions(champion);
    setSearch('');
    setShowChampionList(false);
  };
  
  // Quick select a champion with role
  const quickSelectWithRole = (champion: Champion, role: Role) => {
    const newChampion = { ...champion, role };
    onChampionSelect(newChampion, true);
    addToRecentChampions(newChampion);
    setSearch('');
    setShowChampionList(false);
  };

  if (error) {
    return (
      <div className="p-4 bg-[#FF4655]/20 text-[#FF4655] border border-[#FF4655]/50 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {label && <h3 className="section-title">{label}</h3>}
      
      {/* Role selection guide */}
      <div className="mb-4 bg-[#1E2328]/80 border border-[#785A28]/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[#C8AA6E] font-semibold">Team Roles</h4>
          <div className="text-xs text-[#F0E6D2]/70">
            {selectedChampions.filter(c => c.role).length}/5 assigned
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {roles.map(role => {
            const isTaken = selectedChampions.some(c => c.role === role);
            const championWithRole = getChampionWithRole(role);
            
            return (
              <div 
                key={role}
                className={`relative rounded-lg p-2 text-center transition-all cursor-pointer ${
                  isTaken 
                    ? 'bg-gradient-to-b from-[#0AC8B9]/20 to-[#091428]/80 border border-[#0AC8B9]/30' 
                    : 'bg-[#1E2328]/50 border border-[#785A28]/30 hover:border-[#C8AA6E]/50'
                } ${selectedRole === role ? 'ring-2 ring-[#0AC8B9]' : ''}`}
                onMouseEnter={() => setHoveredRole(role)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => {
                  setSelectedRole(role);
                  setActiveTab('byRole');
                  setShowChampionList(true);
                }}
              >
                <div className="flex flex-col items-center">
                  <RoleIcon role={role} size={24} className="mb-1" />
                  <span className="text-xs font-semibold capitalize text-[#F0E6D2]">{role}</span>
                </div>
                
                {isTaken && championWithRole && (
                  <div className="mt-1 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-[#0AC8B9]/50">
                      <img 
                        src={championWithRole.imageUrl} 
                        alt={championWithRole.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {hoveredRole === role && (
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-[#091428]/95 border border-[#785A28] rounded-lg p-2 text-xs text-[#F0E6D2] whitespace-nowrap z-50 shadow-lg">
                    <div className="font-bold text-[#C8AA6E] capitalize">{role}</div>
                    <div>{roleDescriptions[role]}</div>
                    {isTaken && championWithRole && (
                      <div className="mt-1 text-[#0AC8B9]">Taken by {championWithRole.name}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8AA6E] h-5 w-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search champions... (/ or Ctrl+F)"
            className="w-full pl-10 pr-4 py-3 rounded-lg input-lol"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.length > 0) {
                setShowChampionList(true);
                setActiveTab('all');
              }
            }}
            onFocus={() => setShowChampionList(true)}
          />
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C8AA6E] h-5 w-5"
            onClick={() => setShowChampionList(!showChampionList)}
          >
            {showChampionList ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedChampions.map((champion) => (
          <div
            key={champion.id}
            className={`relative group champion-card ${champion.id === playerChampionId ? 'champion-card-selected' : ''}`}
          >
            <img
              src={champion.imageUrl}
              alt={champion.name}
              className={`w-16 h-16 mx-auto champion-img ${champion.id === playerChampionId ? 'champion-img-selected' : ''}`}
            />
            <button
              onClick={() => onChampionRemove(champion.id)}
              className="absolute -top-2 -right-2 bg-[#FF4655] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
              aria-label="Remove champion"
            >
              <X size={14} />
            </button>
            <p className="text-xs text-center mt-1 text-[#F0E6D2] font-semibold truncate">{champion.name}</p>
            
            {onRoleChange && (
              <div className="mt-2">
                <div className="flex justify-center gap-1">
                  {roles.map(role => {
                    const roleTaken = isRoleTaken(role, champion.id);
                    const isSuggestedRole = champion.suggestedRoles?.includes(role);
                    
                    return (
                      <button
                        key={`${champion.id}-${role}`}
                        onClick={() => !roleTaken && onRoleChange(champion.id, role)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          champion.role === role 
                            ? 'bg-gradient-to-r from-[#0AC8B9] to-[#0A7A8F] shadow-md shadow-[#0AC8B9]/30 scale-110' 
                            : roleTaken
                              ? 'bg-[#1E2328] opacity-40 cursor-not-allowed'
                              : isSuggestedRole
                                ? 'bg-[#1E2328] border border-[#C8AA6E]/50 hover:bg-[#785A28]/50 hover:scale-105'
                                : 'bg-[#1E2328] hover:bg-[#785A28]/50 hover:scale-105'
                        }`}
                        title={roleTaken 
                          ? `${role.charAt(0).toUpperCase() + role.slice(1)} already taken` 
                          : isSuggestedRole 
                            ? `Recommended: ${role.charAt(0).toUpperCase() + role.slice(1)}` 
                            : role.charAt(0).toUpperCase() + role.slice(1)
                        }
                        disabled={roleTaken}
                      >
                        <RoleIcon role={role} size={18} className={`role-icon ${roleTaken ? 'opacity-40' : ''}`} />
                      </button>
                    );
                  })}
                </div>
                <div className="text-center mt-1 text-xs text-[#F0E6D2]/70">
                  {champion.role ? (
                    <span className="text-[#0AC8B9] capitalize">{champion.role} Lane</span>
                  ) : (
                    <span>Select role</span>
                  )}
                </div>
              </div>
            )}
            
            {isPlayerTeam && onSetPlayerChampion && (
              <button
                onClick={() => onSetPlayerChampion(champion.id)}
                className={`mt-2 w-full text-xs p-1 rounded flex items-center justify-center gap-1 ${
                  champion.id === playerChampionId 
                    ? 'bg-gradient-to-r from-[#0AC8B9] to-[#0A7A8F] text-white font-bold' 
                    : 'bg-[#785A28]/70 text-[#F0E6D2] hover:bg-[#C8AA6E] hover:text-[#091428]'
                } transition-colors`}
              >
                <UserCircle2 size={12} />
                {champion.id === playerChampionId ? 'Your Champion' : 'Set as your champion'}
              </button>
            )}
          </div>
        ))}
        
        {selectedChampions.length === 0 && (
          <div className="w-full p-4 bg-[#1E2328]/50 border border-[#785A28]/50 rounded-lg text-center">
            <p className="text-[#C8AA6E]/80 text-sm">No champions selected</p>
            <p className="text-[#F0E6D2]/60 text-xs mt-1">Use the search box above to add champions</p>
          </div>
        )}
      </div>
      
      {selectedChampions.length < 5 && showChampionList && (
        <div className="relative mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="bg-[#1E2328]/95 backdrop-blur-sm border border-[#785A28] rounded-lg p-4 shadow-lg max-h-[400px] overflow-y-auto">
              {/* Tab navigation */}
              <div className="flex border-b border-[#785A28]/50 mb-4">
                <button
                  onClick={() => setActiveTab('byRole')}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'byRole' 
                      ? 'text-[#0AC8B9] border-b-2 border-[#0AC8B9]' 
                      : 'text-[#F0E6D2]/70 hover:text-[#F0E6D2]'
                  }`}
                >
                  <RoleIcon role={selectedRole} size={16} />
                  <span>By Role</span>
                </button>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'recent' 
                      ? 'text-[#0AC8B9] border-b-2 border-[#0AC8B9]' 
                      : 'text-[#F0E6D2]/70 hover:text-[#F0E6D2]'
                  }`}
                >
                  <History size={16} />
                  <span>Recent</span>
                </button>
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'popular' 
                      ? 'text-[#0AC8B9] border-b-2 border-[#0AC8B9]' 
                      : 'text-[#F0E6D2]/70 hover:text-[#F0E6D2]'
                  }`}
                >
                  <Star size={16} />
                  <span>Popular</span>
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'favorites' 
                      ? 'text-[#0AC8B9] border-b-2 border-[#0AC8B9]' 
                      : 'text-[#F0E6D2]/70 hover:text-[#F0E6D2]'
                  }`}
                >
                  <Star size={16} />
                  <span>Favorites</span>
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'all' 
                      ? 'text-[#0AC8B9] border-b-2 border-[#0AC8B9]' 
                      : 'text-[#F0E6D2]/70 hover:text-[#F0E6D2]'
                  }`}
                >
                  <Filter size={16} />
                  <span>All</span>
                </button>
              </div>
              
              {/* Quick role selection for role tabs */}
              {(activeTab === 'byRole' || activeTab === 'popular') && (
                <div className="flex justify-center gap-2 mb-4">
                  {roles.map(role => (
                    <button
                      key={`quick-${role}`}
                      onClick={() => setSelectedRole(role)}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                        selectedRole === role 
                          ? 'bg-[#0AC8B9]/20 border border-[#0AC8B9]/50' 
                          : 'bg-[#1E2328] border border-[#785A28]/30 hover:border-[#C8AA6E]/50'
                      }`}
                    >
                      <RoleIcon role={role} size={20} />
                      <span className="text-xs mt-1 capitalize">{role}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Champions by role tab */}
              {activeTab === 'byRole' && (
                <div>
                  <h4 className="text-[#C8AA6E] text-sm font-semibold mb-2">
                    {`Champions for ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Lane`}
                  </h4>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {getAvailableChampionsByRole(selectedRole).length > 0 ? (
                      getAvailableChampionsByRole(selectedRole).map((champion) => (
                        <div key={`role-${champion.id}`} className="relative group">
                          <button
                            onClick={() => quickSelectWithRole(champion, selectedRole)}
                            className="champion-card w-full"
                          >
                            <div className="relative overflow-hidden rounded">
                              <img
                                src={champion.imageUrl}
                                alt={champion.name}
                                className="w-12 h-12 rounded mx-auto transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#091428]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                <span className="text-[#0AC8B9] text-xs font-bold">Select as {selectedRole}</span>
                              </div>
                            </div>
                            <p className="text-xs text-center mt-1 text-[#F0E6D2] truncate">{champion.name}</p>
                            
                            {/* Show primary role indicator */}
                            <div className="flex justify-center mt-1">
                              <div className="bg-[#0AC8B9]/20 px-2 py-0.5 rounded-full flex items-center">
                                <RoleIcon role={selectedRole} size={12} />
                                <span className="text-[#0AC8B9] text-xs ml-1 capitalize">{selectedRole}</span>
                              </div>
                            </div>
                          </button>
                          
                          {/* Star button for favorites */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(champion);
                            }}
                            className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center z-20 ${
                              isFavorite(champion.id) 
                                ? 'bg-[#C8AA6E] text-[#091428]' 
                                : 'bg-[#091428]/70 text-[#C8AA6E]/70 opacity-0 group-hover:opacity-100'
                            }`}
                            title={isFavorite(champion.id) ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-5 p-4 text-center">
                        <p className="text-[#C8AA6E]">No available champions for this role</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Recent champions tab */}
              {activeTab === 'recent' && recentChampions.length > 0 && (
                <div>
                  <h4 className="text-[#C8AA6E] text-sm font-semibold mb-2">Recently Used Champions</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {recentChampions
                      .filter(champion => 
                        !selectedChampions.some(selected => selected.name === champion.name) &&
                        !opposingTeamChampions.some(opposing => opposing.name === champion.name)
                      )
                      .map((champion) => (
                        <div key={`recent-${champion.id}`} className="relative">
                          <button
                            onClick={() => handleChampionSelect(champion)}
                            className="champion-card group w-full"
                          >
                            <div className="relative overflow-hidden rounded">
                              <img
                                src={champion.imageUrl}
                                alt={champion.name}
                                className="w-12 h-12 rounded mx-auto transition-transform group-hover: scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#091428]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                <span className="text-[#0AC8B9] text-xs font-bold">Select</span>
                              </div>
                            </div>
                            <p className="text-xs text-center mt-1 text-[#F0E6D2] truncate">{champion.name}</p>
                            
                            {/* Show suggested role indicator */}
                            {champion.suggestedRoles && champion.suggestedRoles.length > 0 && (
                              <div className="flex justify-center mt-1 gap-1">
                                {champion.suggestedRoles.slice(0, 2).map(role => (
                                  <div key={`suggested-${champion.id}-${role}`} className="w-4 h-4">
                                    <RoleIcon role={role} size={16} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </button>
                          
                          {/* Quick role selection on hover */}
                          <div className="absolute -bottom-10 left-0 right-0 bg-[#091428]/95 border border-[#785A28] rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex justify-center gap-1">
                            {roles.map(role => {
                              const isSuggested = champion.suggestedRoles?.includes(role);
                              return (
                                <button
                                  key={`quick-role-${champion.id}-${role}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    quickSelectWithRole(champion, role);
                                  }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    isSuggested ? 'bg-[#0AC8B9]/20 hover:bg-[#0AC8B9]/40' : 'hover:bg-[#785A28]/20'
                                  }`}
                                  title={`Select as ${role}${isSuggested ? ' (Recommended)' : ''}`}
                                >
                                  <RoleIcon role={role} size={14} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    }
                    
                    {recentChampions.filter(champion => 
                      !selectedChampions.some(selected => selected.name === champion.name) &&
                      !opposingTeamChampions.some(opposing => opposing.name === champion.name)
                    ).length === 0 && (
                      <div className="col-span-5 p-4 text-center">
                        <p className="text-[#C8AA6E]">No available recent champions</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Popular champions by role tab */}
              {activeTab === 'popular' && (
                <div>
                  <h4 className="text-[#C8AA6E] text-sm font-semibold mb-2">
                    {`Popular ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Champions`}
                  </h4>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {getPopularChampionsByRole(selectedRole).length > 0 ? (
                      getPopularChampionsByRole(selectedRole).map((champion) => (
                        <div key={`popular-${champion.id}`} className="relative group">
                          <button
                            onClick={() => quickSelectWithRole(champion, selectedRole)}
                            className="champion-card w-full"
                          >
                            <div className="relative overflow-hidden rounded">
                              <img
                                src={champion.imageUrl}
                                alt={champion.name}
                                className="w-12 h-12 rounded mx-auto transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#091428]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                <span className="text-[#0AC8B9] text-xs font-bold">Select as {selectedRole}</span>
                              </div>
                            </div>
                            <p className="text-xs text-center mt-1 text-[#F0E6D2] truncate">{champion.name}</p>
                            
                            {/* Show primary role indicator */}
                            <div className="flex justify-center mt-1">
                              <div className="bg-[#0AC8B9]/20 px-2 py-0.5 rounded-full flex items-center">
                                <RoleIcon role={selectedRole} size={12} />
                                <span className="text-[#0AC8B9] text-xs ml-1 capitalize">{selectedRole}</span>
                              </div>
                            </div>
                          </button>
                          
                          {/* Star button for favorites */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(champion);
                            }}
                            className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center z-20 ${
                              isFavorite(champion.id) 
                                ? 'bg-[#C8AA6E] text-[#091428]' 
                                : 'bg-[#091428]/70 text-[#C8AA6E]/70 opacity-0 group-hover:opacity-100'
                            }`}
                            title={isFavorite(champion.id) ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-5 p-4 text-center">
                        <p className="text-[#C8AA6E]">No available champions for this role</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Favorites tab */}
              {activeTab === 'favorites' && (
                <div>
                  <h4 className="text-[#C8AA6E] text-sm font-semibold mb-2">Your Favorite Champions</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {favoriteChampions.filter(champion => 
                      !selectedChampions.some(selected => selected.name === champion.name) &&
                      !opposingTeamChampions.some(opposing => opposing.name === champion.name)
                    ).length > 0 ? (
                      favoriteChampions
                        .filter(champion => 
                          !selectedChampions.some(selected => selected.name === champion.name) &&
                          !opposingTeamChampions.some(opposing => opposing.name === champion.name)
                        )
                        .map((champion) => (
                          <div key={`favorite-${champion.id}`} className="relative group">
                            <button
                              onClick={() => handleChampionSelect(champion)}
                              className="champion-card w-full"
                            >
                              <div className="relative overflow-hidden rounded">
                                <img
                                  src={champion.imageUrl}
                                  alt={champion.name}
                                  className="w-12 h-12 rounded mx-auto transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#091428]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                  <span className="text-[#0AC8B9] text-xs font-bold">Select</span>
                                </div>
                              </div>
                              <p className="text-xs text-center mt-1 text-[#F0E6D2] truncate">{champion.name}</p>
                              
                              {/* Show suggested roles */}
                              {champion.suggestedRoles && champion.suggestedRoles.length > 0 && (
                                <div className="flex justify-center mt-1 gap-1">
                                  {champion.suggestedRoles.slice(0, 2).map(role => (
                                    <div key={`fav-role-${champion.id}-${role}`} className="bg-[#0AC8B9]/10 rounded-full p-0.5">
                                      <RoleIcon role={role} size={14} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </button>
                            
                            {/* Quick role selection on hover */}
                            <div className="absolute -bottom-10 left-0 right-0 bg-[#091428]/95 border border-[#785A28] rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex justify-center gap-1">
                              {roles.map(role => {
                                const isSuggested = champion.suggestedRoles?.includes(role);
                                return (
                                  <button
                                    key={`quick-role-${champion.id}-${role}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      quickSelectWithRole(champion, role);
                                    }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      isSuggested ? 'bg-[#0AC8B9]/20 hover:bg-[#0AC8B9]/40' : 'hover:bg-[#785A28]/20'
                                    }`}
                                    title={`Select as ${role}${isSuggested ? ' (Recommended)' : ''}`}
                                  >
                                    <RoleIcon role={role} size={14} />
                                  </button>
                                );
                              })}
                            </div>
                            
                            {/* Remove from favorites */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(champion);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#C8AA6E] text-[#091428] flex items-center justify-center z-20"
                              title="Remove from favorites"
                            >
                              <Star size={12} />
                            </button>
                          </div>
                        ))
                    ) : (
                      <div className="col-span-5 p-4 text-center">
                        <p className="text-[#C8AA6E]">No favorite champions available</p>
                        <p className="text-[#F0E6D2]/60 text-xs mt-1">Star champions to add them to your favorites</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Search results or all champions */}
              {(activeTab === 'all' || search.length > 0) && (
                <div>
                  <h4 className="text-[#C8AA6E] text-sm font-semibold mb-2">
                    {search.length > 0 ? 'Search Results' : 'All Champions'}
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {filteredChampions.length > 0 ? (
                      filteredChampions.slice(0, search.length > 0 ? 100 : 15).map((champion) => (
                        <div key={`champion-${champion.id}`} className="relative group">
                          <button
                            onClick={() => handleChampionSelect(champion)}
                            className="champion-card w-full"
                          >
                            <div className="relative overflow-hidden rounded">
                              <img
                                src={champion.imageUrl}
                                alt={champion.name}
                                className="w-12 h-12 rounded mx-auto transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#091428]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                                <span className="text-[#0AC8B9] text-xs font-bold">Select</span>
                              </div>
                            </div>
                            <p className="text-xs text-center mt-1 text-[#F0E6D2] truncate">{champion.name}</p>
                            
                            {/* Show suggested roles */}
                            {champion.suggestedRoles && champion.suggestedRoles.length > 0 && (
                              <div className="flex justify-center mt-1 gap-1">
                                {champion.suggestedRoles.slice(0, 2).map(role => (
                                  <div key={`all-role-${champion.id}-${role}`} className="bg-[#0AC8B9]/10 rounded-full p-0.5">
                                    <RoleIcon role={role} size={14} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </button>
                          
                          {/* Quick role selection on hover */}
                          <div className="absolute -bottom-10 left-0 right-0 bg-[#091428]/95 border border-[#785A28] rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex justify-center gap-1">
                            {roles.map(role => {
                              const isSuggested = champion.suggestedRoles?.includes(role);
                              return (
                                <button
                                  key={`quick-role-${champion.id}-${role}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    quickSelectWithRole(champion, role);
                                  }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    isSuggested ? 'bg-[#0AC8B9]/20 hover:bg-[#0AC8B9]/40' : 'hover:bg-[#785A28]/20'
                                  }`}
                                  title={`Select as ${role}${isSuggested ? ' (Recommended)' : ''}`}
                                >
                                  <RoleIcon role={role} size={14} />
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Star button for favorites */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(champion);
                            }}
                            className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center z-20 ${
                              isFavorite(champion.id) 
                                ? 'bg-[#C8AA6E] text-[#091428]' 
                                : 'bg-[#091428]/70 text-[#C8AA6E]/70 opacity-0 group-hover:opacity-100'
                            }`}
                            title={isFavorite(champion.id) ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-5 p-4 text-center">
                        <p className="text-[#C8AA6E]">No champions found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Keyboard shortcuts help */}
              <div className="mt-4 pt-3 border-t border-[#785A28]/30">
                <div className="flex items-center justify-between text-xs text-[#F0E6D2]/60">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#1E2328] px-2 py-1 rounded border border-[#785A28]/30">Ctrl+F</span>
                    <span>or</span>
                    <span className="bg-[#1E2328] px-2 py-1 rounded border border-[#785A28]/30">/</span>
                    <span>to search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#1E2328] px-2 py-1 rounded border border-[#785A28]/30">Esc</span>
                    <span>to close</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}