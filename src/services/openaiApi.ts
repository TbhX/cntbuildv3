import type { BuildRecommendation, Champion, Role } from '../types';
import { SupportedLanguage } from '../components/LanguageSelector';
import i18n from '../i18n';

// Language configuration
const languages = {
  en: {
    name: 'English',
    flag: 'https://flagcdn.com/w80/gb.png',
    flagAlt: 'UK flag',
    locale: 'en-US'
  },
  fr: {
    name: 'Français',
    flag: 'https://flagcdn.com/w80/fr.png',
    flagAlt: 'French flag',
    locale: 'fr-FR'
  },
  es: {
    name: 'Español',
    flag: 'https://flagcdn.com/w80/es.png',
    flagAlt: 'Spanish flag',
    locale: 'es-ES'
  },
  ko: {
    name: '한국어',
    flag: 'https://flagcdn.com/w80/kr.png',
    flagAlt: 'South Korean flag',
    locale: 'ko-KR'
  }
} as const;

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

// Translations for prompt templates
const promptTemplates: Record<SupportedLanguage, (championName: string, role: string) => string> = {
  en: (championName, role) => `Generate a focused League of Legends Season 14 build recommendation for ${championName} (${role}) in patch ${import.meta.env.VITE_DDRAGON_VERSION}.`,
  fr: (championName, role) => `Générez une recommandation de build League of Legends Saison 14 pour ${championName} (${role}) dans la version ${import.meta.env.VITE_DDRAGON_VERSION}.`,
  es: (championName, role) => `Genera una recomendación de build de League of Legends Temporada 14 para ${championName} (${role}) en el parche ${import.meta.env.VITE_DDRAGON_VERSION}.`,
  ko: (championName, role) => `시즌 14 ${championName} (${role}) 빌드 추천을 생성합니다. 패치 ${import.meta.env.VITE_DDRAGON_VERSION}.`
};

const contextTemplates: Record<SupportedLanguage, {
  allies: string;
  enemies: string;
  guidelines: string[];
}> = {
  en: {
    allies: "Allies",
    enemies: "Enemies",
    guidelines: [
      "Focus on Season 14 item changes and new build paths",
      "Consider team composition synergies and counter-building",
      "Adapt build order based on enemy threats and team needs",
      "Optimize for role requirements",
      "Include core items and situational choices"
    ]
  },
  fr: {
    allies: "Alliés",
    enemies: "Ennemis",
    guidelines: [
      "Concentrez-vous sur les changements d'objets de la Saison 14",
      "Tenez compte des synergies de composition d'équipe",
      "Adaptez l'ordre de construction selon les menaces ennemies",
      "Optimisez pour les exigences du rôle",
      "Incluez les objets principaux et situationnels"
    ]
  },
  es: {
    allies: "Aliados",
    enemies: "Enemigos",
    guidelines: [
      "Enfócate en los cambios de objetos de la Temporada 14",
      "Considera las sinergias de la composición del equipo",
      "Adapta el orden de construcción según las amenazas enemigas",
      "Optimiza para los requisitos del rol",
      "Incluye objetos principales y situacionales"
    ]
  },
  ko: {
    allies: "아군",
    enemies: "적군",
    guidelines: [
      "시즌 14 아이템 변경 사항과 새로운 빌드 경로에 집중",
      "팀 구성 시너지와 카운터 빌드 고려",
      "적의 위협과 팀 요구 사항에 따라 빌드 순서 조정",
      "역할 요구 사항에 맞게 최적화",
      "핵심 아이템과 상황별 선택 포함"
    ]
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
      const currentLang = (i18n.language as SupportedLanguage) || 'en';
      const templates = contextTemplates[currentLang];
      
      // Create language-specific prompt
      const prompt = `${promptTemplates[currentLang](playerChampion.name, playerRole || 'flex')}

Context:
- ${templates.allies}: ${allies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ')}
- ${templates.enemies}: ${enemies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ')}

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
${templates.guidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Keep responses concise and focused on actionable insights.
Please respond in ${currentLang === 'en' ? 'English' : languages[currentLang].name}.`;

      try {
        const response = await fetchWithRetry(apiUrl('/build-recommendation'), {
          method: 'POST',
          body: JSON.stringify({
            allies,
            enemies,
            playerChampion,
            playerRole,
            prompt,
            language: currentLang
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