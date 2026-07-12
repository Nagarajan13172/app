// Persists the product list's filter/sort/view state to sessionStorage so it
// survives reloads and back-navigation within the same browser tab.

export const FILTER_STORAGE_KEY = 'products.filters.v1';

export type StockFilter = 'all' | 'in' | 'out';
export type SortField = 'createdAt' | 'name' | 'price' | 'stock';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'table' | 'grid';

export interface StoredFilters {
  search: string;
  category: string;
  stock: StockFilter;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  limit: number;
  view: ViewMode;
}

export function readStoredFilters(): Partial<StoredFilters> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<StoredFilters>) : {};
  } catch {
    return {};
  }
}

export function writeStoredFilters(filters: StoredFilters): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    /* sessionStorage may be unavailable (private mode) */
  }
}
