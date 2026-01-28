export interface OverlayTheme {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  supportsTransparency: boolean;
}

// 5 OBS-safe overlays with inline styles
export const overlayThemes: OverlayTheme[] = [
  { id: 'bar', name: 'Bar', description: 'Compact horizontal bar', width: 470, height: 60, supportsTransparency: true },
  { id: 'arc', name: 'Arc', description: 'Premium full width curve', width: 800, height: 160, supportsTransparency: true },
  { id: 'circle', name: 'Circle', description: 'Compact circular design', width: 160, height: 200, supportsTransparency: true },
  { id: 'glass', name: 'Glass', description: 'Frosted glass card', width: 320, height: 180, supportsTransparency: true },
  { id: 'hype', name: 'Hype', description: 'Vibrant promo style', width: 400, height: 200, supportsTransparency: true },
];

export const getThemeById = (id: string): OverlayTheme | undefined => overlayThemes.find(theme => theme.id === id);

export const rankTiers = [
  { id: 0, name: 'Unranked', color: '#5a5a5a' },
  { id: 3, name: 'Iron 1', color: '#5a5a5a' }, { id: 4, name: 'Iron 2', color: '#5a5a5a' }, { id: 5, name: 'Iron 3', color: '#5a5a5a' },
  { id: 6, name: 'Bronze 1', color: '#a6764a' }, { id: 7, name: 'Bronze 2', color: '#a6764a' }, { id: 8, name: 'Bronze 3', color: '#a6764a' },
  { id: 9, name: 'Silver 1', color: '#b8b8b8' }, { id: 10, name: 'Silver 2', color: '#b8b8b8' }, { id: 11, name: 'Silver 3', color: '#b8b8b8' },
  { id: 12, name: 'Gold 1', color: '#e8c869' }, { id: 13, name: 'Gold 2', color: '#e8c869' }, { id: 14, name: 'Gold 3', color: '#e8c869' },
  { id: 15, name: 'Platinum 1', color: '#4fb8b8' }, { id: 16, name: 'Platinum 2', color: '#4fb8b8' }, { id: 17, name: 'Platinum 3', color: '#4fb8b8' },
  { id: 18, name: 'Diamond 1', color: '#b48bc7' }, { id: 19, name: 'Diamond 2', color: '#b48bc7' }, { id: 20, name: 'Diamond 3', color: '#b48bc7' },
  { id: 21, name: 'Ascendant 1', color: '#3de383' }, { id: 22, name: 'Ascendant 2', color: '#3de383' }, { id: 23, name: 'Ascendant 3', color: '#3de383' },
  { id: 24, name: 'Immortal 1', color: '#bf3f5f' }, { id: 25, name: 'Immortal 2', color: '#bf3f5f' }, { id: 26, name: 'Immortal 3', color: '#bf3f5f' },
  { id: 27, name: 'Radiant', color: '#ffffa8' },
];

export const getRankInfo = (tierId: number) => rankTiers.find(rank => rank.id === tierId) || rankTiers[0];
export const getRankIcon = (tierId: number) => `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tierId}/smallicon.png`;
