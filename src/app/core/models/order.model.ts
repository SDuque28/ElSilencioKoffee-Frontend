export type OrderStatus =
  | 'NON PAID'
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  id: string | number;
  orderDate: string;
  status: OrderStatus | string;
  totalAmount: number;
  userId: string | number;
}

export interface OrdersListResult {
  orders: Order[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
}
