// Shared types mirroring the NestJS backend contract (all routes under /api).
// Every success response is wrapped as { success, message, data }.

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

// Shape returned by the backend's global HttpExceptionFilter on any error.
export interface ApiErrorBody {
  success: false;
  statusCode: number;
  error: string;
  // A single string for most errors, an array for ValidationPipe (400) errors.
  message: string | string[];
  path: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
}

// data returned by POST /auth/register and POST /auth/login.
export interface AuthData {
  user: AuthUser;
  accessToken: string;
}

// data returned by GET /auth/profile — only the decoded token identity.
export interface ProfileData {
  userId: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  createdBy: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilter {
  name?: string;
  category?: string;
  createdFrom?: string;
  createdTo?: string;
  inStock?: 'true' | 'false';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export type MailTemplate = 'welcome' | 'reset-password' | 'invoice';

export interface MailRequest {
  to: string;
  name?: string;
  template?: MailTemplate;
}

export interface MailSendResult {
  messageId: string;
  previewUrl: string | false;
  transport: string;
}
