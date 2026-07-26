export type PillColorInfo = {
  name: string;
  bgHex: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  pillBg: string;
  dotColor: string;
};

const PILL_COLORS: PillColorInfo[] = [
  {
    name: 'Red',
    bgHex: '#ef4444',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    badgeBorder: 'border-red-300',
    cardBorder: 'border-red-400',
    pillBg: 'bg-red-500',
    dotColor: '#ef4444',
  },
  {
    name: 'Blue',
    bgHex: '#3b82f6',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
    cardBorder: 'border-blue-400',
    pillBg: 'bg-blue-500',
    dotColor: '#3b82f6',
  },
  {
    name: 'Green',
    bgHex: '#10b981',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    cardBorder: 'border-emerald-400',
    pillBg: 'bg-emerald-500',
    dotColor: '#10b981',
  },
  {
    name: 'Amber',
    bgHex: '#f59e0b',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    cardBorder: 'border-amber-400',
    pillBg: 'bg-amber-500',
    dotColor: '#f59e0b',
  },
  {
    name: 'Purple',
    bgHex: '#8b5cf6',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    cardBorder: 'border-purple-400',
    pillBg: 'bg-purple-500',
    dotColor: '#8b5cf6',
  },
  {
    name: 'Pink',
    bgHex: '#ec4899',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-800',
    badgeBorder: 'border-pink-300',
    cardBorder: 'border-pink-400',
    pillBg: 'bg-pink-500',
    dotColor: '#ec4899',
  },
  {
    name: 'Teal',
    bgHex: '#14b8a6',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-300',
    cardBorder: 'border-teal-400',
    pillBg: 'bg-teal-500',
    dotColor: '#14b8a6',
  },
];

/**
 * Deterministically get color coding palette for any medicine name or ID
 */
export function getPillColor(nameOrId: string): PillColorInfo {
  if (!nameOrId) return PILL_COLORS[0];
  let hash = 0;
  for (let i = 0; i < nameOrId.length; i++) {
    hash = (hash << 5) - hash + nameOrId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PILL_COLORS.length;
  return PILL_COLORS[index];
}

/**
 * Generate a clean SVG data URL for a color-coded pill icon
 */
export function getPillSvgDataUrl(name: string, type: string = 'Tablet'): string {
  const color = getPillColor(name);
  const isCapsule = type.toLowerCase().includes('capsule');
  const isInhaler = type.toLowerCase().includes('inhaler');

  let shapeSvg = '';
  if (isCapsule) {
    shapeSvg = `<rect x="15" y="25" width="50" height="30" rx="15" fill="${color.bgHex}" /><rect x="40" y="25" width="25" height="30" rx="0" fill="#ffffff" opacity="0.8" /><rect x="40" y="25" width="25" height="30" rx="15" fill="#ffffff" opacity="0.3" />`;
  } else if (isInhaler) {
    shapeSvg = `<path d="M25,20 H55 V50 H40 V65 H25 Z" fill="${color.bgHex}" /><circle cx="48" cy="35" r="5" fill="#ffffff" />`;
  } else {
    shapeSvg = `<circle cx="40" cy="40" r="24" fill="${color.bgHex}" /><line x1="22" y1="40" x2="58" y2="40" stroke="#ffffff" stroke-width="3" opacity="0.6" />`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><rect width="80" height="80" rx="16" fill="#f8fafc"/>${shapeSvg}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
