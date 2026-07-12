'use client';

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CloudUploadOutlined, CloseOutlined } from '@mui/icons-material';
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from '@/lib/api/productsApi';
import { getErrorMessage } from '@/lib/api/parseError';
import { assetUrl } from '@/lib/config';
import type { Product } from '@/lib/types/api';

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

type FormShape = {
  name: string;
  price: string;
  stock: string;
  category: string;
  description: string;
};

const EMPTY: FormShape = {
  name: '',
  price: '',
  stock: '',
  category: '',
  description: '',
};

export default function ProductFormDialog({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product?: Product | null;
  onClose: (saved?: boolean) => void;
}) {
  const isEdit = Boolean(product);
  const [createProduct, createState] = useCreateProductMutation();
  const [updateProduct, updateState] = useUpdateProductMutation();
  const isLoading = createState.isLoading || updateState.isLoading;

  const [form, setForm] = useState<FormShape>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormShape, string>>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // (Re)initialise when the dialog opens or the target product changes.
  useEffect(() => {
    if (!open) return;
    setForm({
      name: product?.name ?? '',
      price: product ? String(product.price) : '',
      stock: product ? String(product.stock) : '',
      category: product?.category ?? '',
      description: product?.description ?? '',
    });
    setFiles([]);
    setErrors({});
    setSubmitError(null);
  }, [open, product]);

  // Build + revoke object URLs for image previews.
  useEffect(() => {
    const next = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPreviews(next);
    return () => next.forEach((p) => URL.revokeObjectURL(p.url));
  }, [files]);

  const update =
    (key: keyof FormShape) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const rejected: string[] = [];
    const valid = picked
      .filter((f) => {
        if (!f.type.startsWith('image/')) {
          rejected.push(`${f.name}: not an image`);
          return false;
        }
        if (f.size > MAX_SIZE) {
          rejected.push(`${f.name}: over 5MB`);
          return false;
        }
        return true;
      })
      .slice(0, MAX_FILES);
    setFiles(valid);
    setSubmitError(rejected.length ? rejected.join(' • ') : null);
    e.target.value = ''; // allow re-selecting the same file
  };

  const removeFile = (idx: number) =>
    setFiles((fs) => fs.filter((_, i) => i !== idx));

  const validate = () => {
    const e: Partial<Record<keyof FormShape, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length > 120) e.name = 'Max 120 characters';

    const price = Number(form.price);
    if (form.price.trim() === '' || Number.isNaN(price))
      e.price = 'Enter a valid price';
    else if (price < 0) e.price = 'Price cannot be negative';

    if (form.stock.trim() !== '') {
      const stock = Number(form.stock);
      if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock))
        e.stock = 'Enter a whole number ≥ 0';
    }
    if (form.category.trim().length > 60) e.category = 'Max 60 characters';
    if (form.description.trim().length > 2000)
      e.description = 'Max 2000 characters';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('price', String(Number(form.price)));
    if (form.stock.trim() !== '') fd.append('stock', String(Number(form.stock)));
    // Always send category/description (empty included) so an admin can CLEAR
    // them on edit — the backend PATCH keeps any field that isn't sent.
    fd.append('category', form.category.trim());
    fd.append('description', form.description.trim());
    files.forEach((f) => fd.append('images', f));

    try {
      if (isEdit && product) {
        await updateProduct({ id: product._id, body: fd }).unwrap();
      } else {
        await createProduct(fd).unwrap();
      }
      onClose(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !isLoading && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>{isEdit ? 'Edit product' : 'Add product'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <TextField
              label="Name"
              value={form.name}
              onChange={update('name')}
              error={Boolean(errors.name)}
              helperText={errors.name}
              required
              autoFocus
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Price"
                value={form.price}
                onChange={update('price')}
                error={Boolean(errors.price)}
                helperText={errors.price}
                required
                fullWidth
                inputMode="decimal"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Stock"
                value={form.stock}
                onChange={update('stock')}
                error={Boolean(errors.stock)}
                helperText={errors.stock || 'Defaults to 0'}
                fullWidth
                inputMode="numeric"
              />
            </Stack>
            <TextField
              label="Category"
              value={form.category}
              onChange={update('category')}
              error={Boolean(errors.category)}
              helperText={errors.category}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={update('description')}
              error={Boolean(errors.description)}
              helperText={errors.description}
              fullWidth
              multiline
              minRows={3}
            />

            {isEdit && product?.images?.length ? (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Current images — uploading new ones replaces them
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}
                >
                  {product.images.map((img) => (
                    <Box
                      key={img}
                      component="img"
                      src={assetUrl(img)}
                      alt=""
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            ) : null}

            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadOutlined />}
              >
                {files.length
                  ? `${files.length} image(s) selected`
                  : 'Upload images'}
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={onFiles}
                />
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Up to 5 images, 5MB each (jpg, png, webp, gif).
              </Typography>
              {previews.length > 0 && (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}
                >
                  {previews.map((p, i) => (
                    <Box key={p.url} sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        src={p.url}
                        alt={p.name}
                        sx={{
                          width: 64,
                          height: 64,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeFile(i)}
                        aria-label="Remove image"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <CloseOutlined fontSize="inherit" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => onClose()} disabled={isLoading} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading
              ? 'Saving…'
              : isEdit
                ? 'Save changes'
                : 'Create product'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
