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

// Get current patch version
const getCurrentPatch = () => {
  return import.meta.env.VITE_DDRAGON_VERSION || '15.5.1';
};

// Get current season
const getCurrentSeason = () => {
  const currentDate = new Date();
  return currentDate.getFullYear() - 2010;
};

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
const promptTemplates: Record<SupportedLanguage, (championName: string, role: string, patch: string, season: number) => string> = {
  en: (championName, role, patch, season) => 
    `Generate a focused League of Legends Season ${season} build recommendation for ${championName} (${role}) in patch ${patch}.`,
  fr: (championName, role, patch, season) => 
    `Générez une recommandation de build League of Legends Saison ${season} pour ${championName} (${role}) dans la version ${patch}. Expliquez en détail les synergies d'équipe et comment le build s'adapte à la composition adverse.`,
  es: (championName, role, patch, season) => 
    `Genera una recomendación de build de League of Legends Temporada ${season} para ${championName} (${role}) en el parche ${patch}.`,
  ko: (championName, role, patch, season) => 
    `시즌 ${season} ${championName} (${role}) 빌드 추천을 생성합니다. 패치 ${patch}.`
};

const contextTemplates: Record<SupportedLanguage, {
  allies: string;
  enemies: string;
  guidelines: string[];
  teamAnalysis: {
    composition: string;
    synergies: string;
    threats: string;
    buildAdaptation: string;
  };
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
    ],
    teamAnalysis: {
      composition: "Team Composition Analysis",
      synergies: "Team Synergies",
      threats: "Enemy Threats",
      buildAdaptation: "Build Adaptation"
    }
  },
  fr: {
    allies: "Alliés",
    enemies: "Ennemis",
    guidelines: [
      "Concentrez-vous sur les changements d'objets de la Saison actuelle",
      "Analysez les synergies de composition d'équipe",
      "Adaptez l'ordre de construction selon les menaces ennemies",
      "Optimisez pour les exigences du rôle",
      "Incluez les objets principaux et situationnels"
    ],
    teamAnalysis: {
      composition: "Analyse de la Composition",
      synergies: "Synergies d'Équipe",
      threats: "Menaces Ennemies",
      buildAdaptation: "Adaptation du Build"
    }
  },
  es: {
    allies: "Aliados",
    enemies: "Enemigos",
    guidelines: [
      "Enfócate en los cambios de objetos de la Temporada actual",
      "Considera las sinergias de la composición del equipo",
      "Adapta el orden de construcción según las amenazas enemigas",
      "Optimiza para los requisitos del rol",
      "Incluye objetos principales y situacionales"
    ],
    teamAnalysis: {
      composition: "Análisis de Composición",
      synergies: "Sinergias de Equipo",
      threats: "Amenazas Enemigas",
      buildAdaptation: "Adaptación del Build"
    }
  },
  ko: {
    allies: "아군",
    enemies: "적군",
    guidelines: [
      "현재 시즌 아이템 변경 사항에 집중",
      "팀 구성 시너지 고려",
      "적의 위협에 따른 빌드 순서 조정",
      "역할 요구 사항에 맞게 최적화",
      "핵심 아이템과 상황별 선택"
    ],
    teamAnalysis: {
      composition: "팀 구성 분석",
      synergies: "팀 시너지",
      threats: "적 위협",
      buildAdaptation: "빌드 적응"
    }
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

    // Get current patch and season
    const currentPatch = getCurrentPatch();
    const currentSeason = getCurrentSeason();

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
      const currentLang = (i18n.language as SupportedLanguage) || 'fr';
      const templates = contextTemplates[currentLang];
      
      // Create language-specific prompt with current patch and season
      const prompt = `${promptTemplates[currentLang](playerChampion.name, playerRole || 'flex', currentPatch, currentSeason)}

Context:
- ${templates.allies}: ${allies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ')}
- ${templates.enemies}: ${enemies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ')}

${templates.teamAnalysis.composition}:
- Analysez en détail la composition de chaque équipe
- Identifiez le style de jeu principal (engage, poke, split-push, etc.)
- Évaluez la répartition des dégâts (magique/physique)

${templates.teamAnalysis.synergies}:
- Expliquez les synergies entre votre champion et vos alliés
- Identifiez les combos potentiels
- Détaillez comment le build renforce ces synergies

${templates.teamAnalysis.threats}:
- Analysez les menaces principales de l'équipe ennemie
- Identifiez les contre-mesures nécessaires
- Expliquez comment le build aide à contrer ces menaces

${templates.teamAnalysis.buildAdaptation}:
- Justifiez chaque choix d'item en fonction de la composition
- Expliquez l'ordre de construction optimal
- Proposez des variations selon l'évolution de la partie

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
            language: currentLang,
            patch: currentPatch,
            season: currentSeason
          })
        }, 2, 500);

        const data = await response.json();
        
        // Build the explanation string with all available strategy information
        const strategyText = [
          '📊 Team Analysis:',
          data.team_analysis?.ally_strengths?.length > 0 ? '\nForces de l\'équipe :' : '',
          ...(data.team_analysis?.ally_strengths?.map((s: string) => `• ${s}`) || []),
          data.team_analysis?.enemy_threats?.length > 0 ? '\nMenaces ennemies :' : '',
          ...(data.team_analysis?.enemy_threats?.map((t: string) => `• ${t}`) || []),
          '\nRépartition des dégâts :',
          data.team_analysis?.damage_distribution?.allied ? `• Équipe alliée : ${data.team_analysis.damage_distribution.allied}` : '',
          data.team_analysis?.damage_distribution?.enemy ? `• Équipe ennemie : ${data.team_analysis.damage_distribution.enemy}` : '',
          
          '\n🌅 Early Game:',
          data.strategy?.early_game?.approach || '',
          data.strategy?.early_game?.trading_pattern ? `\nPattern de trade : ${data.strategy.early_game.trading_pattern}` : '',
          data.strategy?.early_game?.power_spikes?.length > 0 ? '\nPower Spikes :' : '',
          ...(data.strategy?.early_game?.power_spikes?.map((s: string) => `• ${s}`) || []),
          
          '\n🌤️ Mid Game:',
          data.strategy?.mid_game?.approach || '',
          data.strategy?.mid_game?.role_in_team ? `\nRôle en équipe : ${data.strategy.mid_game.role_in_team}` : '',
          
          '\n🌕 Late Game:',
          data.strategy?.late_game?.approach || '',
          data.strategy?.late_game?.win_condition ? `\nCondition de victoire : ${data.strategy.late_game.win_condition}` : ''
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