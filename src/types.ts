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
      objectives?: string[];
      trading_pattern?: string;
    };
    mid_game?: {
      approach?: string;
      power_spikes?: string[];
      objectives?: string[];
      role_in_team?: string;
    };
    late_game?: {
      approach?: string;
      team_fighting?: string;
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
    starting_items?: {
      items: string[];
      explanation: string;
    };
    first_back?: {
      ideal_gold: number;
      priority_items: string[];
      explanation: string;
      variations?: {
        ahead?: string;
        behind?: string;
        even?: string;
      };
    };
    core_items?: {
      sequence: string[];
      reasoning: string;
    };
    situational_items?: Array<{
      item: string;
      when: string;
      instead_of?: string;
    }>;
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
  localImageUrl?: string;
  description: string;
  icon?: string;
  shortDesc?: string;
  longDesc?: string;
}

export interface Team {
  allies: Champion[];
  enemies: Champion[];
  playerChampion?: Champion;
  playerRole?: Role;
}