// Small display formatters shared across the product UI.

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export const formatPrice = (value: number): string =>
  priceFormatter.format(Number.isFinite(value) ? value : 0);

export const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};
