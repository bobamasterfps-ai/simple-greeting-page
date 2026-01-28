/**
 * Ability Registry - Single source of truth for all agent abilities
 * 
 * CORE PRINCIPLES:
 * 1. Abilities are AGENT-LOCKED - no cross-agent abilities allowed
 * 2. Each ability has a unique ID tied to visual type
 * 3. Abilities can be filtered by side (attack/defense)
 * 4. Visual types determine how abilities are rendered
 */

export type AbilityType = 'smoke' | 'flash' | 'molly' | 'recon' | 'wall' | 'stun' | 'trap' | 'movement' | 'heal' | 'buff';
export type AbilitySide = 'attack' | 'defense' | 'both';

export interface AbilityDefinition {
  id: string;
  name: string;
  agent: string;
  slot: 'Ability1' | 'Ability2' | 'Grenade' | 'Ultimate';
  type: AbilityType;
  /** Sides where this ability is commonly used (defaults to 'both') */
  usableSides?: AbilitySide[];
  radius?: number;  // 0-1 normalized
  duration?: number; // seconds
  /** Whether ability requires line of sight */
  requiresLineOfSight?: boolean;
  icon?: string;
}

// Complete ability registry indexed by ID
// CRITICAL: All abilities are agent-locked with side-awareness
export const ABILITY_REGISTRY: Record<string, AbilityDefinition> = {
  // ========== BRIMSTONE ==========
  brim_stim: {
    id: 'brim_stim',
    name: 'Stim Beacon',
    agent: 'Brimstone',
    slot: 'Ability1',
    type: 'buff',
    usableSides: ['both'],
    radius: 0.06,
  },
  brim_incendiary: {
    id: 'brim_incendiary',
    name: 'Incendiary',
    agent: 'Brimstone',
    slot: 'Ability2',
    type: 'molly',
    usableSides: ['both'],
    radius: 0.08,
    duration: 8,
  },
  brim_smoke: {
    id: 'brim_smoke',
    name: 'Sky Smoke',
    agent: 'Brimstone',
    slot: 'Grenade',
    type: 'smoke',
    usableSides: ['both'],
    radius: 0.09,
    duration: 19.25,
  },
  brim_orbital: {
    id: 'brim_orbital',
    name: 'Orbital Strike',
    agent: 'Brimstone',
    slot: 'Ultimate',
    type: 'molly',
    usableSides: ['attack'],
    radius: 0.12,
    duration: 4,
  },

  // ========== OMEN ==========
  omen_shrouded: {
    id: 'omen_shrouded',
    name: 'Shrouded Step',
    agent: 'Omen',
    slot: 'Ability1',
    type: 'movement',
  },
  omen_paranoia: {
    id: 'omen_paranoia',
    name: 'Paranoia',
    agent: 'Omen',
    slot: 'Ability2',
    type: 'flash',
  },
  omen_smoke: {
    id: 'omen_smoke',
    name: 'Dark Cover',
    agent: 'Omen',
    slot: 'Grenade',
    type: 'smoke',
    radius: 0.085,
    duration: 15,
  },
  omen_tp: {
    id: 'omen_tp',
    name: 'From the Shadows',
    agent: 'Omen',
    slot: 'Ultimate',
    type: 'movement',
  },

  // ========== VIPER ==========
  viper_wall: {
    id: 'viper_wall',
    name: 'Toxic Screen',
    agent: 'Viper',
    slot: 'Ability1',
    type: 'wall',
  },
  viper_orb: {
    id: 'viper_orb',
    name: 'Poison Cloud',
    agent: 'Viper',
    slot: 'Ability2',
    type: 'smoke',
    radius: 0.08,
  },
  viper_snakebite: {
    id: 'viper_snakebite',
    name: 'Snake Bite',
    agent: 'Viper',
    slot: 'Grenade',
    type: 'molly',
    radius: 0.06,
    duration: 6.5,
  },
  viper_pit: {
    id: 'viper_pit',
    name: "Viper's Pit",
    agent: 'Viper',
    slot: 'Ultimate',
    type: 'smoke',
    radius: 0.15,
  },

  // ========== SOVA ==========
  sova_owl: {
    id: 'sova_owl',
    name: 'Owl Drone',
    agent: 'Sova',
    slot: 'Ability1',
    type: 'recon',
  },
  sova_shock: {
    id: 'sova_shock',
    name: 'Shock Bolt',
    agent: 'Sova',
    slot: 'Ability2',
    type: 'molly',
    radius: 0.04,
  },
  sova_recon: {
    id: 'sova_recon',
    name: 'Recon Bolt',
    agent: 'Sova',
    slot: 'Grenade',
    type: 'recon',
    radius: 0.12,
    duration: 3,
  },
  sova_ult: {
    id: 'sova_ult',
    name: "Hunter's Fury",
    agent: 'Sova',
    slot: 'Ultimate',
    type: 'wall',
  },

  // ========== JETT ==========
  jett_updraft: {
    id: 'jett_updraft',
    name: 'Updraft',
    agent: 'Jett',
    slot: 'Ability1',
    type: 'movement',
  },
  jett_smoke: {
    id: 'jett_smoke',
    name: 'Cloudburst',
    agent: 'Jett',
    slot: 'Ability2',
    type: 'smoke',
    radius: 0.05,
    duration: 4.5,
  },
  jett_dash: {
    id: 'jett_dash',
    name: 'Tailwind',
    agent: 'Jett',
    slot: 'Grenade',
    type: 'movement',
  },
  jett_ult: {
    id: 'jett_ult',
    name: 'Blade Storm',
    agent: 'Jett',
    slot: 'Ultimate',
    type: 'movement',
  },

  // ========== PHOENIX ==========
  phoenix_flash: {
    id: 'phoenix_flash',
    name: 'Curveball',
    agent: 'Phoenix',
    slot: 'Ability1',
    type: 'flash',
  },
  phoenix_wall: {
    id: 'phoenix_wall',
    name: 'Blaze',
    agent: 'Phoenix',
    slot: 'Ability2',
    type: 'wall',
  },
  phoenix_molly: {
    id: 'phoenix_molly',
    name: 'Hot Hands',
    agent: 'Phoenix',
    slot: 'Grenade',
    type: 'molly',
    radius: 0.05,
    duration: 4,
  },
  phoenix_ult: {
    id: 'phoenix_ult',
    name: 'Run it Back',
    agent: 'Phoenix',
    slot: 'Ultimate',
    type: 'movement',
  },

  // ========== BREACH ==========
  breach_aftershock: {
    id: 'breach_aftershock',
    name: 'Aftershock',
    agent: 'Breach',
    slot: 'Ability1',
    type: 'molly',
    radius: 0.04,
  },
  breach_flash: {
    id: 'breach_flash',
    name: 'Flashpoint',
    agent: 'Breach',
    slot: 'Ability2',
    type: 'flash',
  },
  breach_stun: {
    id: 'breach_stun',
    name: 'Fault Line',
    agent: 'Breach',
    slot: 'Grenade',
    type: 'stun',
    radius: 0.08,
  },
  breach_ult: {
    id: 'breach_ult',
    name: 'Rolling Thunder',
    agent: 'Breach',
    slot: 'Ultimate',
    type: 'stun',
    radius: 0.15,
  },

  // ========== SAGE ==========
  sage_slow: {
    id: 'sage_slow',
    name: 'Slow Orb',
    agent: 'Sage',
    slot: 'Ability1',
    type: 'stun',
    radius: 0.07,
    duration: 7,
  },
  sage_heal: {
    id: 'sage_heal',
    name: 'Healing Orb',
    agent: 'Sage',
    slot: 'Ability2',
    type: 'heal',
  },
  sage_wall: {
    id: 'sage_wall',
    name: 'Barrier Orb',
    agent: 'Sage',
    slot: 'Grenade',
    type: 'wall',
  },
  sage_ult: {
    id: 'sage_ult',
    name: 'Resurrection',
    agent: 'Sage',
    slot: 'Ultimate',
    type: 'heal',
  },

  // ========== CYPHER ==========
  cypher_trapwire: {
    id: 'cypher_trapwire',
    name: 'Trapwire',
    agent: 'Cypher',
    slot: 'Ability1',
    type: 'trap',
  },
  cypher_cage: {
    id: 'cypher_cage',
    name: 'Cyber Cage',
    agent: 'Cypher',
    slot: 'Ability2',
    type: 'smoke',
    radius: 0.06,
    duration: 7,
  },
  cypher_cam: {
    id: 'cypher_cam',
    name: 'Spycam',
    agent: 'Cypher',
    slot: 'Grenade',
    type: 'recon',
  },
  cypher_ult: {
    id: 'cypher_ult',
    name: 'Neural Theft',
    agent: 'Cypher',
    slot: 'Ultimate',
    type: 'recon',
  },

  // ========== KILLJOY ==========
  kj_alarm: {
    id: 'kj_alarm',
    name: 'Alarmbot',
    agent: 'Killjoy',
    slot: 'Ability1',
    type: 'trap',
  },
  kj_turret: {
    id: 'kj_turret',
    name: 'Turret',
    agent: 'Killjoy',
    slot: 'Ability2',
    type: 'trap',
  },
  kj_nade: {
    id: 'kj_nade',
    name: 'Nanoswarm',
    agent: 'Killjoy',
    slot: 'Grenade',
    type: 'molly',
    radius: 0.05,
    duration: 4,
  },
  kj_ult: {
    id: 'kj_ult',
    name: 'Lockdown',
    agent: 'Killjoy',
    slot: 'Ultimate',
    type: 'stun',
    radius: 0.20,
    duration: 13,
  },

  // ========== SKYE ==========
  skye_dog: {
    id: 'skye_dog',
    name: 'Trailblazer',
    agent: 'Skye',
    slot: 'Ability1',
    type: 'recon',
  },
  skye_flash: {
    id: 'skye_flash',
    name: 'Guiding Light',
    agent: 'Skye',
    slot: 'Ability2',
    type: 'flash',
  },
  skye_heal: {
    id: 'skye_heal',
    name: 'Regrowth',
    agent: 'Skye',
    slot: 'Grenade',
    type: 'heal',
    radius: 0.08,
  },
  skye_ult: {
    id: 'skye_ult',
    name: 'Seekers',
    agent: 'Skye',
    slot: 'Ultimate',
    type: 'recon',
  },

  // ========== KAYO ==========
  kayo_flash: {
    id: 'kayo_flash',
    name: 'FLASH/drive',
    agent: 'KAY/O',
    slot: 'Ability1',
    type: 'flash',
  },
  kayo_molly: {
    id: 'kayo_molly',
    name: 'FRAG/ment',
    agent: 'KAY/O',
    slot: 'Ability2',
    type: 'molly',
    radius: 0.06,
    duration: 4,
  },
  kayo_knife: {
    id: 'kayo_knife',
    name: 'ZERO/point',
    agent: 'KAY/O',
    slot: 'Grenade',
    type: 'stun',
    radius: 0.10,
  },
  kayo_ult: {
    id: 'kayo_ult',
    name: 'NULL/cmd',
    agent: 'KAY/O',
    slot: 'Ultimate',
    type: 'stun',
    radius: 0.12,
  },

  // ========== ASTRA ==========
  astra_gravity: {
    id: 'astra_gravity',
    name: 'Gravity Well',
    agent: 'Astra',
    slot: 'Ability1',
    type: 'stun',
    radius: 0.07,
  },
  astra_nova: {
    id: 'astra_nova',
    name: 'Nova Pulse',
    agent: 'Astra',
    slot: 'Ability2',
    type: 'stun',
    radius: 0.07,
  },
  astra_smoke: {
    id: 'astra_smoke',
    name: 'Nebula',
    agent: 'Astra',
    slot: 'Grenade',
    type: 'smoke',
    radius: 0.085,
    duration: 15,
  },
  astra_wall: {
    id: 'astra_wall',
    name: 'Cosmic Divide',
    agent: 'Astra',
    slot: 'Ultimate',
    type: 'wall',
  },

  // ========== CHAMBER ==========
  chamber_tp: {
    id: 'chamber_tp',
    name: 'Rendezvous',
    agent: 'Chamber',
    slot: 'Ability1',
    type: 'movement',
  },
  chamber_headhunter: {
    id: 'chamber_headhunter',
    name: 'Headhunter',
    agent: 'Chamber',
    slot: 'Ability2',
    type: 'trap',
  },
  chamber_slow: {
    id: 'chamber_slow',
    name: 'Trademark',
    agent: 'Chamber',
    slot: 'Grenade',
    type: 'trap',
    radius: 0.08,
  },
  chamber_ult: {
    id: 'chamber_ult',
    name: 'Tour De Force',
    agent: 'Chamber',
    slot: 'Ultimate',
    type: 'trap',
  },

  // ========== RAZE ==========
  raze_boombot: {
    id: 'raze_boombot',
    name: 'Boom Bot',
    agent: 'Raze',
    slot: 'Ability1',
    type: 'recon',
  },
  raze_blast: {
    id: 'raze_blast',
    name: 'Blast Pack',
    agent: 'Raze',
    slot: 'Ability2',
    type: 'movement',
  },
  raze_nade: {
    id: 'raze_nade',
    name: 'Paint Shells',
    agent: 'Raze',
    slot: 'Grenade',
    type: 'molly',
    radius: 0.06,
  },
  raze_ult: {
    id: 'raze_ult',
    name: 'Showstopper',
    agent: 'Raze',
    slot: 'Ultimate',
    type: 'molly',
    radius: 0.08,
  },

  // ========== REYNA ==========
  reyna_leer: {
    id: 'reyna_leer',
    name: 'Leer',
    agent: 'Reyna',
    slot: 'Ability1',
    type: 'flash',
  },
  reyna_devour: {
    id: 'reyna_devour',
    name: 'Devour',
    agent: 'Reyna',
    slot: 'Ability2',
    type: 'heal',
  },
  reyna_dismiss: {
    id: 'reyna_dismiss',
    name: 'Dismiss',
    agent: 'Reyna',
    slot: 'Grenade',
    type: 'movement',
  },
  reyna_ult: {
    id: 'reyna_ult',
    name: 'Empress',
    agent: 'Reyna',
    slot: 'Ultimate',
    type: 'buff',
  },

  // ========== YORU ==========
  yoru_fakeout: {
    id: 'yoru_fakeout',
    name: 'Fakeout',
    agent: 'Yoru',
    slot: 'Ability1',
    type: 'recon',
  },
  yoru_flash: {
    id: 'yoru_flash',
    name: 'Blindside',
    agent: 'Yoru',
    slot: 'Ability2',
    type: 'flash',
  },
  yoru_tp: {
    id: 'yoru_tp',
    name: 'Gatecrash',
    agent: 'Yoru',
    slot: 'Grenade',
    type: 'movement',
  },
  yoru_ult: {
    id: 'yoru_ult',
    name: 'Dimensional Drift',
    agent: 'Yoru',
    slot: 'Ultimate',
    type: 'movement',
  },

  // ========== FADE ==========
  fade_prowler: {
    id: 'fade_prowler',
    name: 'Prowler',
    agent: 'Fade',
    slot: 'Ability1',
    type: 'recon',
  },
  fade_seize: {
    id: 'fade_seize',
    name: 'Seize',
    agent: 'Fade',
    slot: 'Ability2',
    type: 'stun',
    radius: 0.05,
  },
  fade_haunt: {
    id: 'fade_haunt',
    name: 'Haunt',
    agent: 'Fade',
    slot: 'Grenade',
    type: 'recon',
    radius: 0.10,
  },
  fade_ult: {
    id: 'fade_ult',
    name: 'Nightfall',
    agent: 'Fade',
    slot: 'Ultimate',
    type: 'recon',
    radius: 0.15,
  },

  // ========== HARBOR ==========
  harbor_wall: {
    id: 'harbor_wall',
    name: 'High Tide',
    agent: 'Harbor',
    slot: 'Ability1',
    type: 'wall',
  },
  harbor_cove: {
    id: 'harbor_cove',
    name: 'Cove',
    agent: 'Harbor',
    slot: 'Ability2',
    type: 'smoke',
    radius: 0.06,
  },
  harbor_cascade: {
    id: 'harbor_cascade',
    name: 'Cascade',
    agent: 'Harbor',
    slot: 'Grenade',
    type: 'wall',
  },
  harbor_ult: {
    id: 'harbor_ult',
    name: 'Reckoning',
    agent: 'Harbor',
    slot: 'Ultimate',
    type: 'stun',
    radius: 0.15,
  },

  // ========== GEKKO ==========
  gekko_wingman: {
    id: 'gekko_wingman',
    name: 'Wingman',
    agent: 'Gekko',
    slot: 'Ability1',
    type: 'recon',
  },
  gekko_dizzy: {
    id: 'gekko_dizzy',
    name: 'Dizzy',
    agent: 'Gekko',
    slot: 'Ability2',
    type: 'flash',
  },
  gekko_mosh: {
    id: 'gekko_mosh',
    name: 'Mosh Pit',
    agent: 'Gekko',
    slot: 'Grenade',
    type: 'molly',
    radius: 0.08,
    duration: 6,
  },
  gekko_ult: {
    id: 'gekko_ult',
    name: 'Thrash',
    agent: 'Gekko',
    slot: 'Ultimate',
    type: 'stun',
    radius: 0.06,
  },

  // ========== NEON ==========
  neon_wall: {
    id: 'neon_wall',
    name: 'Fast Lane',
    agent: 'Neon',
    slot: 'Ability1',
    type: 'wall',
  },
  neon_stun: {
    id: 'neon_stun',
    name: 'Relay Bolt',
    agent: 'Neon',
    slot: 'Ability2',
    type: 'stun',
  },
  neon_slide: {
    id: 'neon_slide',
    name: 'High Gear',
    agent: 'Neon',
    slot: 'Grenade',
    type: 'movement',
  },
  neon_ult: {
    id: 'neon_ult',
    name: 'Overdrive',
    agent: 'Neon',
    slot: 'Ultimate',
    type: 'movement',
  },

  // ========== CLOVE ==========
  clove_meddle: {
    id: 'clove_meddle',
    name: 'Meddle',
    agent: 'Clove',
    slot: 'Ability1',
    type: 'stun',
    radius: 0.06,
  },
  clove_pick: {
    id: 'clove_pick',
    name: 'Pick-Me-Up',
    agent: 'Clove',
    slot: 'Ability2',
    type: 'buff',
  },
  clove_smoke: {
    id: 'clove_smoke',
    name: 'Ruse',
    agent: 'Clove',
    slot: 'Grenade',
    type: 'smoke',
    radius: 0.08,
    duration: 10,
  },
  clove_ult: {
    id: 'clove_ult',
    name: 'Not Dead Yet',
    agent: 'Clove',
    slot: 'Ultimate',
    type: 'heal',
  },

  // ========== ISO ==========
  iso_contingency: {
    id: 'iso_contingency',
    name: 'Contingency',
    agent: 'Iso',
    slot: 'Ability1',
    type: 'wall',
  },
  iso_undercut: {
    id: 'iso_undercut',
    name: 'Undercut',
    agent: 'Iso',
    slot: 'Ability2',
    type: 'stun',
  },
  iso_shield: {
    id: 'iso_shield',
    name: 'Double Tap',
    agent: 'Iso',
    slot: 'Grenade',
    type: 'buff',
  },
  iso_ult: {
    id: 'iso_ult',
    name: 'Kill Contract',
    agent: 'Iso',
    slot: 'Ultimate',
    type: 'movement',
  },

  // ========== DEADLOCK ==========
  dl_barrier: {
    id: 'dl_barrier',
    name: 'Barrier Mesh',
    agent: 'Deadlock',
    slot: 'Ability1',
    type: 'wall',
  },
  dl_sensor: {
    id: 'dl_sensor',
    name: 'Sonic Sensor',
    agent: 'Deadlock',
    slot: 'Ability2',
    type: 'trap',
  },
  dl_net: {
    id: 'dl_net',
    name: 'GravNet',
    agent: 'Deadlock',
    slot: 'Grenade',
    type: 'stun',
    radius: 0.06,
  },
  dl_ult: {
    id: 'dl_ult',
    name: 'Annihilation',
    agent: 'Deadlock',
    slot: 'Ultimate',
    type: 'trap',
  },
};

/**
 * Get ability by unique ID
 */
export function getAbilityById(id: string): AbilityDefinition | undefined {
  return ABILITY_REGISTRY[id];
}

/**
 * Get all abilities for an agent
 */
export function getAgentAbilities(agentName: string): AbilityDefinition[] {
  const normalized = agentName.toLowerCase();
  return Object.values(ABILITY_REGISTRY).filter(
    a => a.agent.toLowerCase() === normalized
  );
}

/**
 * Get ability by agent name and slot
 */
export function getAbilityBySlot(agentName: string, slot: AbilityDefinition['slot']): AbilityDefinition | undefined {
  const normalized = agentName.toLowerCase();
  return Object.values(ABILITY_REGISTRY).find(
    a => a.agent.toLowerCase() === normalized && a.slot === slot
  );
}

/**
 * Get ability by agent name and ability name
 */
export function getAbilityByName(agentName: string, abilityName: string): AbilityDefinition | undefined {
  const normalizedAgent = agentName.toLowerCase();
  const normalizedAbility = abilityName.toLowerCase();
  return Object.values(ABILITY_REGISTRY).find(
    a => a.agent.toLowerCase() === normalizedAgent && 
         a.name.toLowerCase() === normalizedAbility
  );
}

/**
 * Map visual type string to AbilityType
 */
export function normalizeVisualType(visual: string): AbilityType {
  const map: Record<string, AbilityType> = {
    smoke: 'smoke',
    flash: 'flash',
    molly: 'molly',
    incendiary: 'molly',
    recon: 'recon',
    reveal: 'recon',
    wall: 'wall',
    stun: 'stun',
    concuss: 'stun',
    trap: 'trap',
    movement: 'movement',
    dash: 'movement',
    teleport: 'movement',
    heal: 'heal',
    buff: 'buff',
  };
  return map[visual.toLowerCase()] || 'smoke';
}

/**
 * Get abilities for an agent filtered by side (attack/defense)
 * CRITICAL: Only returns abilities valid for the selected side
 */
export function getAgentAbilitiesForSide(agentName: string, side: AbilitySide): AbilityDefinition[] {
  const abilities = getAgentAbilities(agentName);
  return abilities.filter(ability => {
    const usableSides = ability.usableSides || ['both'];
    return usableSides.includes('both') || usableSides.includes(side);
  });
}

/**
 * Validate that an ability belongs to the specified agent
 * CRITICAL: Prevents cross-agent ability usage
 */
export function validateAbilityForAgent(abilityName: string, agentName: string): boolean {
  const ability = getAbilityByName(agentName, abilityName);
  return ability !== undefined;
}

/**
 * Get the visual type for an ability based on agent and ability name
 * Returns undefined if the ability doesn't belong to the agent
 */
export function getAbilityVisualType(agentName: string, abilityName: string): AbilityType | undefined {
  const ability = getAbilityByName(agentName, abilityName);
  return ability?.type;
}

/**
 * Get ability radius (normalized 0-1) based on agent and ability
 * Returns default radius if not specified
 */
export function getAbilityRadius(agentName: string, abilityName: string): number {
  const ability = getAbilityByName(agentName, abilityName);
  return ability?.radius || 0.06;
}
