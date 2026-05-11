import type { DeliveryOrder, Order, OrderItem, PaymentSummary } from '../../../core/models/order.model';

export type OrderBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface OrderBadgePresentation {
  label: string;
  variant: OrderBadgeVariant;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
});

const detailedDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatOrderCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatOrderCode(orderId: string | number): string {
  const numericId = Number(orderId);

  if (Number.isInteger(numericId) && numericId > 0) {
    return `#COF-${String(numericId).padStart(4, '0')}`;
  }

  return `#${orderId}`;
}

export function formatOrderDate(value: string, style: 'compact' | 'detailed' = 'compact'): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return style === 'detailed'
    ? detailedDateFormatter.format(parsedDate)
    : compactDateFormatter.format(parsedDate);
}

export function getPaymentStatusPresentation(order: Pick<Order, 'status' | 'payment'>): OrderBadgePresentation {
  if (order.payment?.status === 'DECLINED') {
    return {
      label: 'Payment Declined',
      variant: 'danger',
    };
  }

  if (isPaidOrder(order.status, order.payment)) {
    return {
      label: 'Paid',
      variant: 'success',
    };
  }

  return {
    label: 'Payment Pending',
    variant: 'warning',
  };
}

export function getDeliveryStatusPresentation(order: Pick<Order, 'status' | 'deliveryOrder'>): OrderBadgePresentation {
  if (order.status === 'CANCELLED') {
    return {
      label: 'Cancelled',
      variant: 'danger',
    };
  }

  switch (order.deliveryOrder?.status) {
    case 'OUT_FOR_SHIPMENT':
      return {
        label: 'Out for Shipment',
        variant: 'info',
      };
    case 'DELIVERED':
      return {
        label: 'Delivered',
        variant: 'success',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        variant: 'danger',
      };
    case 'PENDING':
      return {
        label: 'Preparing Shipment',
        variant: 'warning',
      };
    default:
      return isPaidOrder(order.status)
        ? {
            label: 'Preparing Shipment',
            variant: 'warning',
          }
        : {
            label: 'Awaiting Payment',
            variant: 'neutral',
          };
  }
}

export function getPrimaryOrderStatusPresentation(
  order: Pick<Order, 'status' | 'payment' | 'deliveryOrder'>,
): OrderBadgePresentation {
  if (order.status === 'CANCELLED') {
    return {
      label: 'Cancelled',
      variant: 'danger',
    };
  }

  if (order.deliveryOrder?.status === 'DELIVERED') {
    return {
      label: 'Delivered',
      variant: 'success',
    };
  }

  if (order.deliveryOrder?.status === 'OUT_FOR_SHIPMENT') {
    return {
      label: 'Out for Shipment',
      variant: 'info',
    };
  }

  if (isPaidOrder(order.status, order.payment)) {
    return {
      label: 'Paid',
      variant: 'success',
    };
  }

  return {
    label: 'Pending Payment',
    variant: 'warning',
  };
}

export function buildOrderItemsPreview(items: OrderItem[], maxItems = 2): string[] {
  return items
    .slice(0, maxItems)
    .map((item) => `${item.productName} x${item.quantity}`);
}

export function getOrderItemsSummary(items: OrderItem[]): string {
  const lineItems = items.length;
  const units = items.reduce((sum, item) => sum + item.quantity, 0);

  if (lineItems === 0) {
    return 'No items';
  }

  const lineItemLabel = `${lineItems} ${lineItems === 1 ? 'line item' : 'line items'}`;
  const unitLabel = `${units} ${units === 1 ? 'unit' : 'units'}`;
  return `${lineItemLabel} · ${unitLabel}`;
}

export function getShippingDestination(order: Pick<Order, 'shippingInformation'>): string | null {
  const shippingInformation = order.shippingInformation;

  if (!shippingInformation) {
    return null;
  }

  return [shippingInformation.city, shippingInformation.neighborhood]
    .filter((value) => !!value)
    .join(', ');
}

export function getPaymentMethodSummary(payment: PaymentSummary | null | undefined): string | null {
  if (!payment) {
    return null;
  }

  return `${toTitleCase(payment.paymentMethod)} · ${payment.maskedCardNumber}`;
}

export function getDeliveryUpdateSummary(deliveryOrder: DeliveryOrder | null | undefined): string | null {
  if (!deliveryOrder) {
    return null;
  }

  return `Updated ${formatOrderDate(deliveryOrder.updatedAt, 'detailed')}`;
}

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function isPaidOrder(status: string | undefined, payment?: PaymentSummary | null): boolean {
  return status === 'PAID' || payment?.status === 'APPROVED';
}
