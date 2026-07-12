'use client';

import Link from 'next/link';
import {
  Box,
  Chip,
  IconButton,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import {
  DeleteOutlined,
  EditOutlined,
  ImageOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { assetUrl } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types/api';
import type { SortField, SortOrder } from '@/lib/products/filterStorage';

// Server-response data table: rows, sorting, and pagination are all driven by
// the backend list response (sorting a column re-queries the API).
export default function ProductsTable({
  products,
  isAdmin,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: {
  products: Product[];
  isAdmin: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const SortHead = ({
    field,
    label,
    align,
  }: {
    field: SortField;
    label: string;
    align?: 'right';
  }) => (
    <TableCell align={align} sortDirection={sortBy === field ? sortOrder : false}>
      <TableSortLabel
        active={sortBy === field}
        direction={sortBy === field ? sortOrder : 'asc'}
        onClick={() => onSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 64 }}>Image</TableCell>
            <SortHead field="name" label="Product" />
            <TableCell>Category</TableCell>
            <SortHead field="price" label="Price" align="right" />
            <SortHead field="stock" label="Stock" align="right" />
            {isAdmin && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((p) => {
            const img = assetUrl(p.images?.[0]);
            const out = p.stock <= 0;
            return (
              <TableRow key={p._id} hover>
                <TableCell>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: 'action.hover',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {img ? (
                      <Box
                        component="img"
                        src={img}
                        alt=""
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <ImageOutlined
                        fontSize="small"
                        sx={{ color: 'text.disabled' }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <MuiLink
                    component={Link}
                    href={`/products/${p._id}`}
                    underline="hover"
                    color="inherit"
                    sx={{ fontWeight: 600 }}
                  >
                    {p.name}
                  </MuiLink>
                </TableCell>
                <TableCell>
                  {p.category ? (
                    <Chip label={p.category} size="small" variant="outlined" />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell align="right">{formatPrice(p.price)}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={out ? 'Out of stock' : p.stock}
                    size="small"
                    color={out ? 'default' : 'success'}
                    variant={out ? 'outlined' : 'filled'}
                  />
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/products/${p._id}`}
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEdit(p)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(p)}
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
