export type Role = 'top' | 'jungle' | 'mid' | 'adc' | 'support' | '';

export interface Champion {
  id: string;
  name: string;
  imageUrl: string;
  localImageUrl?: string;
  role?: Role;
  suggestedRoles?: Role[];
  tags?: string[];
}

export interface Team {
  allies: Champion[];
  enemies: Champion[];
  playerChampion?: Champion;
  playerRole?: Role;
}

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

export interface Rune {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  type?: 'keystone' | 'primary' | 'secondary';
  path?: 'precision' | 'domination' | 'sorcery' | 'resolve' | 'inspiration';
}

export interface BuildRecommendation {
  items: Item[];
  runes: Rune[];
  explanation: string;
  forChampion?: Champion;
  forRole?: Role;
  strategy: {
    early_game?: {
      approach?: string;
      power_spikes?: string[];
      trading_pattern?: string;
    };
    mid_game?: {
      approach?: string;
      role_in_team?: string;
    };
    late_game?: {
      approach?: string;
      win_condition?: string;
    };
  };
  team_analysis: {
    ally_strengths?: string[];
    enemy_threats?: string[];
    damage_distribution?: {
      allied?: string;
      enemy?: string;
    };
  };
  build_order?: {
    starting_phase?: {
      items: Array<{
        id: string;
        name: string;
        reason: string;
      }>;
      timing: string;
      adaptations: {
        matchup_specific: string;
        team_comp: string;
      };
    };
    early_phase?: {
      first_back: {
        ideal_gold: number;
        priority_items: Array<{
          id: string;
          name: string;
          reason: string;
        }>;
        variations: {
          ahead: string;
          even: string;
          behind: string;
        };
      };
      core_progression: Array<{
        id: string;
        name: string;
        timing: string;
        reason: string;
      }>;
    };
    mid_phase?: {
      mythic_timing: string;
      core_items: Array<{
        id: string;
        name: string;
        reason: string;
      }>;
      objectives_focus: string;
      team_adaptations: string;
    };
    late_phase?: {
      final_build: Array<{
        id: string;
        name: string;
        reason: string;
      }>;
      situational_choices: Array<{
        id: string;
        name: string;
        when: string;
      }>;
      win_condition_items: string;
    };
  };
}

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

export interface BuildFeedback {
  id: string;
  championId: string;
  role?: Role;
  items: string[];
  success: boolean;
  playerName: string;
  timestamp: number;
}