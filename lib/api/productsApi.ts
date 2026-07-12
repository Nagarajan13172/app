import { apiSlice } from './apiSlice';
import type {
  ApiResponse,
  MailRequest,
  MailSendResult,
  PaginatedProducts,
  Product,
  ProductFilter,
} from '@/lib/types/api';

// Every remaining backend endpoint, reachable through Redux. Product write
// routes + mail routes require an admin JWT; the base query attaches the token.
export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/products
    listProducts: builder.query<PaginatedProducts, ProductFilter | void>({
      query: (filter) => ({
        url: '/products',
        method: 'GET',
        params: filter ?? undefined,
      }),
      transformResponse: (response: ApiResponse<PaginatedProducts>) =>
        response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({
                type: 'Product' as const,
                id: p._id,
              })),
              { type: 'Product' as const, id: 'LIST' },
            ]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),
    // GET /api/products/:id
    getProduct: builder.query<Product, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'GET' }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      providesTags: (_result, _err, id) => [{ type: 'Product', id }],
    }),
    // POST /api/products (admin, multipart/form-data)
    createProduct: builder.mutation<Product, FormData>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    // PATCH /api/products/:id (admin, multipart/form-data)
    updateProduct: builder.mutation<Product, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      transformResponse: (response: ApiResponse<Product>) => response.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Product', id: arg.id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    // POST /api/products/:id/image (admin, single 'image' field)
    uploadProductImage: builder.mutation<Product, { id: string; body: FormData }>(
      {
        query: ({ id, body }) => ({
          url: `/products/${id}/image`,
          method: 'POST',
          body,
        }),
        transformResponse: (response: ApiResponse<Product>) => response.data,
        invalidatesTags: (_r, _e, arg) => [{ type: 'Product', id: arg.id }],
      },
    ),
    // DELETE /api/products/:id (admin)
    deleteProduct: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiResponse<{ id: string }>) => response.data,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    // POST /api/mail/test (admin)
    sendTestMail: builder.mutation<MailSendResult, MailRequest>({
      query: (body) => ({ url: '/mail/test', method: 'POST', body }),
      transformResponse: (response: ApiResponse<MailSendResult>) => response.data,
    }),
    // POST /api/mail/queue (admin)
    queueMail: builder.mutation<{ queued: boolean }, MailRequest>({
      query: (body) => ({ url: '/mail/queue', method: 'POST', body }),
      transformResponse: (response: ApiResponse<{ queued: boolean }>) =>
        response.data,
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  useDeleteProductMutation,
  useSendTestMailMutation,
  useQueueMailMutation,
} = productsApi;
