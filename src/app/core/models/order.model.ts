export type OrderStatus =
  | 'PENDING'
  | 'NON PAID'
  | 'PAID'
  | 'SHIPPED'
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

export interface Order {
  id: string | number;
  orderDate: string;
  status: OrderStatus | string;
  totalAmount: number;
  userId: string | number;
  items: OrderItem[];
}

export interface OrdersListResult {
  orders: Order[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
}
