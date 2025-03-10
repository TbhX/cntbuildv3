import type { BuildRecommendation, Champion, Role } from '../types';
import { SupportedLanguage } from '../components/LanguageSelector';
import i18n from '../i18n';

const getApiBaseUrl = () => import.meta.env.VITE_API_URL;
const apiUrl = (endpoint: string) => `${getApiBaseUrl()}${endpoint}`;

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 300) => {
  const fetchOptions = {
    ...options,
    headers: {
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
        throw new Error(errorData.error || `API error: ${response.status}`);
      } catch (e) {
        throw new Error(`API error: ${response.status}`);
      }
    }
    return response;
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
};

// Compact JSON structure for response format (~100 tokens)
const RESPONSE_FORMAT = {
  items: [{ id: "string", name: "string" }],
  runes: [{ id: "string", name: "string" }],
  strategy: {
    early: "string",
    mid: "string",
    late: "string"
  },
  analysis: {
    allies: ["string"],
    enemies: ["string"]
  }
};

// Optimized prompt templates (~200-300 tokens total including team comps)
const promptTemplates: Record<SupportedLanguage, (data: {
  champion: string,
  role: string,
  allies: string,
  enemies: string,
  patch: string
}) => string> = {
  fr: (data) => `Recommandation build LoL S15 patch ${data.patch}
Champion: ${data.champion} ${data.role}
Alliés: ${data.allies}
Ennemis: ${data.enemies}

Générer build optimal avec:
1. 6 objets dans l'ordre
2. 4 runes principales
3. Stratégie courte par phase
4. Analyse équipe concise

Format: ${JSON.stringify(RESPONSE_FORMAT)}`,

  en: (data) => `LoL S15 patch ${data.patch} build recommendation
Champion: ${data.champion} ${data.role}
Allies: ${data.allies}
Enemies: ${data.enemies}

Generate optimal build with:
1. 6 items in order
2. 4 main runes
3. Brief phase strategy
4. Quick team analysis

Format: ${JSON.stringify(RESPONSE_FORMAT)}`,

  es: (data) => `Recomendación build LoL S15 parche ${data.patch}
Campeón: ${data.champion} ${data.role}
Aliados: ${data.allies}
Enemigos: ${data.enemies}

Generar build óptimo con:
1. 6 objetos en orden
2. 4 runas principales
3. Estrategia breve por fase
4. Análisis equipo conciso

Format: ${JSON.stringify(RESPONSE_FORMAT)}`,

  ko: (data) => `LoL S15 패치 ${data.patch} 빌드 추천
챔피언: ${data.champion} ${data.role}
아군: ${data.allies}
적군: ${data.enemies}

최적 빌드 생성:
1. 6개 아이템 순서
2. 4개 주요 룬
3. 간단한 단계별 전략
4. 간단한 팀 분석

Format: ${JSON.stringify(RESPONSE_FORMAT)}`
};

export async function generateBuildRecommendation(
  allies: Champion[],
  enemies: Champion[],
  playerChampion: Champion,
  playerRole?: Role
): Promise<BuildRecommendation> {
  try {
    if (!playerChampion) throw new Error("Please select your champion first");
    if (!allies?.length || !enemies?.length) throw new Error("Please add champions to both teams");

    const healthCheck = await fetchWithRetry(apiUrl('/health'), { method: 'GET' });
    if (!healthCheck.ok) throw new Error('Build recommendation service is unavailable');

    const currentLang = (i18n.language as SupportedLanguage) || 'fr';
    
    // Compact team compositions
    const allyComposition = allies.map(c => c.name).join(',');
    const enemyComposition = enemies.map(c => c.name).join(',');
    
    // Create optimized prompt (~500 tokens total)
    const prompt = promptTemplates[currentLang]({
      champion: playerChampion.name,
      role: playerRole || 'flex',
      allies: allyComposition,
      enemies: enemyComposition,
      patch: import.meta.env.VITE_DDRAGON_VERSION
    });

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
    });

    const data = await response.json();
    
    // Transform response into full format
    return {
      items: data.items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        gold: item.gold || 0,
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`
      })) || [],
      runes: data.runes?.map((rune: any) => ({
        id: rune.id,
        name: rune.name,
        description: rune.description || '',
        imageUrl: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/${rune.id}.png`,
        type: rune.type || 'primary',
        path: rune.path || 'precision'
      })) || [],
      explanation: [
        '📊 Team Analysis:',
        data.analysis?.allies?.map((s: string) => `• ${s}`).join('\n'),
        data.analysis?.enemies?.map((s: string) => `• ${s}`).join('\n'),
        '\n🌅 Early Game:',
        data.strategy?.early || '',
        '\n🌤️ Mid Game:',
        data.strategy?.mid || '',
        '\n🌕 Late Game:',
        data.strategy?.late || ''
      ].filter(Boolean).join('\n'),
      forChampion: playerChampion,
      forRole: playerRole,
      strategy: {
        early_game: { approach: data.strategy?.early },
        mid_game: { approach: data.strategy?.mid },
        late_game: { approach: data.strategy?.late }
      },
      team_analysis: {
        ally_strengths: data.analysis?.allies || [],
        enemy_threats: data.analysis?.enemies || []
      },
      build_order: data.build_order || {}
    };
  } catch (error) {
    console.error('Build recommendation error:', error);
    throw error;
  }
}