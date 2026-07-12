'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TablePagination,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  AddOutlined,
  GridViewOutlined,
  Inventory2Outlined,
  SearchOutlined,
  ViewListOutlined,
} from '@mui/icons-material';
import {
  useDeleteProductMutation,
  useListProductsQuery,
} from '@/lib/api/productsApi';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { getErrorMessage } from '@/lib/api/parseError';
import ProductCard from '@/components/products/ProductCard';
import ProductsTable from '@/components/products/ProductsTable';
import ProductFormDialog from '@/components/products/ProductFormDialog';
import ConfirmDialog from '@/components/products/ConfirmDialog';
import {
  readStoredFilters,
  writeStoredFilters,
  type SortField,
  type SortOrder,
  type StockFilter,
  type ViewMode,
} from '@/lib/products/filterStorage';
import type { Product, ProductFilter } from '@/lib/types/api';

const ROWS_OPTIONS = [8, 12, 24, 48];

type Toast = { msg: string; severity: 'success' | 'error' };

export default function ProductsPage() {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';

  // Rehydrate filters from sessionStorage once (client-only). This page only
  // mounts after AuthGuard confirms auth, so window is available here.
  const [initial] = useState(() => readStoredFilters());

  const [search, setSearch] = useState(initial.search ?? '');
  const [debounced, setDebounced] = useState(initial.search ?? '');
  const [category, setCategory] = useState(initial.category ?? '');
  const [stock, setStock] = useState<StockFilter>(initial.stock ?? 'all');
  const [sortBy, setSortBy] = useState<SortField>(initial.sortBy ?? 'createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    initial.sortOrder ?? 'desc',
  );
  const [page, setPage] = useState(initial.page ?? 1);
  const [limit, setLimit] = useState(initial.limit ?? ROWS_OPTIONS[0]);
  const [view, setView] = useState<ViewMode>(initial.view ?? 'table');

  // Debounce the name search. Skip the first run so restoring a saved search
  // doesn't immediately reset the restored page back to 1.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Persist every filter/view change to sessionStorage.
  useEffect(() => {
    writeStoredFilters({
      search,
      category,
      stock,
      sortBy,
      sortOrder,
      page,
      limit,
      view,
    });
  }, [search, category, stock, sortBy, sortOrder, page, limit, view]);

  const filter: ProductFilter = useMemo(
    () => ({
      ...(debounced.trim() ? { name: debounced.trim() } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(stock !== 'all'
        ? { inStock: stock === 'in' ? 'true' : 'false' }
        : {}),
      sortBy,
      sortOrder,
      page,
      limit,
    }),
    [debounced, category, stock, sortBy, sortOrder, page, limit],
  );

  const { data, isLoading, isFetching, error, refetch } =
    useListProductsQuery(filter);
  const [deleteProduct, deleteState] = useDeleteProductMutation();

  // Keep the page in range when the result set shrinks (e.g. the last item on
  // the last page is deleted, or rows-per-page increases).
  useEffect(() => {
    if (data && page > data.totalPages) {
      setPage(Math.max(1, data.totalPages));
    }
  }, [data, page]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleFormClose = (saved?: boolean) => {
    const wasEditing = Boolean(editing);
    setFormOpen(false);
    if (saved) {
      setToast({
        msg: wasEditing ? 'Product updated' : 'Product created',
        severity: 'success',
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduct(deleting._id).unwrap();
      setToast({ msg: 'Product deleted', severity: 'success' });
    } catch (err) {
      setToast({ msg: getErrorMessage(err), severity: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  // Column-header sort in the table: toggle order on the same field, else
  // switch field. Either way the API is re-queried (server-side sort).
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}
      >
        <Box>
          <Typography variant="h4">Products</Typography>
          <Typography color="text.secondary">
            {data
              ? `${data.total} product${data.total === 1 ? '' : 's'}`
              : 'Browse the catalog'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, v) => v && setView(v as ViewMode)}
          >
            <ToggleButton value="table" aria-label="Table view">
              <ViewListOutlined fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="Grid view">
              <GridViewOutlined fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={openCreate}
            >
              Add product
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          placeholder="Category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Availability</InputLabel>
          <Select
            label="Availability"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value as StockFilter);
              setPage(1);
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="in">In stock</MenuItem>
            <MenuItem value="out">Out of stock</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
          >
            <MenuItem value="createdAt">Newest</MenuItem>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="stock">Stock</MenuItem>
          </Select>
        </FormControl>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={sortOrder}
          onChange={(_, v) => v && setSortOrder(v as SortOrder)}
        >
          <ToggleButton value="asc">Asc</ToggleButton>
          <ToggleButton value="desc">Desc</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {getErrorMessage(error)}
        </Alert>
      )}

      {isLoading ? (
        <Skeleton variant="rounded" height={360} />
      ) : !error && items.length === 0 ? (
        <EmptyState isAdmin={isAdmin} onAdd={openCreate} />
      ) : (
        <>
          <Box sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
            {view === 'table' ? (
              <ProductsTable
                products={items}
                isAdmin={isAdmin}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ) : (
              <ProductGrid>
                {items.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    isAdmin={isAdmin}
                    onEdit={openEdit}
                    onDelete={setDeleting}
                  />
                ))}
              </ProductGrid>
            )}
          </Box>

          {view === 'table' ? (
            <TablePagination
              component="div"
              count={data?.total ?? 0}
              page={Math.max(0, page - 1)}
              rowsPerPage={limit}
              rowsPerPageOptions={ROWS_OPTIONS}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              onRowsPerPageChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
            />
          ) : (
            totalPages > 1 && (
              <Stack sx={{ mt: 4, alignItems: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, v) => setPage(v)}
                  color="primary"
                />
              </Stack>
            )
          )}
        </>
      )}

      <ProductFormDialog
        open={formOpen}
        product={editing}
        onClose={handleFormClose}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product"
        message={`Delete "${deleting?.name ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteState.isLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}

function ProductGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr 1fr',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
      }}
    >
      {children}
    </Box>
  );
}

function EmptyState({
  isAdmin,
  onAdd,
}: {
  isAdmin: boolean;
  onAdd: () => void;
}) {
  return (
    <Stack sx={{ alignItems: 'center', py: 10, textAlign: 'center' }} spacing={2}>
      <Inventory2Outlined sx={{ fontSize: 56, color: 'text.disabled' }} />
      <Typography variant="h6">No products found</Typography>
      <Typography color="text.secondary">
        Try adjusting your filters{isAdmin ? ', or add your first product.' : '.'}
      </Typography>
      {isAdmin && (
        <Button variant="contained" startIcon={<AddOutlined />} onClick={onAdd}>
          Add product
        </Button>
      )}
    </Stack>
  );
}
