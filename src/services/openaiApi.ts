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
      // Optimized prompt for faster and more focused responses
      const prompt = `Generate a focused League of Legends Season 14 build recommendation for ${playerChampion.name} (${playerRole || 'flex'}) in patch ${import.meta.env.VITE_DDRAGON_VERSION}.

Context:
- Allies: ${allies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ')}
- Enemies: ${enemies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ')}

Required JSON structure:
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "gold": number
    }
  ],
  "runes": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ],
  "strategy": {
    "early_game": {
      "approach": "string",
      "power_spikes": ["string"],
      "trading_pattern": "string"
    },
    "mid_game": {
      "approach": "string",
      "role_in_team": "string"
    },
    "late_game": {
      "approach": "string",
      "win_condition": "string"
    }
  },
  "team_analysis": {
    "ally_strengths": ["string"],
    "enemy_threats": ["string"],
    "damage_distribution": {
      "allied": "string",
      "enemy": "string"
    }
  }
}

Build Guidelines:
1. Focus on Season 14 item changes and new build paths
2. Consider team composition synergies and counter-building
3. Adapt build order based on enemy threats and team needs
4. Optimize for ${playerRole || 'flex'} role requirements
5. Include core items and situational choices

Keep responses concise and focused on actionable insights.`;

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
          '📊 Team Analysis:',
          data.team_analysis?.ally_strengths?.length > 0 ? 'Allied Strengths:' : '',
          ...(data.team_analysis?.ally_strengths?.map((s: string) => `• ${s}`) || []),
          data.team_analysis?.enemy_threats?.length > 0 ? '\nEnemy Threats:' : '',
          ...(data.team_analysis?.enemy_threats?.map((t: string) => `• ${t}`) || []),
          '\nDamage Profile:',
          data.team_analysis?.damage_distribution?.allied ? `• Allied Team: ${data.team_analysis.damage_distribution.allied}` : '',
          data.team_analysis?.damage_distribution?.enemy ? `• Enemy Team: ${data.team_analysis.damage_distribution.enemy}` : '',
          
          '\n🌅 Early Game:',
          data.strategy?.early_game?.approach || '',
          data.strategy?.early_game?.trading_pattern ? `\nTrading Pattern: ${data.strategy.early_game.trading_pattern}` : '',
          data.strategy?.early_game?.power_spikes?.length > 0 ? '\nPower Spikes:' : '',
          ...(data.strategy?.early_game?.power_spikes?.map((s: string) => `• ${s}`) || []),
          
          '\n🌤️ Mid Game:',
          data.strategy?.mid_game?.approach || '',
          data.strategy?.mid_game?.role_in_team ? `\nTeam Role: ${data.strategy.mid_game.role_in_team}` : '',
          
          '\n🌕 Late Game:',
          data.strategy?.late_game?.approach || '',
          data.strategy?.late_game?.win_condition ? `\nWin Condition: ${data.strategy.late_game.win_condition}` : ''
        ].filter(Boolean).join('\n');

        return {
          items: data.items || [],
          runes: data.runes || [],
          explanation: strategyText,
          forChampion: playerChampion,
          forRole: playerRole,
          strategy: data.strategy || {},
          team_analysis: data.team_analysis || {},
          build_order: data.build_order || {}
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