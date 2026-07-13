import { request } from './api';

export interface HeroSlide {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  link_url: string | null;
  link_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const adminService = {

  // ── Users ─────────────────────────────────────────────────────────────
  async getUsers(limit = 100) {
    const data = await request('/admin/users');
    return (data ?? []).map((u: any) => ({
      id:       u.id,
      name:     u.full_name,
      email:    u.email,
      role:     u.role === 'organizer' ? 'Organizer' : u.role === 'admin' ? 'Admin' : 'Customer',
      status:   u.is_suspended ? 'Suspended' : 'Active',
      joined:   new Date(u.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }),
      tickets:  0,
      spent:    0,
    }));
  },

  async suspendUser(id: string, suspend: boolean) {
    await request(`/admin/users/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ suspend }),
    });
  },

  async changeUserRole(id: string, role: 'customer' | 'organizer' | 'admin') {
    await request(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async getOrganizers() {
    const data = await request('/admin/users');
    return (data ?? []).filter((u: any) => u.role === 'organizer').map((u: any) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      is_verified: u.is_verified,
      is_suspended: u.is_suspended,
      created_at: u.created_at
    }));
  },

  async verifyOrganizer(id: string) {
    await request(`/admin/users/${id}/verify`, {
      method: 'PATCH'
    });
  },

  async unverifyOrganizer(id: string) {
    await request(`/admin/users/${id}/unverify`, {
      method: 'PATCH'
    });
  },

  async deleteUser(id: string) {
    await request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  async getNotifications() {
    return request('/admin/notifications');
  },

  async markNotificationAsRead(id: string) {
    await request(`/admin/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  async getOrganizerDetails(id: string) {
    return request(`/admin/organizers/${id}/details`);
  },

  // ── Orders ────────────────────────────────────────────────────────────
  async getOrders(limit = 100, offset = 0) {
    return request('/orders');
  },

  // ── Payments ──────────────────────────────────────────────────────────
  async getPayments(limit = 100, offset = 0) {
    const data = await request('/orders/payments');
    return (data ?? []).map((p: any) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      method: p.method,
      mpesa_code: p.mpesa_code,
      mpesa_phone: p.mpesa_phone,
      status: p.status,
      created_at: p.created_at,
      failure_reason: p.failure_reason,
      orders: {
        event_id: p.order_id,
        quantity: p.quantity,
        events: { title: p.event_title },
        profiles: { full_name: p.customer_name, email: p.customer_email }
      }
    }));
  },

  // ── Payouts ───────────────────────────────────────────────────────────
  async getPayouts(limit = 100) {
    const data = await request('/admin/payouts');
    return (data ?? []).map((p: any) => ({
      ...p,
      profiles: { full_name: p.organizer_name },
      events: { title: p.event_title }
    }));
  },

  async updatePayoutStatus(id: string, status: 'completed' | 'processing' | 'failed') {
    await request(`/admin/payouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // ── Refunds ───────────────────────────────────────────────────────────
  async getRefunds(limit = 100) {
    const data = await request('/admin/refunds');
    return (data ?? []).map((r: any) => ({
      ...r,
      profiles: { full_name: r.customer_name, email: r.customer_email },
      orders: { reference: r.order_reference, events: { title: r.event_title } }
    }));
  },

  async updateRefundStatus(id: string, status: 'approved' | 'rejected', adminNote?: string) {
    await request(`/admin/refunds/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_note: adminNote ?? null }),
    });
  },

  // ── Announcements ─────────────────────────────────────────────────────
  async getAnnouncements() {
    return request('/admin/announcements');
  },

  async createAnnouncement(title: string, body: string, audience: string) {
    await request('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, body, audience }),
    });
  },

  // ── Audit Logs ────────────────────────────────────────────────────────
  async getAuditLogs(limit = 100) {
    const data = await request('/admin/audit-logs');
    return (data ?? []).map((l: any) => ({
      ...l,
      profiles: { full_name: l.actor_name }
    }));
  },

  async log(action: string, target: string, metadata?: Record<string, unknown>) {
    try {
      await request('/admin/audit-logs', {
        method: 'POST',
        body: JSON.stringify({ action, target, metadata }),
      });
    } catch {}
  },

  // ── Hero Slides ───────────────────────────────────────────────────────
  async getHeroSlides(): Promise<HeroSlide[]> {
    return request('/hero-slides/all');
  },

  async createHeroSlide(data: Partial<HeroSlide>): Promise<HeroSlide> {
    return request('/hero-slides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateHeroSlide(id: string, data: Partial<HeroSlide>): Promise<HeroSlide> {
    return request(`/hero-slides/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteHeroSlide(id: string): Promise<void> {
    await request(`/hero-slides/${id}`, {
      method: 'DELETE',
    });
  },

  async getPublicHeroSlides(): Promise<HeroSlide[]> {
    return request('/hero-slides');
  },

  // ── Dashboard stats ───────────────────────────────────────────────────
  async getDashboardStats() {
    return request('/admin/stats');
  },

  // ── Analytics ─────────────────────────────────────────────────────────
  async getAnalyticsTrends(period: '7d' | '30d' | '90d' | '1y') {
    return request(`/admin/analytics/trends?period=${period}`);
  },

  async getTopEvents() {
    return request('/admin/analytics/top-events');
  },

  async getTopLocations() {
    return request('/admin/analytics/top-locations');
  },
  // ── Payment Gateways ──────────────────────────────────────────────────
  async getPaymentMethods(): Promise<any[]> {
    return request('/payment-methods/admin');
  },

  async updatePaymentMethod(id: string, data: Record<string, any>) {
    return request(`/payment-methods/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ── Admin Roles ───────────────────────────────────────────────────────
  async getRoles(): Promise<any[]> {
    return request('/admin/roles');
  },

  async createRole(data: { name: string; description: string; permissions: string[]; color: string; users?: number }): Promise<any> {
    return request('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRole(id: string, data: Record<string, any>): Promise<any> {
    return request(`/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteRole(id: string): Promise<void> {
    await request(`/admin/roles/${id}`, {
      method: 'DELETE',
    });
  },

  // ── Analytics Meta ────────────────────────────────────────────────────
  async getAnalyticsMeta(): Promise<{ conversion_rate: number; churn_rate: number }> {
    return request('/admin/analytics/meta');
  },

  // ── Settings ──────────────────────────────────────────────────────────
  async getSettings(): Promise<Record<string, string>> {
    return request('/settings/admin');
  },

  async updateSettings(settings: Record<string, string>): Promise<Record<string, string>> {
    return request('/settings/admin', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // ── Categories ───────────────────────────────────────────────────────
  async getCategories(): Promise<any[]> {
    return request('/admin/categories');
  },

  async createCategory(data: { name: string; slug: string; icon?: string }): Promise<any> {
    return request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: Record<string, any>): Promise<any> {
    return request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // ── Email Logs ───────────────────────────────────────────────────────
  async getEmailLogs(params?: { search?: string; from?: string; to?: string }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.from)   qs.set('from', params.from);
    if (params?.to)     qs.set('to', params.to);
    const q = qs.toString();
    return request(`/admin/email-logs${q ? `?${q}` : ''}`);
  },

  // ── Sales Reports ────────────────────────────────────────────────────
  async getSalesReports(params?: { period?: string; from?: string; to?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.period) qs.set('period', params.period);
    if (params?.from)   qs.set('from', params.from);
    if (params?.to)     qs.set('to', params.to);
    const q = qs.toString();
    return request(`/admin/reports/sales${q ? `?${q}` : ''}`);
  },

  // ── Event Performance ────────────────────────────────────────────────
  async getEventPerformance(): Promise<any[]> {
    return request('/admin/analytics/event-performance');
  },

  // ── User Segments / Analytics ────────────────────────────────────────
  async getUserSegments(): Promise<any> {
    return request('/admin/analytics/user-segments');
  },

  // ── Activity Logs ────────────────────────────────────────────────────
  async getActivityLogs(params?: { search?: string; action?: string }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.action) qs.set('action', params.action);
    const q = qs.toString();
    return request(`/admin/activity-logs${q ? `?${q}` : ''}`);
  },

  // ── Backup & Restore ─────────────────────────────────────────────────
  async getBackups(): Promise<any[]> {
    return request('/admin/backups');
  },

  async createBackup(): Promise<any> {
    return request('/admin/backups/create', { method: 'POST' });
  },

  async restoreBackup(filename: string): Promise<any> {
    return request('/admin/backups/restore', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    });
  },

  async deleteBackup(name: string): Promise<void> {
    await request(`/admin/backups/${name}`, { method: 'DELETE' });
  },
};
