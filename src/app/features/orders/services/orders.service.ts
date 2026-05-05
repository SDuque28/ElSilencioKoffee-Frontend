import { inject, Injectable } from '@angular/core';
import { map, of, type Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { CheckoutRequest, CheckoutResult } from '../../../core/models/checkout.model';
import {
  isApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from '../../../core/models/api-response.model';
import type {
  DeliveryOrder,
  Order,
  OrderCustomer,
  OrderItem,
  OrdersListResult,
  PaymentSummary,
  ShippingInformation,
} from '../../../core/models/order.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface OrderApiResponse {
  id: string | number;
  items?: OrderItemApiResponse[];
  orderDate: string;
  status: string;
  totalAmount: number;
  userId: string | number;
  notes?: string | null;
  shippingInformation?: ShippingInformationApiResponse | null;
  payment?: PaymentSummaryApiResponse | null;
  deliveryOrder?: DeliveryOrderApiResponse | null;
  customer?: OrderCustomerApiResponse | null;
}

interface OrderCustomerApiResponse {
  id: string | number;
  username: string;
  email: string;
}

interface ShippingInformationApiResponse {
  address: string;
  country: string;
  city: string;
  neighborhood: string;
  referenceDetails?: string | null;
}

interface PaymentSummaryApiResponse {
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD';
  maskedCardNumber: string;
  status: 'APPROVED' | 'DECLINED';
  transactionReference: string;
  paidAt: string;
}

interface DeliveryOrderApiResponse {
  id: string | number;
  status: 'PENDING' | 'OUT_FOR_SHIPMENT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

interface OrderItemApiResponse {
  detailId: string | number;
  productId: string | number | null;
  productName: string;
  quantity: number;
  subtotal: number;
  unitPrice: number;
}

interface CheckoutApiResponse {
  orderId: string | number;
  orderDate: string;
  orderStatus: string;
  totalAmount: number;
  notes?: string | null;
  items: OrderItemApiResponse[];
  shippingInformation: ShippingInformationApiResponse;
  payment: PaymentSummaryApiResponse;
  deliveryOrder: DeliveryOrderApiResponse;
}

interface OrderCreateApiItemRequest {
  productId: number;
  quantity: number;
}

interface OrderCreateApiRequest {
  items: OrderCreateApiItemRequest[];
}

interface OrdersPageApiResponse {
  content: OrderApiResponse[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);

  listOrders(): Observable<ApiResponse<OrdersListResult>> {
    if (this.authService.isAdmin()) {
      return this.api
        .get<OrderApiResponse[]>('api/v1/admin/orders', {
          baseUrl: environment.authApiUrl,
        })
        .pipe(map((response) => this.toOrdersListResultResponse(response, true)));
    }

    return this.api
      .get<OrderApiResponse[]>('users/me/orders', {
        baseUrl: environment.authApiUrl,
      })
      .pipe(map((response) => this.toOrdersListResultResponse(response, false)));
  }

  getOrder(orderId: string | number): Observable<ApiResponse<Order>> {
    const endpoint = this.authService.isAdmin()
      ? `api/v1/admin/orders/${orderId}`
      : `orders/${orderId}`;

    return this.api
      .get<OrderApiResponse>(endpoint, {
        baseUrl: environment.authApiUrl,
      })
      .pipe(map((response) => this.toOrderResponse(response)));
  }

  payOrder(orderId: string | number): Observable<ApiResponse<Order>> {
    return this.api
      .post<OrderApiResponse>(
        `api/v1/orders/${orderId}/pay`,
        {},
        {
          baseUrl: environment.authApiUrl,
        },
      )
      .pipe(map((response) => this.toOrderResponse(response)));
  }

  createOrderFromCart(items: Array<{ backendProductId: number; quantity: number }>): Observable<ApiResponse<Order>> {
    if (items.length === 0) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Cart is empty.',
        code: 400,
      };

      return of(errorResponse);
    }

    return this.api
      .post<OrderApiResponse>(
        'orders',
        this.toCreateOrderRequest(items),
        {
          baseUrl: environment.authApiUrl,
        },
      )
      .pipe(map((response) => this.toOrderResponse(response)));
  }

  checkout(payload: CheckoutRequest): Observable<ApiResponse<CheckoutResult>> {
    return this.api
      .post<CheckoutApiResponse>('api/v1/checkout', payload, {
        baseUrl: environment.authApiUrl,
      })
      .pipe(map((response) => this.toCheckoutResponse(response)));
  }

  private toOrdersListResultResponse(
    response: ApiResponse<OrdersPageApiResponse | OrderApiResponse[]>,
    isAdminView: boolean,
  ): ApiResponse<OrdersListResult> {
    if (!isApiSuccessResponse(response)) {
      return response;
    }

    if (isAdminView) {
      if (Array.isArray(response.data)) {
        const orders = response.data.map((order) => this.toOrder(order));

        return {
          ...response,
          data: {
            orders,
            totalElements: orders.length,
            totalPages: orders.length > 0 ? 1 : 0,
            pageNumber: 0,
          },
        };
      }

      const pageResponse = response.data;

      return {
        ...response,
        data: {
          orders: (pageResponse.content ?? []).map((order) => this.toOrder(order)),
          totalElements: pageResponse.totalElements,
          totalPages: pageResponse.totalPages,
          pageNumber: pageResponse.number,
        },
      };
    }

    const orders = (response.data as OrderApiResponse[]).map((order) => this.toOrder(order));

    return {
      ...response,
      data: {
        orders,
        totalElements: orders.length,
        totalPages: orders.length > 0 ? 1 : 0,
        pageNumber: 0,
      },
    };
  }

  private toOrderResponse(response: ApiResponse<OrderApiResponse>): ApiResponse<Order> {
    if (!isApiSuccessResponse(response)) {
      return response;
    }

    return {
      ...response,
      data: this.toOrder(response.data),
    };
  }

  private toCheckoutResponse(response: ApiResponse<CheckoutApiResponse>): ApiResponse<CheckoutResult> {
    if (!isApiSuccessResponse(response)) {
      return response;
    }

    return {
      ...response,
      data: {
        orderId: response.data.orderId,
        orderDate: response.data.orderDate,
        orderStatus: response.data.orderStatus,
        totalAmount: Number(response.data.totalAmount),
        notes: response.data.notes ?? null,
        items: (response.data.items ?? []).map((item) => this.toOrderItem(item)),
        shippingInformation: this.toShippingInformation(response.data.shippingInformation),
        payment: this.toPaymentSummary(response.data.payment),
        deliveryOrder: this.toDeliveryOrder(response.data.deliveryOrder),
      },
    };
  }

  private toOrder(order: OrderApiResponse): Order {
    return {
      id: order.id,
      orderDate: order.orderDate,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      userId: order.userId,
      notes: order.notes ?? null,
      items: (order.items ?? []).map((item) => this.toOrderItem(item)),
      shippingInformation: order.shippingInformation
        ? this.toShippingInformation(order.shippingInformation)
        : null,
      payment: order.payment ? this.toPaymentSummary(order.payment) : null,
      deliveryOrder: order.deliveryOrder ? this.toDeliveryOrder(order.deliveryOrder) : null,
      customer: order.customer ? this.toCustomer(order.customer) : null,
    };
  }

  private toOrderItem(item: OrderItemApiResponse): OrderItem {
    return {
      detailId: item.detailId,
      productId: item.productId ?? null,
      productName: item.productName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    };
  }

  private toShippingInformation(
    shippingInformation: ShippingInformationApiResponse,
  ): ShippingInformation {
    return {
      address: shippingInformation.address,
      country: shippingInformation.country,
      city: shippingInformation.city,
      neighborhood: shippingInformation.neighborhood,
      referenceDetails: shippingInformation.referenceDetails ?? null,
    };
  }

  private toPaymentSummary(payment: PaymentSummaryApiResponse): PaymentSummary {
    return {
      paymentMethod: payment.paymentMethod,
      maskedCardNumber: payment.maskedCardNumber,
      status: payment.status,
      transactionReference: payment.transactionReference,
      paidAt: payment.paidAt,
    };
  }

  private toDeliveryOrder(deliveryOrder: DeliveryOrderApiResponse): DeliveryOrder {
    return {
      id: deliveryOrder.id,
      status: deliveryOrder.status,
      createdAt: deliveryOrder.createdAt,
      updatedAt: deliveryOrder.updatedAt,
    };
  }

  private toCustomer(customer: OrderCustomerApiResponse): OrderCustomer {
    return {
      id: customer.id,
      username: customer.username,
      email: customer.email,
    };
  }

  private toCreateOrderRequest(
    items: Array<{ backendProductId: number; quantity: number }>,
  ): OrderCreateApiRequest {
    return {
      items: items.map((item) => ({
        productId: item.backendProductId,
        quantity: item.quantity,
      })),
    };
  }
}
