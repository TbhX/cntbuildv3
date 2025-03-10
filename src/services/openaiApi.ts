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

// Format de réponse optimisé avec analyse de composition
const RESPONSE_FORMAT = {
  team_analysis: {
    composition: {
      ally_strengths: ["string"],
      enemy_threats: ["string"],
      damage_profile: {
        ally: "string",
        enemy: "string"
      }
    },
    build_adaptation: {
      offensive: "string",
      defensive: "string",
      utility: "string"
    },
    synergies: {
      team_synergies: ["string"],
      counter_strategies: ["string"]
    }
  },
  build_order: {
    starting: {
      items: [{ id: "string", name: "string", reason: "string" }],
      gold: "number",
      timing: "string"
    },
    early: {
      items: [{ id: "string", name: "string", reason: "string" }],
      gold: "number",
      power_spike: "string"
    },
    mid: {
      items: [{ id: "string", name: "string", reason: "string" }],
      gold: "number",
      objectives: "string"
    },
    late: {
      items: [{ id: "string", name: "string", reason: "string" }],
      situational: [{ id: "string", when: "string" }]
    }
  },
  runes: [{ id: "string", name: "string" }]
};

// Templates de prompt optimisés avec focus sur la composition
const promptTemplates: Record<SupportedLanguage, (data: {
  champion: string,
  role: string,
  allies: string,
  enemies: string,
  patch: string
}) => string> = {
  fr: (data) => `Build LoL S15 ${data.patch} pour ${data.champion} ${data.role}
Alliés: ${data.allies}
Ennemis: ${data.enemies}

Analyser et générer:
1. Analyse de la composition d'équipe
   - Forces alliées et menaces ennemies
   - Profil de dégâts des deux équipes
   - Adaptations du build nécessaires
2. Build par phase avec justifications
   - Choix des objets selon la composition
   - Timing des power spikes
3. Synergies d'équipe et contre-stratégies

Format: ${JSON.stringify(RESPONSE_FORMAT)}`,

  en: (data) => `LoL S15 ${data.patch} build for ${data.champion} ${data.role}
Allies: ${data.allies}
Enemies: ${data.enemies}

Analyze and generate:
1. Team composition analysis
   - Allied strengths and enemy threats
   - Damage profile of both teams
   - Required build adaptations
2. Phase-based build with justifications
   - Item choices based on composition
   - Power spike timing
3. Team synergies and counter-strategies

Format: ${JSON.stringify(RESPONSE_FORMAT)}`,

  es: (data) => `Build LoL S15 ${data.patch} para ${data.champion} ${data.role}
Aliados: ${data.allies}
Enemigos: ${data.enemies}

Analizar y generar:
1. Análisis de composición de equipo
   - Fortalezas aliadas y amenazas enemigas
   - Perfil de daño de ambos equipos
   - Adaptaciones necesarias del build
2. Build por fase con justificaciones
   - Elección de objetos según composición
   - Timing de power spikes
3. Sinergias de equipo y contra-estrategias

Format: ${JSON.stringify(RESPONSE_FORMAT)}`,

  ko: (data) => `LoL S15 ${data.patch} ${data.champion} ${data.role} 빌드
아군: ${data.allies}
적군: ${data.enemies}

분석 및 생성:
1. 팀 구성 분석
   - 아군 강점과 적군 위협
   - 양팀 데미지 프로필
   - 필요한 빌드 적응
2. 단계별 빌드 및 근거
   - 팀 구성 기반 아이템 선택
   - 파워 스파이크 타이밍
3. 팀 시너지와 대응 전략

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
    
    const allyComposition = allies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ');
    const enemyComposition = enemies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ');
    
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
    
    // Construction de l'explication détaillée
    const compositionAnalysis = [
      '📊 Analyse de la composition :',
      '\nForces de l\'équipe :',
      ...(data.team_analysis?.composition?.ally_strengths?.map((s: string) => `• ${s}`) || []),
      '\nMenaces ennemies :',
      ...(data.team_analysis?.composition?.enemy_threats?.map((s: string) => `• ${s}`) || []),
      '\nProfil de dégâts :',
      `• Équipe alliée : ${data.team_analysis?.composition?.damage_profile?.ally || ''}`,
      `• Équipe ennemie : ${data.team_analysis?.composition?.damage_profile?.enemy || ''}`,
      '\n💫 Adaptations du build :',
      `• Offensif : ${data.team_analysis?.build_adaptation?.offensive || ''}`,
      `• Défensif : ${data.team_analysis?.build_adaptation?.defensive || ''}`,
      `• Utilitaire : ${data.team_analysis?.build_adaptation?.utility || ''}`,
      '\n🤝 Synergies d\'équipe :',
      ...(data.team_analysis?.synergies?.team_synergies?.map((s: string) => `• ${s}`) || []),
      '\n⚔️ Contre-stratégies :',
      ...(data.team_analysis?.synergies?.counter_strategies?.map((s: string) => `• ${s}`) || []),
      '\n🌅 Début de partie :',
      data.strategy?.early || '',
      '\n🌤️ Milieu de partie :',
      data.strategy?.mid || '',
      '\n🌕 Fin de partie :',
      data.strategy?.late || ''
    ].filter(Boolean).join('\n');

    // Transformation de la réponse avec les phases de build
    const buildOrder = {
      starting_phase: {
        items: data.build_order?.starting?.items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          reason: item.reason
        })) || [],
        timing: data.build_order?.starting?.timing || "0:00",
        adaptations: {
          matchup_specific: data.build_order?.starting?.adaptations || "",
          team_comp: data.build_order?.starting?.team_adaptations || ""
        }
      },
      early_phase: {
        first_back: {
          ideal_gold: data.build_order?.early?.gold || 1300,
          priority_items: data.build_order?.early?.items?.map((item: any) => ({
            id: item.id,
            name: item.name,
            reason: item.reason
          })) || [],
          variations: {
            ahead: data.build_order?.early?.variations?.ahead || "",
            even: data.build_order?.early?.variations?.even || "",
            behind: data.build_order?.early?.variations?.behind || ""
          }
        },
        core_progression: data.build_order?.early?.progression || []
      },
      mid_phase: {
        mythic_timing: data.build_order?.mid?.timing || "",
        core_items: data.build_order?.mid?.items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          reason: item.reason
        })) || [],
        objectives_focus: data.build_order?.mid?.objectives || "",
        team_adaptations: data.build_order?.mid?.team_adaptations || ""
      },
      late_phase: {
        final_build: data.build_order?.late?.items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          reason: item.reason
        })) || [],
        situational_choices: data.build_order?.late?.situational?.map((item: any) => ({
          id: item.id,
          name: item.name,
          when: item.when
        })) || [],
        win_condition_items: data.build_order?.late?.win_condition || ""
      }
    };

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
      explanation: compositionAnalysis,
      forChampion: playerChampion,
      forRole: playerRole,
      strategy: {
        early_game: { 
          approach: data.strategy?.early,
          power_spikes: data.build_order?.early?.power_spike?.split(','),
          trading_pattern: data.team_analysis?.build_adaptation?.offensive
        },
        mid_game: { 
          approach: data.strategy?.mid,
          role_in_team: data.team_analysis?.build_adaptation?.utility
        },
        late_game: { 
          approach: data.strategy?.late,
          win_condition: data.build_order?.late?.win_condition
        }
      },
      team_analysis: {
        ally_strengths: data.team_analysis?.composition?.ally_strengths || [],
        enemy_threats: data.team_analysis?.composition?.enemy_threats || [],
        damage_distribution: {
          allied: data.team_analysis?.composition?.damage_profile?.ally,
          enemy: data.team_analysis?.composition?.damage_profile?.enemy
        }
      },
      build_order: buildOrder
    };
  } catch (error) {
    console.error('Build recommendation error:', error);
    throw error;
  }
}