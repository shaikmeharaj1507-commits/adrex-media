export function formatCompactCurrency(val: number, isIndian: boolean = true): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const prefix = '₹';
  
  if (isIndian) {
    // Indian formatting:
    // >= 1 Cr (1,00,00,000)
    if (val >= 10000000) {
      return `${prefix}${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)}Cr`;
    }
    // >= 1 Lakh (1,00,000)
    if (val >= 100000) {
      return `${prefix}${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
    }
    // >= 1 K (1,000)
    if (val >= 1000) {
      return `${prefix}${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
    }
    return `${prefix}${val}`;
  } else {
    // International formatting:
    // >= 1 B (1,000,000,000)
    if (val >= 1000000000) {
      return `${prefix}${(val / 1000000000).toFixed(val % 1000000000 === 0 ? 0 : 1)}B`;
    }
    // >= 1 M (1,000,000)
    if (val >= 1000000) {
      return `${prefix}${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`;
    }
    // >= 1 K (1,000)
    if (val >= 1000) {
      return `${prefix}${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
    }
    return `${prefix}${val}`;
  }
}
