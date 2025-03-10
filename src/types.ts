// Champion related types
export interface Champion {
  id: string;
  name: string;
  imageUrl: string;
  localImageUrl?: string;
  role?: Role;
  suggestedRoles?: Role[];
  tags?: string[];
}

export type Role = 'top' | 'jungle' | 'mid' | 'adc' | 'support' | '';

// Item related types
export interface Item {
  id: string;
  name: string;
  imageUrl: string;
  localImageUrl?: string;
  description: string;
  gold?: number;
  stats?: Record<string, number>;
  tags?: string[];
  mythic?: boolean;
  boots?: boolean;
}

// Rune related types
export interface Rune {
  id: string;
  name: string;
  imageUrl: string;
  localImageUrl?: string;
  description: string;
  type?: 'keystone' | 'primary' | 'secondary';
  path?: RunePath;
  icon?: string;
  shortDesc?: string;
  longDesc?: string;
}

export type RunePath = 'precision' | 'domination' | 'sorcery' | 'resolve' | 'inspiration';

// Build recommendation types
export interface BuildRecommendation {
  items: Item[];
  runes: Rune[];
  explanation: string;
  forChampion?: Champion;
  forRole?: Role;
  strategy: BuildStrategy;
  team_analysis: TeamAnalysis;
  build_order: BuildOrder;
}

export interface BuildStrategy {
  early_game: {
    approach: string;
    power_spikes: string[];
    objectives?: string[];
    trading_pattern: string;
  };
  mid_game: {
    approach: string;
    power_spikes?: string[];
    objectives?: string[];
    role_in_team: string;
  };
  late_game: {
    approach: string;
    team_fighting?: string;
    win_condition: string;
  };
}

export interface TeamAnalysis {
  ally_strengths: string[];
  enemy_threats: string[];
  damage_distribution: {
    allied: string;
    enemy: string;
  };
}

export interface BuildOrder {
  starting_phase: {
    items: BuildPhaseItem[];
    timing: string;
    adaptations: {
      matchup_specific: string;
      team_comp: string;
    };
  };
  early_phase: {
    first_back: {
      ideal_gold: number;
      priority_items: BuildPhaseItem[];
      variations: {
        ahead?: string;
        even?: string;
        behind?: string;
      };
    };
    core_progression: string[];
  };
  mid_phase: {
    mythic_timing: string;
    core_items: BuildPhaseItem[];
    objectives_focus: string;
    team_adaptations: string;
  };
  late_phase: {
    final_build: BuildPhaseItem[];
    situational_choices: SituationalItem[];
    win_condition_items: string;
  };
}

export interface BuildPhaseItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  reason?: string;
}

export interface SituationalItem extends BuildPhaseItem {
  when: string;
  instead_of?: string;
}

// Statistics and analytics types
export interface ChampionStats {
  winRate: number;
  pickRate: number;
  banRate: number;
  matches: number;
}

export interface CounterPick {
  championId: number;
  winRate: number;
  games: number;
}

export interface PopularBuild {
  items: number[];
  count: number;
  winRate: number;
}

// Feedback and user interaction types
export interface BuildFeedback {
  id: string;
  championId: string;
  role?: Role;
  items: string[];
  success: boolean;
  playerName: string;
  timestamp: number;
}

// Team composition types
export interface Team {
  allies: Champion[];
  enemies: Champion[];
  playerChampion?: Champion;
  playerRole?: Role;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: number;
    version: string;
  };
}

// Language and localization types
export interface LocaleData {
  name: string;
  flag: string;
  flagAlt: string;
  locale: string;
}

export type SupportedLocale = 'en-US' | 'fr-FR' | 'es-ES' | 'ko-KR';

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}