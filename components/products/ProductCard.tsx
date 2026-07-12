'use client';

import Link from 'next/link';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DeleteOutlined,
  EditOutlined,
  ImageOutlined,
} from '@mui/icons-material';
import { assetUrl } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types/api';

export default function ProductCard({
  product,
  isAdmin,
  onEdit,
  onDelete,
}: {
  product: Product;
  isAdmin: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const img = assetUrl(product.images?.[0]);
  const outOfStock = product.stock <= 0;

  return (
    <Card
      variant="outlined"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <CardActionArea
        component={Link}
        href={`/products/${product._id}`}
        sx={{ flexGrow: 1, alignItems: 'stretch' }}
      >
        <Box
          sx={{
            height: 160,
            bgcolor: 'action.hover',
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          {img ? (
            <Box
              component="img"
              src={img}
              alt={product.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ImageOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />
          )}
        </Box>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {product.name}
          </Typography>
          <Typography variant="h6" color="primary" sx={{ mt: 0.5 }}>
            {formatPrice(product.price)}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}
          >
            {product.category && (
              <Chip label={product.category} size="small" variant="outlined" />
            )}
            <Chip
              label={outOfStock ? 'Out of stock' : `${product.stock} in stock`}
              size="small"
              color={outOfStock ? 'default' : 'success'}
              variant={outOfStock ? 'outlined' : 'filled'}
            />
          </Stack>
        </CardContent>
      </CardActionArea>
      {isAdmin && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            px: 1,
            py: 0.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'flex-end',
          }}
        >
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(product)}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(product)}
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Card>
  );
}
