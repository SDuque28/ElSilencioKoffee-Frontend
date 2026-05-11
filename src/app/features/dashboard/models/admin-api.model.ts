export type AdminOrderPaymentStatus = 'PENDING' | 'PAID';
export type AdminDeliveryStatus = 'PENDING' | 'OUT_FOR_SHIPMENT' | 'DELIVERED' | 'CANCELLED';

export interface AdminOrderApi {
  id: number | string;
  userId: number | string;
  orderDate: string;
  totalAmount: number | string;
  status: AdminOrderPaymentStatus;
  notes?: string | null;
  items?: AdminOrderItemApi[];
  shippingInformation?: AdminShippingApi | null;
  payment?: AdminPaymentApi | null;
  deliveryOrder?: AdminDeliveryApi | null;
  customer?: AdminOrderCustomerApi | null;
}

export interface AdminOrderItemApi {
  detailId: number | string;
  productId: number | string | null;
  productName: string;
  quantity: number | string;
  unitPrice: number | string;
  subtotal: number | string;
}

export interface AdminShippingApi {
  address: string;
  country: string;
  city: string;
  neighborhood: string;
  referenceDetails?: string | null;
}

export interface AdminPaymentApi {
  paymentMethod: string;
  maskedCardNumber: string;
  status: string;
  transactionReference: string;
  paidAt: string;
}

export interface AdminDeliveryApi {
  id: number | string;
  status: AdminDeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderCustomerApi {
  id: number | string;
  username: string;
  email: string;
}

export interface AdminUserApi {
  id: number | string;
  username: string;
  email: string;
  activo: boolean;
  createdAt: string;
}

export interface AdminUserCreateRequest {
  username: string;
  email: string;
  password: string;
}

export interface AdminUserUpdateRequest {
  username?: string;
  email?: string;
  activo?: boolean;
}

export interface AdminUserRoleApi {
  usuarioId: number | string;
  rolId: number | string;
  username?: string | null;
  rolNombre?: string | null;
}

export interface AdminProductApi {
  id: number;
  name: string;
  imageUrl: string | null;
  price: number | string;
  presentationId: number | string | null;
  productionId: number | string | null;
  stockQuantity?: number | string | null;
}

export interface AdminProductCreateRequest {
  name: string;
  imageUrl: string | null;
  price: number;
  presentationId: number;
  productionId: number;
}

export type AdminProductUpdateRequest = AdminProductCreateRequest;

export interface AdminInventoryApi {
  id: number | string;
  productId: number | string;
  productName: string;
  productImageUrl: string | null;
  stockQuantity: number | string;
}

export interface AdminProductionApi {
  id: number | string;
  sectionId: number | string;
  sectionName: string;
  sectionLocation: string;
  varietyId: number | string;
  varietyName: string;
  quantityKg: number | string;
  collectionDate: string;
}

export interface AdminEnvironmentMetricApi {
  id: number | string;
  metricType: string;
  value: number | string;
  unit: string;
  measuredAt: string;
  sectionId?: number | string | null;
  sectionName?: string | null;
  sectionLocation?: string | null;
}

export interface AdminSnapshotApi {
  orders: AdminOrderApi[];
  users: AdminUserApi[];
  products: AdminProductApi[];
  inventory: AdminInventoryApi[];
  production: AdminProductionApi[];
  environmentMetrics: AdminEnvironmentMetricApi[];
}
