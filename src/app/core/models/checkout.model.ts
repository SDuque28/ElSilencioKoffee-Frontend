import type {
  DeliveryOrder,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentSummary,
  ShippingInformation,
} from './order.model';

export interface CheckoutShippingInformationRequest {
  address: string;
  country: string;
  city: string;
  neighborhood: string;
  referenceDetails?: string | null;
}

export interface CheckoutPaymentRequest {
  paymentMethod: PaymentMethod;
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}

export interface CheckoutRequest {
  shippingInformation: CheckoutShippingInformationRequest;
  payment: CheckoutPaymentRequest;
  notes?: string | null;
}

export interface CheckoutResult {
  orderId: string | number;
  orderDate: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  notes?: string | null;
  items: OrderItem[];
  shippingInformation: ShippingInformation;
  payment: PaymentSummary;
  deliveryOrder: DeliveryOrder;
}
