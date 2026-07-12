'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBackOutlined,
  DeleteOutlined,
  EditOutlined,
  ImageOutlined,
} from '@mui/icons-material';
import {
  useDeleteProductMutation,
  useGetProductQuery,
} from '@/lib/api/productsApi';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { getErrorMessage } from '@/lib/api/parseError';
import { assetUrl } from '@/lib/config';
import { formatDate, formatPrice } from '@/lib/format';
import ProductFormDialog from '@/components/products/ProductFormDialog';
import ConfirmDialog from '@/components/products/ConfirmDialog';

export default function ProductDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const router = useRouter();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';

  const { data: product, isLoading, error } = useGetProductQuery(id, {
    skip: !id,
  });
  const [deleteProduct, deleteState] = useDeleteProductMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  // Reset the selected thumbnail when the product (or its image set) changes.
  useEffect(() => {
    setActiveImage(0);
  }, [product?._id, product?.images?.length]);

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteProduct(product._id).unwrap();
      router.replace('/products');
    } catch {
      setConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <BackButton />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error ? getErrorMessage(error) : 'Product not found.'}
        </Alert>
      </Container>
    );
  }

  const images = product.images ?? [];
  const mainImg = assetUrl(images[activeImage]);
  const inStock = product.stock > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <BackButton />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ mt: 2 }}>
        {/* Gallery */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              aspectRatio: '4 / 3',
              bgcolor: 'action.hover',
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {mainImg ? (
              <Box
                component="img"
                src={mainImg}
                alt={product.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <ImageOutlined sx={{ fontSize: 64, color: 'text.disabled' }} />
            )}
          </Box>
          {images.length > 1 && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}
            >
              {images.map((img, i) => (
                <Box
                  key={img}
                  component="img"
                  src={assetUrl(img)}
                  alt=""
                  onClick={() => setActiveImage(i)}
                  sx={{
                    width: 72,
                    height: 72,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: i === activeImage ? 'primary.main' : 'divider',
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={2}>
            <Box>
              {product.category && (
                <Chip
                  label={product.category}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              )}
              <Typography variant="h4">{product.name}</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {formatPrice(product.price)}
            </Typography>
            <Chip
              label={inStock ? `${product.stock} in stock` : 'Out of stock'}
              color={inStock ? 'success' : 'default'}
              variant={inStock ? 'filled' : 'outlined'}
              sx={{ alignSelf: 'flex-start' }}
            />
            {product.description && (
              <>
                <Divider />
                <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {product.description}
                </Typography>
              </>
            )}
            <Divider />
            <Stack spacing={0.5}>
              <MetaRow label="Added" value={formatDate(product.createdAt)} />
              <MetaRow
                label="Last updated"
                value={formatDate(product.updatedAt)}
              />
              <MetaRow label="Product ID" value={product._id} />
            </Stack>
            {isAdmin && (
              <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<EditOutlined />}
                  onClick={() => setEditOpen(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlined />}
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>
      </Stack>

      <ProductFormDialog
        open={editOpen}
        product={product}
        onClose={() => setEditOpen(false)}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete product"
        message={`Delete "${product.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteState.isLoading}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </Container>
  );
}

function BackButton() {
  return (
    <Button
      component={Link}
      href="/products"
      startIcon={<ArrowBackOutlined />}
      color="inherit"
    >
      Back to products
    </Button>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      {children}
    </Box>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
