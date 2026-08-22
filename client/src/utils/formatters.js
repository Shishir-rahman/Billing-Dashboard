// Currency Formatter - BDT (৳) with Bangladeshi Numbering Standard (lakhs/crores formatting)
export function formatBDT(amount, compact = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return '৳0';
  const num = Number(amount);
  
  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `৳${(num / 10000000).toFixed(2)} Cr`;
    } else if (Math.abs(num) >= 100000) {
      return `৳${(num / 100000).toFixed(2)} Lakh`;
    } else if (Math.abs(num) >= 1000) {
      return `৳${(num / 1000).toFixed(1)}k`;
    }
  }

  // Standard Bangladeshi locale formatting (en-IN format matches BD lakhs/crores comma separation)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(num).replace('BDT', '৳');
}

// Percentage Formatter
export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  return `${Number(value).toFixed(1)}%`;
}

// Date Formatter
export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Relative time formatting
export function formatLastUpdated(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}
