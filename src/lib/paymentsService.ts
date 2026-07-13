import { request } from './api';

export const paymentsService = {

  async initiate(orderId: string, customerId: string, amount: number, phone: string): Promise<any> {
    // In our Express backend, the payment record is already transactionally created inside POST /orders.
    // Fetch it directly from the endpoint.
    return request(`/orders/${orderId}/payment`);
  },

  async confirm(paymentId: string, mpesaCode: string) {
    await request('/orders/confirm-payment-direct', {
      method: 'POST',
      body: JSON.stringify({
        payment_id: paymentId,
        mpesa_code: mpesaCode
      })
    });
  },

  async fail(paymentId: string, reason: string) {
    await request('/orders/fail-payment-direct', {
      method: 'POST',
      body: JSON.stringify({
        payment_id: paymentId,
        reason
      })
    });
  },

  async getStatus(paymentId: string): Promise<any> {
    const data = await request(`/orders/payment-direct/${paymentId}`);
    return data.status;
  },

  async getAll(limit = 50, offset = 0) {
    return request('/orders/payments');
  },

};
