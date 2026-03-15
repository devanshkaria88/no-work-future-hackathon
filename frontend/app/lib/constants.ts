export const LONDON_CENTER: [number, number] = [-0.1276, 51.5074];

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export const CATEGORY_COLORS: Record<string, string> = {
  food: '#EF9F27',
  music: '#7F77DD',
  tech: '#1D9E75',
  creative: '#D85A30',
  repair: '#378ADD',
  language: '#D4537E',
  wellness: '#97C459',
  career: '#888780',
  pets: '#5DCAA5',
  default: '#888780',
};

export const XP_LEVELS = [
  { level: 1, xpRequired: 0, title: 'Newcomer' },
  { level: 2, xpRequired: 200, title: 'Neighbor' },
  { level: 3, xpRequired: 500, title: 'Local Hero' },
  { level: 4, xpRequired: 1000, title: 'Borough Builder' },
  { level: 5, xpRequired: 2000, title: 'Community Pillar' },
];

export function getLevelForXP(xp: number) {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      const current = XP_LEVELS[i];
      const next = XP_LEVELS[i + 1];
      return {
        level: current.level,
        title: current.title,
        currentXP: xp,
        xpInLevel: xp - current.xpRequired,
        xpToNext: next ? next.xpRequired - current.xpRequired : 0,
        progress: next
          ? (xp - current.xpRequired) / (next.xpRequired - current.xpRequired)
          : 1,
      };
    }
  }
  return { level: 1, title: 'Newcomer', currentXP: 0, xpInLevel: 0, xpToNext: 200, progress: 0 };
}

