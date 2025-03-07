import axios from 'axios';
import type { Champion, Item, Role, ChampionStats, PopularBuild, CounterPick } from '../types';
import Fuse from 'fuse.js';

// Get version from Vite's environment variables
const DDRAGON_VERSION = import.meta.env.VITE_DDRAGON_VERSION || '15.5.1';
const DDRAGON_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;
const RIOT_API_KEY = import.meta.env.VITE_RIOT_API_KEY;
const RIOT_API_BASE = 'https://euw1.api.riotgames.com';

// Cache for API responses
const cache = new Map<string, any>();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
let championsCache: Champion[] | null = null;
let fuseSearch: Fuse<Champion> | null = null;

// Fetch with caching helper
async function fetchWithCache(url: string, key: string) {
  const now = Date.now();
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from ${url}: ${response.status}`);
  }

  const data = await response.json();
  cache.set(key, { data, timestamp: now });
  return data;
}

// Get all champions
export async function getChampions(): Promise<Champion[]> {
  if (championsCache) {
    return championsCache;
  }

  try {
    const data = await fetchWithCache(
      `${DDRAGON_BASE_URL}/data/en_US/champion.json`,
      'champions'
    );
    
    championsCache = Object.values(data.data).map((champion: any) => ({
      id: champion.key,
      name: champion.name,
      imageUrl: `${DDRAGON_BASE_URL}/img/champion/${champion.id}.png`,
      localImageUrl: `/assets/champions/${champion.id}.webp`,
      suggestedRoles: CHAMPION_ROLES[champion.name] || [],
      tags: champion.tags,
    }));

    // Initialize Fuse.js search
    fuseSearch = new Fuse(championsCache, {
      keys: ['name'],
      threshold: 0.3,
      distance: 100
    });

    return championsCache;
  } catch (error) {
    console.error('Error fetching champions:', error);
    return [];
  }
}

// Search champions by name
export async function searchChampions(query: string): Promise<Champion[]> {
  if (!championsCache || !fuseSearch) {
    await getChampions();
  }

  if (!query.trim() || !fuseSearch) {
    return championsCache || [];
  }

  return fuseSearch.search(query).map(result => result.item);
}

// Get champions filtered by role
export async function getChampionsByRole(role: Role): Promise<Champion[]> {
  try {
    const champions = await getChampions();
    return champions.filter(champion => 
      champion.suggestedRoles?.includes(role)
    );
  } catch (error) {
    console.error('Error fetching champions by role:', error);
    return [];
  }
}

// Get champion win rates
export async function getChampionWinRates(championId: string, role?: Role): Promise<ChampionStats> {
  // Return mock data to avoid API rate limits and cloning issues
  return {
    winRate: 51.5,
    pickRate: 8.2,
    banRate: 4.1,
    matches: 1000
  };
}

// Get popular builds
export async function getPopularBuilds(championId: string, role?: Role): Promise<PopularBuild[]> {
  // Return mock data to avoid API rate limits and cloning issues
  return [
    {
      items: [3091, 3153, 3124, 3046, 3072, 3156],
      count: 1200,
      winRate: 54.2
    },
    {
      items: [3091, 3153, 3124, 3046, 3139, 3156],
      count: 800,
      winRate: 52.8
    }
  ];
}

// Get counter picks
export async function getCounterPicks(championId: string, role?: Role): Promise<CounterPick[]> {
  // Return mock data to avoid API rate limits and cloning issues
  return [
    {
      championId: 245,
      winRate: 53.2,
      games: 500
    },
    {
      championId: 141,
      winRate: 52.1,
      games: 450
    }
  ];
}

// Get all items
export async function getItems(): Promise<Item[]> {
  try {
    const data = await fetchWithCache(
      `${DDRAGON_BASE_URL}/data/en_US/item.json`,
      'items'
    );
    
    return Object.entries(data.data)
      .filter(([_, item]: [string, any]) => 
        item.gold?.purchasable && 
        !item.consumed && 
        item.maps[11]
      )
      .map(([id, item]: [string, any]) => ({
        id,
        name: item.name,
        imageUrl: `${DDRAGON_BASE_URL}/img/item/${id}.png`,
        localImageUrl: `/assets/items/${id}.webp`,
        description: item.description,
        gold: item.gold?.total,
        stats: item.stats,
        tags: item.tags,
        mythic: item.description.includes('Mythic'),
        boots: item.tags?.includes('Boots')
      }));
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

// Get item by ID
export async function getItemById(id: string): Promise<Item | null> {
  try {
    const items = await getItems();
    return items.find(item => item.id === id) || null;
  } catch (error) {
    console.error('Error finding item by ID:', error);
    return null;
  }
}

// Get boots items
export async function getBoots(): Promise<Item[]> {
  try {
    const items = await getItems();
    return items.filter(item => item.boots);
  } catch (error) {
    console.error('Error fetching boots:', error);
    return [];
  }
}

// Get mythic items
export async function getMythicItems(): Promise<Item[]> {
  try {
    const items = await getItems();
    return items.filter(item => item.mythic);
  } catch (error) {
    console.error('Error fetching mythic items:', error);
    return [];
  }
}

// Get recommended items for a champion
export async function getRecommendedItems(championId: string): Promise<Item[]> {
  try {
    const items = await getItems();
    // Return some sensible defaults based on champion tags
    return items.slice(0, 6);
  } catch (error) {
    console.error('Error fetching recommended items:', error);
    return [];
  }
}

// Get item by name
export async function getItemByName(name: string): Promise<Item | null> {
  try {
    const items = await getItems();
    return items.find(item => item.name.toLowerCase() === name.toLowerCase()) || null;
  } catch (error) {
    console.error('Error finding item by name:', error);
    return null;
  }
}

// Champion role mapping
const CHAMPION_ROLES: Record<string, Role[]> = {
  // Top laners
  'Aatrox': ['top'],
  'Camille': ['top'],
  'Cho\'Gath': ['top'],
  'Darius': ['top'],
  'Dr. Mundo': ['top'],
  'Fiora': ['top'],
  'Gangplank': ['top'],
  'Garen': ['top'],
  'Gnar': ['top'],
  'Gwen': ['top'],
  'Illaoi': ['top'],
  'Irelia': ['top', 'mid'],
  'Jax': ['top', 'jungle'],
  'Jayce': ['top', 'mid'],
  'Kayle': ['top', 'mid'],
  'Kennen': ['top'],
  'Kled': ['top'],
  'Malphite': ['top', 'support'],
  'Maokai': ['top', 'support'],
  'Mordekaiser': ['top'],
  'Nasus': ['top'],
  'Ornn': ['top'],
  'Pantheon': ['top', 'support', 'mid'],
  'Poppy': ['top', 'jungle'],
  'Quinn': ['top'],
  'Renekton': ['top'],
  'Riven': ['top'],
  'Rumble': ['top', 'mid'],
  'Sett': ['top', 'support'],
  'Shen': ['top', 'support'],
  'Singed': ['top'],
  'Sion': ['top'],
  'Tahm Kench': ['top', 'support'],
  'Teemo': ['top'],
  'Trundle': ['top', 'jungle'],
  'Tryndamere': ['top'],
  'Urgot': ['top'],
  'Volibear': ['top', 'jungle'],
  'Warwick': ['top', 'jungle'],
  'Wukong': ['top', 'jungle'],
  'Yorick': ['top'],
  'K\'Sante': ['top'],
  
  // Junglers
  'Amumu': ['jungle'],
  'Diana': ['jungle', 'mid'],
  'Ekko': ['jungle', 'mid'],
  'Elise': ['jungle'],
  'Evelynn': ['jungle'],
  'Fiddlesticks': ['jungle'],
  'Gragas': ['jungle', 'top'],
  'Graves': ['jungle'],
  'Hecarim': ['jungle'],
  'Ivern': ['jungle'],
  'Jarvan IV': ['jungle'],
  'Karthus': ['jungle'],
  'Kayn': ['jungle'],
  'Kha\'Zix': ['jungle'],
  'Kindred': ['jungle'],
  'Lee Sin': ['jungle'],
  'Lillia': ['jungle'],
  'Master Yi': ['jungle'],
  'Nidalee': ['jungle'],
  'Nocturne': ['jungle'],
  'Nunu & Willump': ['jungle'],
  'Olaf': ['jungle', 'top'],
  'Rammus': ['jungle'],
  'Rek\'Sai': ['jungle'],
  'Rengar': ['jungle', 'top'],
  'Sejuani': ['jungle'],
  'Shaco': ['jungle'],
  'Shyvana': ['jungle'],
  'Skarner': ['jungle'],
  'Udyr': ['jungle', 'top'],
  'Vi': ['jungle'],
  'Viego': ['jungle'],
  'Xin Zhao': ['jungle'],
  'Zac': ['jungle'],
  'Bel\'Veth': ['jungle'],
  'Briar': ['jungle'],
  
  // Mid laners
  'Ahri': ['mid'],
  'Akali': ['mid', 'top'],
  'Akshan': ['mid', 'top'],
  'Anivia': ['mid'],
  'Annie': ['mid', 'support'],
  'Aurelion Sol': ['mid'],
  'Azir': ['mid'],
  'Cassiopeia': ['mid'],
  'Corki': ['mid'],
  'Fizz': ['mid'],
  'Galio': ['mid', 'support'],
  'Heimerdinger': ['mid', 'top'],
  'Kassadin': ['mid'],
  'Katarina': ['mid'],
  'LeBlanc': ['mid'],
  'Lissandra': ['mid'],
  'Lux': ['mid', 'support'],
  'Malzahar': ['mid'],
  'Neeko': ['mid', 'support'],
  'Orianna': ['mid'],
  'Qiyana': ['mid'],
  'Ryze': ['mid', 'top'],
  'Sylas': ['mid', 'top'],
  'Syndra': ['mid'],
  'Taliyah': ['mid', 'jungle'],
  'Talon': ['mid', 'jungle'],
  'Twisted Fate': ['mid'],
  'Veigar': ['mid', 'support'],
  'Vel\'Koz': ['mid', 'support'],
  'Viktor': ['mid'],
  'Vladimir': ['mid', 'top'],
  'Xerath': ['mid', 'support'],
  'Yasuo': ['mid', 'top'],
  'Yone': ['mid', 'top'],
  'Zed': ['mid'],
  'Ziggs': ['mid', 'adc'],
  'Zoe': ['mid'],
  'Hwei': ['mid', 'support'],
  'Naafiri': ['mid', 'top'],
  
  // ADCs
  'Aphelios': ['adc'],
  'Ashe': ['adc', 'support'],
  'Caitlyn': ['adc'],
  'Draven': ['adc'],
  'Ezreal': ['adc'],
  'Jhin': ['adc'],
  'Jinx': ['adc'],
  'Kai\'Sa': ['adc'],
  'Kalista': ['adc'],
  'Kog\'Maw': ['adc'],
  'Lucian': ['adc', 'mid'],
  'Miss Fortune': ['adc', 'support'],
  'Samira': ['adc'],
  'Senna': ['support', 'adc'],
  'Sivir': ['adc'],
  'Tristana': ['adc', 'mid'],
  'Twitch': ['adc', 'jungle'],
  'Varus': ['adc', 'mid'],
  'Vayne': ['adc', 'top'],
  'Xayah': ['adc'],
  'Zeri': ['adc'],
  'Nilah': ['adc'],
  'Smolder': ['adc'],
  
  // Supports
  'Alistar': ['support'],
  'Bard': ['support'],
  'Blitzcrank': ['support'],
  'Brand': ['support', 'mid'],
  'Braum': ['support'],
  'Janna': ['support'],
  'Karma': ['support', 'mid'],
  'Leona': ['support'],
  'Lulu': ['support'],
  'Morgana': ['support', 'mid'],
  'Nami': ['support'],
  'Nautilus': ['support'],
  'Pyke': ['support'],
  'Rakan': ['support'],
  'Rell': ['support'],
  'Renata Glasc': ['support'],
  'Seraphine': ['support', 'mid', 'adc'],
  'Sona': ['support'],
  'Soraka': ['support'],
  'Swain': ['support', 'mid', 'adc'],
  'Taric': ['support'],
  'Thresh': ['support'],
  'Yuumi': ['support'],
  'Zilean': ['support', 'mid'],
  'Zyra': ['support', 'mid'],
  'Milio': ['support']
};