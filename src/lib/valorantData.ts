// Complete Valorant Data from valorant-api.com
// All agents, abilities, maps, and their icons

export interface Agent {
  id: string;
  name: string;
  role: 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';
  icon: string;
  portrait: string;
  abilities: Ability[];
}

export interface Ability {
  slot: 'Ability1' | 'Ability2' | 'Grenade' | 'Ultimate';
  name: string;
  icon: string;
  description: string;
}

export interface MapData {
  id: string;
  name: string;
  icon: string;
  displayIcon: string;
  coordinates: string | null;
}

// Agent data with complete ability info
export const AGENTS: Agent[] = [
  // Duelists
  {
    id: 'add6443a-41bd-e414-f6ad-e58d267f4e95',
    name: 'Jett',
    role: 'Duelist',
    icon: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Cloudburst', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/abilities/ability1/displayicon.png', description: 'Throw smoke that curves' },
      { slot: 'Ability2', name: 'Updraft', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/abilities/ability2/displayicon.png', description: 'Launch upward' },
      { slot: 'Grenade', name: 'Tailwind', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/abilities/grenade/displayicon.png', description: 'Dash in direction moving' },
      { slot: 'Ultimate', name: 'Blade Storm', icon: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/abilities/ultimate/displayicon.png', description: 'Throwing knives' },
    ],
  },
  {
    id: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
    name: 'Reyna',
    role: 'Duelist',
    icon: 'https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Leer', icon: 'https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/abilities/ability1/displayicon.png', description: 'Nearsight enemies' },
      { slot: 'Ability2', name: 'Devour', icon: 'https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/abilities/ability2/displayicon.png', description: 'Heal from soul orbs' },
      { slot: 'Grenade', name: 'Dismiss', icon: 'https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/abilities/grenade/displayicon.png', description: 'Become intangible' },
      { slot: 'Ultimate', name: 'Empress', icon: 'https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/abilities/ultimate/displayicon.png', description: 'Combat stim' },
    ],
  },
  {
    id: 'f94c3b30-42be-e959-889c-5aa313dba261',
    name: 'Raze',
    role: 'Duelist',
    icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Boom Bot', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/abilities/ability1/displayicon.png', description: 'Seeking bot that explodes' },
      { slot: 'Ability2', name: 'Blast Pack', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/abilities/ability2/displayicon.png', description: 'Throwable C4' },
      { slot: 'Grenade', name: 'Paint Shells', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/abilities/grenade/displayicon.png', description: 'Cluster grenade' },
      { slot: 'Ultimate', name: 'Showstopper', icon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/abilities/ultimate/displayicon.png', description: 'Rocket launcher' },
    ],
  },
  {
    id: 'eb93336a-449b-9c1b-0a54-a891f7921d69',
    name: 'Phoenix',
    role: 'Duelist',
    icon: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Blaze', icon: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/abilities/ability1/displayicon.png', description: 'Fire wall' },
      { slot: 'Ability2', name: 'Curveball', icon: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/abilities/ability2/displayicon.png', description: 'Curving flash' },
      { slot: 'Grenade', name: 'Hot Hands', icon: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/abilities/grenade/displayicon.png', description: 'Fire zone' },
      { slot: 'Ultimate', name: 'Run It Back', icon: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/abilities/ultimate/displayicon.png', description: 'Respawn marker' },
    ],
  },
  {
    id: '7f94d92c-4234-0a36-9646-3a87eb8b5c89',
    name: 'Yoru',
    role: 'Duelist',
    icon: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Fakeout', icon: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/abilities/ability1/displayicon.png', description: 'Decoy footsteps' },
      { slot: 'Ability2', name: 'Blindside', icon: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/abilities/ability2/displayicon.png', description: 'Bouncing flash' },
      { slot: 'Grenade', name: 'Gatecrash', icon: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/abilities/grenade/displayicon.png', description: 'Teleport anchor' },
      { slot: 'Ultimate', name: 'Dimensional Drift', icon: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/abilities/ultimate/displayicon.png', description: 'Invisible dimension walk' },
    ],
  },
  {
    id: 'bb2a4828-46eb-8cd1-e765-15848195d751',
    name: 'Neon',
    role: 'Duelist',
    icon: 'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Fast Lane', icon: 'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/abilities/ability1/displayicon.png', description: 'Electric walls' },
      { slot: 'Ability2', name: 'Relay Bolt', icon: 'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/abilities/ability2/displayicon.png', description: 'Stun bolt' },
      { slot: 'Grenade', name: 'High Gear', icon: 'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/abilities/grenade/displayicon.png', description: 'Sprint and slide' },
      { slot: 'Ultimate', name: 'Overdrive', icon: 'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/abilities/ultimate/displayicon.png', description: 'Electric beam' },
    ],
  },
  {
    id: '0e38b510-41a8-5780-5e8f-568b2a4f2d6c',
    name: 'Iso',
    role: 'Duelist',
    icon: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Undercut', icon: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/abilities/ability1/displayicon.png', description: 'Vulnerability bolt' },
      { slot: 'Ability2', name: 'Double Tap', icon: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/abilities/ability2/displayicon.png', description: 'Shield on kill' },
      { slot: 'Grenade', name: 'Contingency', icon: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/abilities/grenade/displayicon.png', description: 'Indestructible wall' },
      { slot: 'Ultimate', name: 'Kill Contract', icon: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/abilities/ultimate/displayicon.png', description: '1v1 arena' },
    ],
  },
  // Initiators
  {
    id: '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
    name: 'Sova',
    role: 'Initiator',
    icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Owl Drone', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/abilities/ability1/displayicon.png', description: 'Remote drone' },
      { slot: 'Ability2', name: 'Shock Bolt', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/abilities/ability2/displayicon.png', description: 'Electric bolt' },
      { slot: 'Grenade', name: 'Recon Bolt', icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/abilities/grenade/displayicon.png', description: 'Reveal bolt' },
      { slot: 'Ultimate', name: "Hunter's Fury", icon: 'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/abilities/ultimate/displayicon.png', description: 'Wall pierce shots' },
    ],
  },
  {
    id: '5f8d3a7f-467b-97f3-062c-13acf203c006',
    name: 'Breach',
    role: 'Initiator',
    icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Aftershock', icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/abilities/ability1/displayicon.png', description: 'Wall damage' },
      { slot: 'Ability2', name: 'Flashpoint', icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/abilities/ability2/displayicon.png', description: 'Wall flash' },
      { slot: 'Grenade', name: 'Fault Line', icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/abilities/grenade/displayicon.png', description: 'Stun line' },
      { slot: 'Ultimate', name: 'Rolling Thunder', icon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/abilities/ultimate/displayicon.png', description: 'Massive stun wave' },
    ],
  },
  {
    id: '6f2a04ca-43e0-be17-7f36-b3908627744d',
    name: 'Skye',
    role: 'Initiator',
    icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Regrowth', icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/abilities/ability1/displayicon.png', description: 'Heal pool' },
      { slot: 'Ability2', name: 'Trailblazer', icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/abilities/ability2/displayicon.png', description: 'Tiger scout' },
      { slot: 'Grenade', name: 'Guiding Light', icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/abilities/grenade/displayicon.png', description: 'Hawk flash' },
      { slot: 'Ultimate', name: 'Seekers', icon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/abilities/ultimate/displayicon.png', description: 'Tracking seekers' },
    ],
  },
  {
    id: '601dbbe7-43ce-be57-2a40-4abd24953621',
    name: 'KAY/O',
    role: 'Initiator',
    icon: 'https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'FRAG/ment', icon: 'https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/abilities/ability1/displayicon.png', description: 'Explosive fragment' },
      { slot: 'Ability2', name: 'FLASH/drive', icon: 'https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/abilities/ability2/displayicon.png', description: 'Flash grenade' },
      { slot: 'Grenade', name: 'ZERO/point', icon: 'https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/abilities/grenade/displayicon.png', description: 'Suppression knife' },
      { slot: 'Ultimate', name: 'NULL/cmd', icon: 'https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/abilities/ultimate/displayicon.png', description: 'Pulse suppress' },
    ],
  },
  {
    id: 'dade69b4-4f5a-8528-247b-219e5a1facd6',
    name: 'Fade',
    role: 'Initiator',
    icon: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Prowler', icon: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/abilities/ability1/displayicon.png', description: 'Tracking creature' },
      { slot: 'Ability2', name: 'Seize', icon: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/abilities/ability2/displayicon.png', description: 'Tether zone' },
      { slot: 'Grenade', name: 'Haunt', icon: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/abilities/grenade/displayicon.png', description: 'Reveal watcher' },
      { slot: 'Ultimate', name: 'Nightfall', icon: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/abilities/ultimate/displayicon.png', description: 'Fear wave' },
    ],
  },
  {
    id: 'e370fa57-4757-3604-3648-499e1f642d3f',
    name: 'Gekko',
    role: 'Initiator',
    icon: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Mosh Pit', icon: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/abilities/ability1/displayicon.png', description: 'AoE damage' },
      { slot: 'Ability2', name: 'Wingman', icon: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/abilities/ability2/displayicon.png', description: 'Plant/defuse bot' },
      { slot: 'Grenade', name: 'Dizzy', icon: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/abilities/grenade/displayicon.png', description: 'Blinding creature' },
      { slot: 'Ultimate', name: 'Thrash', icon: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/abilities/ultimate/displayicon.png', description: 'Detaining creature' },
    ],
  },
  // Controllers
  {
    id: '9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
    name: 'Brimstone',
    role: 'Controller',
    icon: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Stim Beacon', icon: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/abilities/ability1/displayicon.png', description: 'Fire rate boost zone' },
      { slot: 'Ability2', name: 'Incendiary', icon: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/abilities/ability2/displayicon.png', description: 'Molotov launcher' },
      { slot: 'Grenade', name: 'Sky Smoke', icon: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/abilities/grenade/displayicon.png', description: 'Orbital smokes' },
      { slot: 'Ultimate', name: 'Orbital Strike', icon: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/abilities/ultimate/displayicon.png', description: 'Laser from sky' },
    ],
  },
  {
    id: '8e253930-4c05-31dd-1b6c-968525494517',
    name: 'Omen',
    role: 'Controller',
    icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Shrouded Step', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/abilities/ability1/displayicon.png', description: 'Short teleport' },
      { slot: 'Ability2', name: 'Paranoia', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/abilities/ability2/displayicon.png', description: 'Blinding shadow' },
      { slot: 'Grenade', name: 'Dark Cover', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/abilities/grenade/displayicon.png', description: 'Smoke orb' },
      { slot: 'Ultimate', name: 'From the Shadows', icon: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/abilities/ultimate/displayicon.png', description: 'Global teleport' },
    ],
  },
  {
    id: '707eab51-4836-f488-046a-cda6bf494f0a',
    name: 'Viper',
    role: 'Controller',
    icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494f0a/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494f0a/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Snake Bite', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494f0a/abilities/ability1/displayicon.png', description: 'Acid pool' },
      { slot: 'Ability2', name: 'Poison Cloud', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494f0a/abilities/ability2/displayicon.png', description: 'Reusable smoke' },
      { slot: 'Grenade', name: 'Toxic Screen', icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494f0a/abilities/grenade/displayicon.png', description: 'Toxic wall' },
      { slot: 'Ultimate', name: "Viper's Pit", icon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494f0a/abilities/ultimate/displayicon.png', description: 'Large smoke zone' },
    ],
  },
  {
    id: '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
    name: 'Astra',
    role: 'Controller',
    icon: 'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Gravity Well', icon: 'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/abilities/ability1/displayicon.png', description: 'Pull zone' },
      { slot: 'Ability2', name: 'Nova Pulse', icon: 'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/abilities/ability2/displayicon.png', description: 'Concuss zone' },
      { slot: 'Grenade', name: 'Nebula', icon: 'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/abilities/grenade/displayicon.png', description: 'Star smoke' },
      { slot: 'Ultimate', name: 'Astral Form', icon: 'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/abilities/ultimate/displayicon.png', description: 'Global wall' },
    ],
  },
  {
    id: '95b78ed7-4637-86d9-7e41-71ba8c293152',
    name: 'Harbor',
    role: 'Controller',
    icon: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Cascade', icon: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/abilities/ability1/displayicon.png', description: 'Moving water wall' },
      { slot: 'Ability2', name: 'Cove', icon: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/abilities/ability2/displayicon.png', description: 'Bullet shield' },
      { slot: 'Grenade', name: 'High Tide', icon: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/abilities/grenade/displayicon.png', description: 'Curved water wall' },
      { slot: 'Ultimate', name: 'Reckoning', icon: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/abilities/ultimate/displayicon.png', description: 'Geyser strikes' },
    ],
  },
  {
    id: '1dbf2edd-4729-0984-3115-daa5eed44993',
    name: 'Clove',
    role: 'Controller',
    icon: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Pick-Me-Up', icon: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/abilities/ability1/displayicon.png', description: 'Haste on kill' },
      { slot: 'Ability2', name: 'Meddle', icon: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/abilities/ability2/displayicon.png', description: 'Decay zone' },
      { slot: 'Grenade', name: 'Ruse', icon: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/abilities/grenade/displayicon.png', description: 'Smoke even when dead' },
      { slot: 'Ultimate', name: 'Not Dead Yet', icon: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/abilities/ultimate/displayicon.png', description: 'Self resurrect' },
    ],
  },
  // Sentinels
  {
    id: '569fdd95-4d10-43ab-ca70-79becc718b46',
    name: 'Sage',
    role: 'Sentinel',
    icon: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Barrier Orb', icon: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/abilities/ability1/displayicon.png', description: 'Ice wall' },
      { slot: 'Ability2', name: 'Slow Orb', icon: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/abilities/ability2/displayicon.png', description: 'Slow zone' },
      { slot: 'Grenade', name: 'Healing Orb', icon: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/abilities/grenade/displayicon.png', description: 'Heal ally' },
      { slot: 'Ultimate', name: 'Resurrection', icon: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/abilities/ultimate/displayicon.png', description: 'Revive ally' },
    ],
  },
  {
    id: '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
    name: 'Cypher',
    role: 'Sentinel',
    icon: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Trapwire', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/abilities/ability1/displayicon.png', description: 'Trip wire' },
      { slot: 'Ability2', name: 'Cyber Cage', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/abilities/ability2/displayicon.png', description: 'Slow cage' },
      { slot: 'Grenade', name: 'Spycam', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/abilities/grenade/displayicon.png', description: 'Camera' },
      { slot: 'Ultimate', name: 'Neural Theft', icon: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/abilities/ultimate/displayicon.png', description: 'Reveal enemies' },
    ],
  },
  {
    id: '1e58de9c-4950-5125-93e9-a0aee9f98746',
    name: 'Killjoy',
    role: 'Sentinel',
    icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Alarmbot', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/abilities/ability1/displayicon.png', description: 'Vulnerability bot' },
      { slot: 'Ability2', name: 'Turret', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/abilities/ability2/displayicon.png', description: 'Auto turret' },
      { slot: 'Grenade', name: 'Nanoswarm', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/abilities/grenade/displayicon.png', description: 'Damage swarm' },
      { slot: 'Ultimate', name: 'Lockdown', icon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/abilities/ultimate/displayicon.png', description: 'Detain zone' },
    ],
  },
  {
    id: '22697a3d-45bf-8dd7-4fec-84a9e28c69d7',
    name: 'Chamber',
    role: 'Sentinel',
    icon: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Trademark', icon: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/abilities/ability1/displayicon.png', description: 'Slow trap' },
      { slot: 'Ability2', name: 'Headhunter', icon: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/abilities/ability2/displayicon.png', description: 'Heavy pistol' },
      { slot: 'Grenade', name: 'Rendezvous', icon: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/abilities/grenade/displayicon.png', description: 'Teleport anchors' },
      { slot: 'Ultimate', name: 'Tour De Force', icon: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/abilities/ultimate/displayicon.png', description: 'Operator sniper' },
    ],
  },
  {
    id: 'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235',
    name: 'Deadlock',
    role: 'Sentinel',
    icon: 'https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'GravNet', icon: 'https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/abilities/ability1/displayicon.png', description: 'Slow net' },
      { slot: 'Ability2', name: 'Sonic Sensor', icon: 'https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/abilities/ability2/displayicon.png', description: 'Stun sensor' },
      { slot: 'Grenade', name: 'Barrier Mesh', icon: 'https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/abilities/grenade/displayicon.png', description: 'Barrier orbs' },
      { slot: 'Ultimate', name: 'Annihilation', icon: 'https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/abilities/ultimate/displayicon.png', description: 'Cocoon pull' },
    ],
  },
  {
    id: 'efba5359-4016-a1e5-7626-b1ae76895940',
    name: 'Vyse',
    role: 'Sentinel',
    icon: 'https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Shear', icon: 'https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/abilities/ability1/displayicon.png', description: 'Metal wall' },
      { slot: 'Ability2', name: 'Arc Rose', icon: 'https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/abilities/ability2/displayicon.png', description: 'Laser trip' },
      { slot: 'Grenade', name: 'Razorvine', icon: 'https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/abilities/grenade/displayicon.png', description: 'Damage vines' },
      { slot: 'Ultimate', name: 'Steel Garden', icon: 'https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/abilities/ultimate/displayicon.png', description: 'Metal zone' },
    ],
  },
  // New agents
  {
    id: '0e76a4b5-4a88-7a5a-8695-caa8a9f4c1e2',
    name: 'Waylay',
    role: 'Duelist',
    icon: 'https://media.valorant-api.com/agents/0e76a4b5-4a88-7a5a-8695-caa8a9f4c1e2/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/0e76a4b5-4a88-7a5a-8695-caa8a9f4c1e2/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Ability 1', icon: 'https://media.valorant-api.com/agents/0e76a4b5-4a88-7a5a-8695-caa8a9f4c1e2/abilities/ability1/displayicon.png', description: 'Initiator ability' },
      { slot: 'Ability2', name: 'Ability 2', icon: 'https://media.valorant-api.com/agents/0e76a4b5-4a88-7a5a-8695-caa8a9f4c1e2/abilities/ability2/displayicon.png', description: 'Initiator ability' },
      { slot: 'Grenade', name: 'Signature', icon: 'https://media.valorant-api.com/agents/0e76a4b5-4a88-7a5a-8695-caa8a9f4c1e2/abilities/grenade/displayicon.png', description: 'Signature ability' },
      { slot: 'Ultimate', name: 'Ultimate', icon: 'https://media.valorant-api.com/agents/0e76a4b5-4a88-7a5a-8695-caa8a9f4c1e2/abilities/ultimate/displayicon.png', description: 'Ultimate ability' },
    ],
  },
  {
    id: '48ed2630-4a4e-b9b7-5f1e-60a6e5a13ad7',
    name: 'Tejo',
    role: 'Initiator',
    icon: 'https://media.valorant-api.com/agents/48ed2630-4a4e-b9b7-5f1e-60a6e5a13ad7/displayicon.png',
    portrait: 'https://media.valorant-api.com/agents/48ed2630-4a4e-b9b7-5f1e-60a6e5a13ad7/fullportrait.png',
    abilities: [
      { slot: 'Ability1', name: 'Ability 1', icon: 'https://media.valorant-api.com/agents/48ed2630-4a4e-b9b7-5f1e-60a6e5a13ad7/abilities/ability1/displayicon.png', description: 'Initiator ability' },
      { slot: 'Ability2', name: 'Ability 2', icon: 'https://media.valorant-api.com/agents/48ed2630-4a4e-b9b7-5f1e-60a6e5a13ad7/abilities/ability2/displayicon.png', description: 'Initiator ability' },
      { slot: 'Grenade', name: 'Signature', icon: 'https://media.valorant-api.com/agents/48ed2630-4a4e-b9b7-5f1e-60a6e5a13ad7/abilities/grenade/displayicon.png', description: 'Signature ability' },
      { slot: 'Ultimate', name: 'Ultimate', icon: 'https://media.valorant-api.com/agents/48ed2630-4a4e-b9b7-5f1e-60a6e5a13ad7/abilities/ultimate/displayicon.png', description: 'Ultimate ability' },
    ],
  },
];

// Map data with local images for display
export const MAPS: MapData[] = [
  { id: 'ascent', name: 'Ascent', icon: '/maps/ascent.png', displayIcon: '/maps/ascent.png', coordinates: null },
  { id: 'abyss', name: 'Abyss', icon: '/maps/abyss.png', displayIcon: '/maps/abyss.png', coordinates: null },
  { id: 'bind', name: 'Bind', icon: '/maps/bind.png', displayIcon: '/maps/bind.png', coordinates: null },
  { id: 'breeze', name: 'Breeze', icon: '/maps/breeze.png', displayIcon: '/maps/breeze.png', coordinates: null },
  { id: 'corode', name: 'Corode', icon: '/maps/corode.png', displayIcon: '/maps/corode.png', coordinates: null },
  { id: 'fracture', name: 'Fracture', icon: '/maps/fracture.png', displayIcon: '/maps/fracture.png', coordinates: null },
  { id: 'haven', name: 'Haven', icon: '/maps/haven.png', displayIcon: '/maps/haven.png', coordinates: null },
  { id: 'icebox', name: 'Icebox', icon: '/maps/icebox.png', displayIcon: '/maps/icebox.png', coordinates: null },
  { id: 'lotus', name: 'Lotus', icon: '/maps/lotus.png', displayIcon: '/maps/lotus.png', coordinates: null },
  { id: 'pearl', name: 'Pearl', icon: '/maps/pearl.png', displayIcon: '/maps/pearl.png', coordinates: null },
  { id: 'split', name: 'Split', icon: '/maps/split.png', displayIcon: '/maps/split.png', coordinates: null },
  { id: 'sunset', name: 'Sunset', icon: '/maps/sunset.png', displayIcon: '/maps/sunset.png', coordinates: null },
];

// Role icons from Valorant API
export const ROLE_ICONS: Record<string, string> = {
  Duelist: 'https://media.valorant-api.com/agents/roles/dbe8757e-9e92-4ed4-b39f-9dfc589691d4/displayicon.png',
  Initiator: 'https://media.valorant-api.com/agents/roles/1b47567f-8f7b-444b-aae3-b0c634622d10/displayicon.png',
  Controller: 'https://media.valorant-api.com/agents/roles/4ee40330-ecdd-4f2f-98a8-eb1243428373/displayicon.png',
  Sentinel: 'https://media.valorant-api.com/agents/roles/5fc02f99-4091-4486-a531-98459a3e95e9/displayicon.png',
};

// Helper functions
export function getAgentByName(name: string): Agent | undefined {
  return AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase());
}

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find(a => a.id === id);
}

export function getAgentsByRole(role: string): Agent[] {
  return AGENTS.filter(a => a.role === role);
}

export function getMapByName(name: string): MapData | undefined {
  return MAPS.find(m => m.name.toLowerCase() === name.toLowerCase());
}

export function getAbilityIcon(agentName: string, abilitySlot: string): string | undefined {
  const agent = getAgentByName(agentName);
  if (!agent) return undefined;
  const ability = agent.abilities.find(a => a.slot === abilitySlot);
  return ability?.icon;
}
