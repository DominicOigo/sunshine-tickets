import { request } from './api';

export interface CreateOrderParams {
  eventId:    string;
  tierId:     string;
  quantity:   number;
  unitPrice:  number;
  phone:      string;
  paymentMethod?: string;
}

export const ordersService = {

  async create(params: CreateOrderParams): Promise<any> {
    const data = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        event_id:       params.eventId,
        tier_id:        params.tierId,
        quantity:       params.quantity,
        phone:          params.phone,
        payment_method: params.paymentMethod || 'mpesa',
      }),
    });
    // Return order shape. Our Express API returns { order, payment }
    return {
      ...data.order,
      payment: data.payment
    };
  },

  async getMyOrders() {
    const data = await request('/orders/mine');
    return (data ?? []).map((o: any) => ({
      ...o,
      payment_status: o.payment_status,
      mpesa_code: o.mpesa_code
    }));
  },

  async getOrdersByEvent(eventId: string) {
    return request(`/orders/event/${eventId}`);
  },

  // Admin: all orders
  async getAll(limit = 50, offset = 0) {
    return request('/orders');
  },

  async checkIn(orderId: string) {
    await request(`/orders/${orderId}/checkin`, {
      method: 'PATCH',
    });
  },

};
