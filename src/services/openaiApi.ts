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
        throw new Error(errorData.error || `Erreur API: ${response.status}`);
      } catch (e) {
        throw new Error(`Erreur API: ${response.status}`);
      }
    }
    return response;
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
};

// Format de réponse optimisé pour l'analyse de composition
const RESPONSE_FORMAT = {
  items: [{
    id: "string",
    name: "string",
    description: "string",
    gold: "number",
    mythic: "boolean"
  }],
  runes: [{
    id: "string",
    name: "string",
    description: "string",
    type: "string",
    path: "string"
  }],
  analyse_equipe: {
    forces_allies: ["string"],
    menaces_ennemies: ["string"],
    profil_degats: {
      allies: "string",
      ennemis: "string"
    }
  },
  strategie: {
    debut_partie: {
      approche: "string",
      pics_puissance: ["string"],
      pattern_trade: "string"
    },
    milieu_partie: {
      approche: "string",
      role_equipe: "string"
    },
    fin_partie: {
      approche: "string",
      condition_victoire: "string"
    }
  },
  ordre_build: {
    depart: {
      objets: [{
        id: "string",
        nom: "string",
        raison: "string"
      }],
      timing: "string"
    },
    premier_retour: {
      or_ideal: "number",
      objets_prioritaires: [{
        id: "string",
        nom: "string",
        raison: "string"
      }],
      variations: {
        avance: "string",
        egal: "string",
        retard: "string"
      }
    },
    objets_cles: {
      sequence: ["string"],
      explications: "string"
    },
    objets_situationnels: [{
      id: "string",
      quand: "string",
      remplace: "string"
    }]
  }
};

// Template de prompt en français
const FRENCH_PROMPT_TEMPLATE = (championName: string, role: string, allies: string, enemies: string, patch: string) => `
Générer une recommandation de build League of Legends Saison 15 (patch ${patch}) pour ${championName} au ${role}.

Composition des équipes:
- Alliés: ${allies}
- Ennemis: ${enemies}

Analyser et générer:
1. Analyse de la composition d'équipe
   - Forces de l'équipe alliée
   - Menaces de l'équipe ennemie
   - Profil de dégâts des deux équipes
   - Adaptations nécessaires du build

2. Build détaillé par phase
   - Objets de départ et timing
   - Premier retour et objets prioritaires
   - Progression des objets clés
   - Adaptations situationnelles

3. Stratégie de jeu
   - Pattern de trade en lane
   - Objectifs par phase de jeu
   - Rôle dans les teamfights
   - Condition de victoire

Format de réponse attendu:
${JSON.stringify(RESPONSE_FORMAT, null, 2)}

Instructions spécifiques:
- Prioriser les objets qui synergisent avec l'équipe
- Adapter le build pour contrer les menaces ennemies
- Inclure des variations selon l'état de la partie
- Expliquer les choix d'objets et les timings clés
`;

export async function generateBuildRecommendation(
  allies: Champion[],
  enemies: Champion[],
  playerChampion: Champion,
  playerRole?: Role
): Promise<BuildRecommendation> {
  try {
    if (!playerChampion) {
      throw new Error("Veuillez d'abord sélectionner votre champion");
    }
    if (!allies?.length || !enemies?.length) {
      throw new Error("Veuillez ajouter des champions aux deux équipes");
    }

    // Vérification de la santé de l'API
    const healthCheck = await fetchWithRetry(apiUrl('/health'), { method: 'GET' });
    if (!healthCheck.ok) {
      throw new Error('Le service de recommandation est indisponible');
    }

    const allyComposition = allies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ');
    const enemyComposition = enemies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ');

    const prompt = FRENCH_PROMPT_TEMPLATE(
      playerChampion.name,
      playerRole || 'flex',
      allyComposition,
      enemyComposition,
      import.meta.env.VITE_DDRAGON_VERSION
    );

    const response = await fetchWithRetry(apiUrl('/build-recommendation'), {
      method: 'POST',
      body: JSON.stringify({
        allies,
        enemies,
        playerChampion,
        playerRole,
        prompt,
        language: 'fr'
      })
    });

    const data = await response.json();

    // Construction de l'explication en français
    const explanation = [
      '📊 Analyse de la composition :',
      '\nForces de l\'équipe :',
      ...(data.analyse_equipe?.forces_allies?.map((s: string) => `• ${s}`) || []),
      '\nMenaces ennemies :',
      ...(data.analyse_equipe?.menaces_ennemies?.map((s: string) => `• ${s}`) || []),
      '\nProfil de dégâts :',
      `• Équipe alliée : ${data.analyse_equipe?.profil_degats?.allies || ''}`,
      `• Équipe ennemie : ${data.analyse_equipe?.profil_degats?.ennemis || ''}`,
      
      '\n🌅 Début de partie :',
      data.strategie?.debut_partie?.approche || '',
      data.strategie?.debut_partie?.pattern_trade ? `\nPattern de trade : ${data.strategie.debut_partie.pattern_trade}` : '',
      
      '\n🌤️ Milieu de partie :',
      data.strategie?.milieu_partie?.approche || '',
      data.strategie?.milieu_partie?.role_equipe ? `\nRôle en équipe : ${data.strategie.milieu_partie.role_equipe}` : '',
      
      '\n🌕 Fin de partie :',
      data.strategie?.fin_partie?.approche || '',
      data.strategie?.fin_partie?.condition_victoire ? `\nCondition de victoire : ${data.strategie.fin_partie.condition_victoire}` : ''
    ].filter(Boolean).join('\n');

    return {
      items: data.items || [],
      runes: data.runes || [],
      explanation,
      forChampion: playerChampion,
      forRole: playerRole,
      strategy: {
        early_game: {
          approach: data.strategie?.debut_partie?.approche,
          power_spikes: data.strategie?.debut_partie?.pics_puissance,
          trading_pattern: data.strategie?.debut_partie?.pattern_trade
        },
        mid_game: {
          approach: data.strategie?.milieu_partie?.approche,
          role_in_team: data.strategie?.milieu_partie?.role_equipe
        },
        late_game: {
          approach: data.strategie?.fin_partie?.approche,
          win_condition: data.strategie?.fin_partie?.condition_victoire
        }
      },
      team_analysis: {
        ally_strengths: data.analyse_equipe?.forces_allies || [],
        enemy_threats: data.analyse_equipe?.menaces_ennemies || [],
        damage_distribution: {
          allied: data.analyse_equipe?.profil_degats?.allies,
          enemy: data.analyse_equipe?.profil_degats?.ennemis
        }
      },
      build_order: {
        starting_phase: {
          items: data.ordre_build?.depart?.objets?.map((item: any) => ({
            id: item.id,
            name: item.nom,
            description: item.raison,
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`
          })) || [],
          timing: data.ordre_build?.depart?.timing || "0:00",
          adaptations: {
            matchup_specific: "",
            team_comp: ""
          }
        },
        early_phase: {
          first_back: {
            ideal_gold: data.ordre_build?.premier_retour?.or_ideal || 1300,
            priority_items: data.ordre_build?.premier_retour?.objets_prioritaires?.map((item: any) => ({
              id: item.id,
              name: item.nom,
              description: item.raison,
              imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`
            })) || [],
            variations: {
              ahead: data.ordre_build?.premier_retour?.variations?.avance,
              even: data.ordre_build?.premier_retour?.variations?.egal,
              behind: data.ordre_build?.premier_retour?.variations?.retard
            }
          },
          core_progression: data.ordre_build?.objets_cles?.sequence || []
        },
        mid_phase: {
          mythic_timing: "",
          core_items: [],
          objectives_focus: "",
          team_adaptations: ""
        },
        late_phase: {
          final_build: [],
          situational_choices: data.ordre_build?.objets_situationnels?.map((item: any) => ({
            id: item.id,
            name: item.nom,
            description: "",
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`,
            when: item.quand,
            instead_of: item.remplace
          })) || [],
          win_condition_items: ""
        }
      }
    };
  } catch (error) {
    console.error('Erreur de recommandation de build:', error);
    throw error;
  }
}