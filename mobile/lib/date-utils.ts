const MS_PER_DAY = 86400000;

export function daysUntil(date?: string | null) {
  if (!date || !date.trim() || date === 'N/A') return Infinity;
  const target = new Date(`${date}T00:00:00`);
  if (isNaN(target.getTime())) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / MS_PER_DAY);
}

export function formatExpiryStatus(date?: string | null) {
  if (!date || !date.trim() || date === 'N/A') return 'No expiry date set';
  const daysLeft = daysUntil(date);
  if (!isFinite(daysLeft)) return 'No expiry date set';

  if (daysLeft >= 0) {
    return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
  }

  const daysAgo = Math.abs(daysLeft);
  return daysAgo === 0 ? 'Expired' : `Expired ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
}

export function getLocalTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
