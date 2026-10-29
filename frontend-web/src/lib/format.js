export function formatArea(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '-';
  return `${number.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ha`;
}

export function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) {
    const kb = (size / 1024).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    return `${kb} KB`;
  }
  const mb = (size / (1024 * 1024)).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return `${mb} MB`;
}

export function formatCoord(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(5) : '-';
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function timeAgo(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'baru saja';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;

  return formatDateTime(value);
}
