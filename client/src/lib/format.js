export function formatCurrency(amount, currency = 'INR') {
  if (amount == null || isNaN(amount)) return '–';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

export function formatDuration(days) {
  if (!days) return '0 days';
  return days === 1 ? '1 day' : `${days} days`;
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const m = minutes || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${formattedH}:${m} ${ampm}`;
}

export function truncate(str, len = 60) {
  if (!str) return '';
  return str.length > len ? `${str.slice(0, len)}...` : str;
}
