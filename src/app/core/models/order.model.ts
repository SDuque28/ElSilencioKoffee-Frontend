export type OrderStatus =
  | 'PENDING'
  | 'NON PAID'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD';
export type PaymentStatus = 'APPROVED' | 'DECLINED';
export type DeliveryStatus =
  | 'PENDING'
  | 'OUT_FOR_SHIPMENT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  detailId: string | number;
  productId: string | number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderCustomer {
  id: string | number;
  username: string;
  email: string;
}

export interface ShippingInformation {
  address: string;
  country: string;
  city: string;
  neighborhood: string;
  referenceDetails: string | null;
}

export interface PaymentSummary {
  paymentMethod: PaymentMethod;
  maskedCardNumber: string;
  status: PaymentStatus;
  transactionReference: string;
  paidAt: string;
}

export interface DeliveryOrder {
  id: string | number;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string | number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  userId: string | number;
  notes?: string | null;
  items: OrderItem[];
  shippingInformation?: ShippingInformation | null;
  payment?: PaymentSummary | null;
  deliveryOrder?: DeliveryOrder | null;
  customer?: OrderCustomer | null;
}

export interface OrdersListResult {
  orders: Order[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
}
