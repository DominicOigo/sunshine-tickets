import { request } from './api';

export const organizerService = {

  async getMyOrders(organizerId: string, limit = 100) {
    return request('/orders/organizer');
  },

  async getOrdersByEvent(eventId: string) {
    return request(`/orders/event/${eventId}`);
  },

  async getMyPayouts(organizerId: string) {
    return request('/admin/organizer-payouts');
  },

  async requestPayout(organizerId: string, eventId: string, grossAmount: number) {
    await request('/admin/organizer-payouts', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        gross_amount: grossAmount
      })
    });
  },

  async getMyEventStats(organizerId: string) {
    return request('/events/organizer/stats');
  },

  async getMyEvents() {
    return request('/events/mine');
  },

  async getCategories() {
    return request('/events/categories');
  },

  // ── Discounts ─────────────────────────────────────────────────────────
  async getDiscounts() {
    return request('/discounts');
  },

  async createDiscount(code: string, discountPercent: number, maxUses?: number) {
    return request('/discounts', {
      method: 'POST',
      body: JSON.stringify({ code, discount_percent: discountPercent, max_uses: maxUses })
    });
  },

  async toggleDiscount(id: string, isActive: boolean) {
    return request(`/discounts/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  },

  async deleteDiscount(id: string) {
    return request(`/discounts/${id}`, {
      method: 'DELETE'
    });
  },

  // ── Team Members ──────────────────────────────────────────────────────
  async getTeamMembers() {
    return request('/team');
  },

  async addTeamMember(name: string, email: string, role: string) {
    return request('/team', {
      method: 'POST',
      body: JSON.stringify({ name, email, role })
    });
  },

  async deleteTeamMember(id: string) {
    return request(`/team/${id}`, {
      method: 'DELETE'
    });
  },

  // ── Announcements ─────────────────────────────────────────────────────
  async getAnnouncements() {
    return request('/announcements');
  },
};
