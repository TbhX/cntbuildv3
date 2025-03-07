import type { BuildRecommendation, Champion, Role } from '../types';

// Get the base API URL based on environment
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL;
};

// Helper to create full API URLs
const apiUrl = (endpoint: string) => `${getApiBaseUrl()}${endpoint}`;

// Add error handling and retry logic
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 300) => {
  const fetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      } catch (e) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    return response;
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
};

// Transform items data into the correct format with local image paths
const transformItemsData = (itemsData: any[]) => {
  if (!Array.isArray(itemsData)) return [];
  
  return itemsData.map(item => ({
    id: item.id || String(item.item_id) || `item-${Math.random().toString(36).substr(2, 9)}`,
    name: item.name,
    imageUrl: `/assets/items/${item.id || item.item_id}.webp`,
    description: item.description || item.reasoning?.core_benefit || '',
    gold: item.gold,
    stats: item.stats,
    tags: item.tags,
    mythic: item.mythic || item.name.toLowerCase().includes('mythic')
  }));
};

// Transform runes data into the correct format with local image paths
const transformRunesData = (runesData: any) => {
  if (!runesData) return [];
  
  const runesList = [];

  if (runesData.primary) {
    if (runesData.primary.keystone) {
      runesList.push({
        id: `keystone-${Math.random().toString(36).substr(2, 9)}`,
        name: runesData.primary.keystone,
        imageUrl: `/assets/runes/${runesData.primary.keystone.toLowerCase().replace(/\s+/g, '-')}.webp`,
        description: runesData.primary.explanation || 'Primary keystone rune'
      });
    }

    if (Array.isArray(runesData.primary.slots)) {
      runesData.primary.slots.forEach((rune: string) => {
        runesList.push({
          id: `primary-${Math.random().toString(36).substr(2, 9)}`,
          name: rune,
          imageUrl: `/assets/runes/${rune.toLowerCase().replace(/\s+/g, '-')}.webp`,
          description: 'Primary path rune'
        });
      });
    }
  }

  if (runesData.secondary && Array.isArray(runesData.secondary.slots)) {
    runesData.secondary.slots.forEach((rune: string) => {
      runesList.push({
        id: `secondary-${Math.random().toString(36).substr(2, 9)}`,
        name: rune,
        imageUrl: `/assets/runes/${rune.toLowerCase().replace(/\s+/g, '-')}.webp`,
        description: 'Secondary path rune'
      });
    });
  }

  return runesList;
};

export async function generateBuildRecommendation(
  allies: Champion[],
  enemies: Champion[],
  playerChampion: Champion,
  playerRole?: Role
): Promise<BuildRecommendation> {
  try {
    if (!playerChampion) {
      throw new Error("Please select your champion first");
    }
    if (!allies?.length || !enemies?.length) {
      throw new Error("Please add champions to both teams");
    }

    // Check API health first
    let healthCheckPassed = false;
    try {
      const healthCheck = await fetchWithRetry(apiUrl('/health'), { 
        method: 'GET'
      });
      healthCheckPassed = healthCheck.ok;
      if (!healthCheckPassed) {
        console.warn(`Health check failed: ${healthCheck.status} ${healthCheck.statusText}`);
      }
    } catch (healthError) {
      console.error('Health check error:', healthError);
    }

    if (healthCheckPassed) {
      const prompt = `As a League of Legends expert for Season 14 (patch ${import.meta.env.VITE_DDRAGON_VERSION}), provide a detailed build recommendation optimized for the current team compositions.

CHAMPION ANALYSIS:
- Your Champion: ${playerChampion.name}
- Role: ${playerRole || 'unspecified role'}
- Primary Damage Type: [Analyze champion's main damage source]
- Key Strengths: [List champion's core strengths]
- Key Weaknesses: [List potential vulnerabilities]

TEAM COMPOSITION ANALYSIS:
Allied Team:
${allies.map(c => `- ${c.name} (${c.role || 'unknown'})`).join('\n')}
Team Damage Profile: [Analyze physical/magical/true damage distribution]
Team Playstyle: [Identify if team excels at teamfighting, split pushing, pick potential, etc.]

Enemy Team:
${enemies.map(c => `- ${c.name} (${c.role || 'unknown'})`).join('\n')}
Threats Analysis:
- Primary Threats: [Identify main dangers]
- CC Threats: [List crowd control sources]
- Damage Profile: [Analyze enemy damage types]

Provide a detailed response in this JSON format:

{
  "team_analysis": {
    "ally_strengths": ["List key team strengths"],
    "enemy_threats": ["List main threats to counter"],
    "damage_distribution": {
      "allied": "Physical/Magical ratio",
      "enemy": "Physical/Magical ratio"
    }
  },
  "items": [
    {
      "item_id": "numeric_id",
      "name": "Item Name",
      "reasoning": {
        "core_benefit": "Primary benefit for your champion",
        "team_synergy": "How it works with your team",
        "counter_element": "What enemy threats it counters",
        "timing_power": "Power spike and timing considerations"
      },
      "build_priority": "When to build this item in your sequence"
    }
  ],
  "build_order": {
    "starting_items": {
      "items": ["Item 1", "Item 2"],
      "explanation": "Detailed explanation considering lane matchup"
    },
    "first_back": {
      "ideal_gold": 1000,
      "priority_items": ["Item 1", "Item 2"],
      "explanation": "First back strategy based on lane state",
      "variations": {
        "ahead": "What to buy if winning lane",
        "behind": "What to buy if behind",
        "even": "Standard build path"
      }
    },
    "core_items": {
      "sequence": ["Item 1", "Item 2", "Item 3"],
      "reasoning": "Why this specific order"
    },
    "situational_items": [
      {
        "item": "Item Name",
        "when": "Specific scenarios to buy this",
        "instead_of": "What core item it replaces"
      }
    ]
  },
  "runes": {
    "primary": {
      "keystone": "Keystone Name",
      "slots": ["Rune 1", "Rune 2", "Rune 3"],
      "explanation": "How these runes synergize with your gameplan"
    },
    "secondary": {
      "slots": ["Rune 1", "Rune 2"],
      "explanation": "Why these secondary runes"
    }
  },
  "strategy": {
    "early_game": {
      "approach": "Lane strategy considering matchup",
      "power_spikes": ["Level 2", "First item"],
      "objectives": ["Priority 1", "Priority 2"],
      "trading_pattern": "How to trade in lane"
    },
    "mid_game": {
      "approach": "Mid game strategy based on team comps",
      "power_spikes": ["Key items", "Level thresholds"],
      "objectives": ["Priority 1", "Priority 2"],
      "role_in_team": "Your role in teamfights"
    },
    "late_game": {
      "approach": "Late game strategy",
      "team_fighting": "Positioning and target priority",
      "win_condition": "How to secure the win with this team comp"
    }
  }
}

For each item recommendation, focus on:
1. Why it's effective against specific enemy champions
2. How it synergizes with your team composition
3. When to build it in response to game state
4. Alternative options in different scenarios`;

      try {
        const response = await fetchWithRetry(apiUrl('/build-recommendation'), {
          method: 'POST',
          body: JSON.stringify({
            allies,
            enemies,
            playerChampion,
            playerRole,
            prompt
          })
        }, 2, 500);

        const data = await response.json();
        
        // Build the explanation string with all available strategy information
        const strategyText = [
          '📊 Team Analysis:\n',
          'Allied Team Strengths:',
          data.team_analysis?.ally_strengths?.map((s: string) => `- ${s}`).join('\n'),
          '\nEnemy Threats:',
          data.team_analysis?.enemy_threats?.map((t: string) => `- ${t}`).join('\n'),
          '\nDamage Distribution:',
          `- Allied Team: ${data.team_analysis?.damage_distribution?.allied}`,
          `- Enemy Team: ${data.team_analysis?.damage_distribution?.enemy}`,
          
          '\n\n🌅 Early Game:\n',
          data.strategy?.early_game?.approach,
          '\nTrading Pattern:',
          data.strategy?.early_game?.trading_pattern,
          '\nPower Spikes:',
          data.strategy?.early_game?.power_spikes?.map((s: string) => `- ${s}`).join('\n'),
          '\nObjectives:',
          data.strategy?.early_game?.objectives?.map((o: string) => `- ${o}`).join('\n'),
          
          '\n\n🌤️ Mid Game:\n',
          data.strategy?.mid_game?.approach,
          '\nTeam Role:',
          data.strategy?.mid_game?.role_in_team,
          '\nPower Spikes:',
          data.strategy?.mid_game?.power_spikes?.map((s: string) => `- ${s}`).join('\n'),
          '\nObjectives:',
          data.strategy?.mid_game?.objectives?.map((o: string) => `- ${o}`).join('\n'),
          
          '\n\n🌕 Late Game:\n',
          data.strategy?.late_game?.approach,
          '\nTeam Fighting:',
          data.strategy?.late_game?.team_fighting,
          '\nWin Condition:',
          data.strategy?.late_game?.win_condition,
          
          '\n\n⚔️ Build Path:\n',
          'Starting Items:',
          data.build_order?.starting_items?.explanation,
          '\nFirst Back:',
          `Target Gold: ${data.build_order?.first_back?.ideal_gold}`,
          data.build_order?.first_back?.explanation,
          '\nIf Ahead:',
          data.build_order?.first_back?.variations?.ahead,
          '\nIf Behind:',
          data.build_order?.first_back?.variations?.behind,
          '\nIf Even:',
          data.build_order?.first_back?.variations?.even,
          
          '\nCore Build Order:',
          data.build_order?.core_items?.reasoning,
          data.build_order?.core_items?.sequence?.join(' → '),
          
          '\nSituational Items:',
          data.build_order?.situational_items?.map((item: any) => 
            `\n- ${item.item}: ${item.when}\n  Replaces: ${item.instead_of}`
          ).join('\n')
        ].filter(Boolean).join('\n');

        return {
          items: transformItemsData(data.items || []),
          runes: transformRunesData(data.runes || {}),
          explanation: strategyText || 'No strategy information available',
          forChampion: playerChampion,
          forRole: playerRole
        };
      } catch (apiError) {
        console.error('API request failed:', apiError);
        throw apiError;
      }
    } else {
      throw new Error('Build recommendation service is unavailable');
    }
  } catch (error) {
    console.error('Build recommendation error:', error);
    throw error;
  }
}