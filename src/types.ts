import type { Role } from './types';

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
  stats?: ChampionStats;
  counters?: CounterPick[];
  feedback?: BuildFeedback[];
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