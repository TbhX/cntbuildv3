import type { BuildRecommendation, Champion, Role, ApiResponse } from '../types';

// Get the base API URL based on environment
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || '/api';
};

// Helper to create full API URLs
const apiUrl = (endpoint: string) => `${getApiBaseUrl()}${endpoint}`;

// Add error handling and retry logic with timeout
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 300): Promise<Response> => {
  const controller = new AbortController();
  const timeout = 90000; // 90 seconds timeout
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      ...options.headers,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Erreur API: ${response.status} ${response.statusText}`);
      } catch (e) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La requête a pris trop de temps. Veuillez réessayer.');
    }
    
    if (retries <= 1) {
      throw new Error(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
    
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
};

// French prompt template
const FRENCH_PROMPT_TEMPLATE = (
  championName: string,
  role: string,
  allyComposition: string,
  enemyComposition: string,
  version: string
): string => `
Générez un build LoL S15 pour ${championName} (${role}), version ${version}.

Équipes :
- Alliés : ${allyComposition}
- Ennemis : ${enemyComposition}

Structure JSON requise :
{
  "items": [{"id": "string", "name": "string", "description": "string", "gold": number}],
  "runes": [{"id": "string", "name": "string", "description": "string", "type": "keystone" | "primary" | "secondary"}],
  "strategie": {
    "debut_partie": {
      "approche": "string",
      "pics_puissance": ["string"],
      "pattern_trade": "string"
    },
    "milieu_partie": {
      "approche": "string",
      "role_equipe": "string"
    },
    "fin_partie": {
      "approche": "string",
      "condition_victoire": "string"
    }
  },
  "analyse_equipe": {
    "forces_allies": ["string"],
    "menaces_ennemies": ["string"],
    "profil_degats": {
      "allies": "string",
      "ennemis": "string"
    }
  },
  "ordre_items": {
    "phase_depart": {
      "items": [{"id": "string", "name": "string", "raison": "string"}],
      "timing": "string",
      "adaptations": {
        "matchup": "string",
        "composition": "string"
      }
    },
    "phase_precoce": {
      "premier_retour": {
        "or_ideal": number,
        "items_prioritaires": [{"id": "string", "name": "string", "raison": "string"}],
        "variations": {
          "avance": "string",
          "egal": "string",
          "retard": "string"
        }
      },
      "progression_core": ["string"]
    },
    "phase_mid": {
      "timing_mythique": "string",
      "items_core": [{"id": "string", "name": "string", "raison": "string"}],
      "focus_objectifs": "string",
      "adaptations_equipe": "string"
    },
    "phase_fin": {
      "build_final": [{"id": "string", "name": "string", "raison": "string"}],
      "choix_situationnels": [{"id": "string", "name": "string", "quand": "string", "remplace": "string"}],
      "items_condition_victoire": "string"
    }
  }
}

Instructions :
1. Priorisez les changements de la S15
2. Tenez compte des synergies et menaces
3. Adaptez l'ordre des items au matchup
4. Répondez en JSON valide et en français`;

// Main build recommendation function
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

    const allyComposition = allies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ');
    const enemyComposition = enemies.map(c => `${c.name}${c.role ? ` (${c.role})` : ''}`).join(', ');

    const response = await fetchWithRetry(apiUrl('/build-recommendation'), {
      method: 'POST',
      body: JSON.stringify({
        allies,
        enemies,
        playerChampion,
        playerRole,
        prompt: FRENCH_PROMPT_TEMPLATE(
          playerChampion.name,
          playerRole || 'flex',
          allyComposition,
          enemyComposition,
          import.meta.env.VITE_DDRAGON_VERSION
        ),
        language: 'fr'
      })
    });

    const data = await response.json() as ApiResponse<any>;

    if (!data || !data.data) {
      throw new Error("Réponse invalide du serveur");
    }

    // Format the response data
    const formattedItems = (data.data?.items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      gold: item.gold || 0,
      mythic: item.mythic || false,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`
    }));

    const formattedRunes = (data.data?.runes || []).map((rune: any) => ({
      id: rune.id,
      name: rune.name,
      description: rune.description || '',
      type: rune.type || 'primary',
      path: rune.path || 'precision',
      imageUrl: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/${rune.id}.png`
    }));

    // Build the explanation string
    const explanation = [
      '📊 Analyse de la composition :',
      '\nForces de l\'équipe :',
      ...(data.data?.analyse_equipe?.forces_allies?.map((s: string) => `• ${s}`) || []),
      '\nMenaces ennemies :',
      ...(data.data?.analyse_equipe?.menaces_ennemies?.map((s: string) => `• ${s}`) || []),
      '\nProfil de dégâts :',
      `• Équipe alliée : ${data.data?.analyse_equipe?.profil_degats?.allies || ''}`,
      `• Équipe ennemie : ${data.data?.analyse_equipe?.profil_degats?.ennemis || ''}`,
      
      '\n🌅 Début de partie :',
      data.data?.strategie?.debut_partie?.approche || '',
      data.data?.strategie?.debut_partie?.pattern_trade ? `\nPattern de trade : ${data.data.strategie.debut_partie.pattern_trade}` : '',
      
      '\n🌤️ Milieu de partie :',
      data.data?.strategie?.milieu_partie?.approche || '',
      data.data?.strategie?.milieu_partie?.role_equipe ? `\nRôle en équipe : ${data.data.strategie.milieu_partie.role_equipe}` : '',
      
      '\n🌕 Fin de partie :',
      data.data?.strategie?.fin_partie?.approche || '',
      data.data?.strategie?.fin_partie?.condition_victoire ? `\nCondition de victoire : ${data.data.strategie.fin_partie.condition_victoire}` : ''
    ].filter(Boolean).join('\n');

    return {
      items: formattedItems,
      runes: formattedRunes,
      explanation,
      forChampion: playerChampion,
      forRole: playerRole,
      strategy: {
        early_game: {
          approach: data.data?.strategie?.debut_partie?.approche || '',
          power_spikes: data.data?.strategie?.debut_partie?.pics_puissance || [],
          trading_pattern: data.data?.strategie?.debut_partie?.pattern_trade || ''
        },
        mid_game: {
          approach: data.data?.strategie?.milieu_partie?.approche || '',
          role_in_team: data.data?.strategie?.milieu_partie?.role_equipe || ''
        },
        late_game: {
          approach: data.data?.strategie?.fin_partie?.approche || '',
          win_condition: data.data?.strategie?.fin_partie?.condition_victoire || ''
        }
      },
      team_analysis: {
        ally_strengths: data.data?.analyse_equipe?.forces_allies || [],
        enemy_threats: data.data?.analyse_equipe?.menaces_ennemies || [],
        damage_distribution: {
          allied: data.data?.analyse_equipe?.profil_degats?.allies || '',
          enemy: data.data?.analyse_equipe?.profil_degats?.ennemis || ''
        }
      },
      build_order: {
        starting_phase: {
          items: data.data?.ordre_items?.phase_depart?.items?.map((item: any) => ({
            id: item.id || '',
            name: item.name || '',
            description: item.description || '',
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`,
            reason: item.raison || ''
          })) || [],
          timing: data.data?.ordre_items?.phase_depart?.timing || '',
          adaptations: {
            matchup_specific: data.data?.ordre_items?.phase_depart?.adaptations?.matchup || '',
            team_comp: data.data?.ordre_items?.phase_depart?.adaptations?.composition || ''
          }
        },
        early_phase: {
          first_back: {
            ideal_gold: data.data?.ordre_items?.phase_precoce?.premier_retour?.or_ideal || 0,
            priority_items: data.data?.ordre_items?.phase_precoce?.premier_retour?.items_prioritaires?.map((item: any) => ({
              id: item.id || '',
              name: item.name || '',
              description: item.description || '',
              imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`,
              reason: item.raison || ''
            })) || [],
            variations: {
              ahead: data.data?.ordre_items?.phase_precoce?.premier_retour?.variations?.avance || '',
              even: data.data?.ordre_items?.phase_precoce?.premier_retour?.variations?.egal || '',
              behind: data.data?.ordre_items?.phase_precoce?.premier_retour?.variations?.retard || ''
            }
          },
          core_progression: data.data?.ordre_items?.phase_precoce?.progression_core || []
        },
        mid_phase: {
          mythic_timing: data.data?.ordre_items?.phase_mid?.timing_mythique || '',
          core_items: data.data?.ordre_items?.phase_mid?.items_core?.map((item: any) => ({
            id: item.id || '',
            name: item.name || '',
            description: item.description || '',
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`,
            reason: item.raison || ''
          })) || [],
          objectives_focus: data.data?.ordre_items?.phase_mid?.focus_objectifs || '',
          team_adaptations: data.data?.ordre_items?.phase_mid?.adaptations_equipe || ''
        },
        late_phase: {
          final_build: data.data?.ordre_items?.phase_fin?.build_final?.map((item: any) => ({
            id: item.id || '',
            name: item.name || '',
            description: item.description || '',
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`,
            reason: item.raison || ''
          })) || [],
          situational_choices: data.data?.ordre_items?.phase_fin?.choix_situationnels?.map((item: any) => ({
            id: item.id || '',
            name: item.name || '',
            description: item.description || '',
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${import.meta.env.VITE_DDRAGON_VERSION}/img/item/${item.id}.png`,
            when: item.quand || '',
            instead_of: item.remplace || ''
          })) || [],
          win_condition_items: data.data?.ordre_items?.phase_fin?.items_condition_victoire || ''
        }
      }
    };
  } catch (error) {
    console.error('Erreur de recommandation de build:', error);
    throw error instanceof Error ? error : new Error('Une erreur inattendue est survenue');
  }
}