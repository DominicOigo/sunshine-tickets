// Auto-generated types matching supabase/schema.sql
// Update this file if you change the schema

export type UserRole    = 'customer' | 'organizer' | 'admin';
export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'rejected' | 'cancelled';
export type OrderStatus = 'pending' | 'confirmed' | 'refunded' | 'failed' | 'cancelled';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'cancelled';
export type PayoutStatus  = 'pending' | 'processing' | 'completed' | 'failed';
export type RefundStatus  = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:           string;
          email:        string;
          full_name:    string;
          avatar_url:   string | null;
          role:         UserRole;
          phone:        string | null;
          bio:          string | null;
          is_verified:  boolean;
          is_suspended: boolean;
          created_at:   string;
          updated_at:   string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      categories: {
        Row: { id: string; name: string; slug: string; icon: string | null; created_at: string };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      events: {
        Row: {
          id:             string;
          title:          string;
          description:    string;
          organizer_id:   string;
          category_id:    string | null;
          status:         EventStatus;
          image_url:      string | null;
          location:       string;
          coordinates:    { lat: number; lng: number } | null;
          start_date:     string;
          end_date:       string | null;
          is_trending:    boolean;
          admin_feedback: string | null;
          created_at:     string;
          updated_at:     string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      ticket_tiers: {
        Row: {
          id:          string;
          event_id:    string;
          name:        string;
          description: string | null;
          price:       number;
          capacity:    number;
          sold:        number;
          sort_order:  number;
          is_active:   boolean;
          sale_starts: string | null;
          sale_ends:   string | null;
          created_at:  string;
          updated_at:  string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_tiers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ticket_tiers']['Insert']>;
      };
      orders: {
        Row: {
          id:             string;
          reference:      string;
          customer_id:    string;
          event_id:       string;
          tier_id:        string;
          quantity:       number;
          unit_price:     number;
          total_amount:   number;
          status:         OrderStatus;
          phone:          string | null;
          qr_data:        string | null;
          checked_in:     boolean;
          checked_in_at:  string | null;
          created_at:     string;
          updated_at:     string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'reference' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      payments: {
        Row: {
          id:                  string;
          reference:           string;
          order_id:            string;
          customer_id:         string;
          amount:              number;
          method:              string;
          mpesa_code:          string | null;
          mpesa_phone:         string | null;
          checkout_request_id: string | null;
          status:              PaymentStatus;
          failure_reason:      string | null;
          created_at:          string;
          updated_at:          string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'reference' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      payouts: {
        Row: {
          id:           string;
          reference:    string;
          organizer_id: string;
          event_id:     string | null;
          gross_amount: number;
          fee_amount:   number;
          net_amount:   number;
          status:       PayoutStatus;
          method:       string;
          mpesa_phone:  string | null;
          bank_details: Record<string, string> | null;
          processed_at: string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['payouts']['Row'], 'id' | 'reference' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>;
      };
      refunds: {
        Row: {
          id:          string;
          reference:   string;
          order_id:    string;
          payment_id:  string | null;
          customer_id: string;
          amount:      number;
          reason:      string;
          status:      RefundStatus;
          admin_note:  string | null;
          created_at:  string;
          updated_at:  string;
        };
        Insert: Omit<Database['public']['Tables']['refunds']['Row'], 'id' | 'reference' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['refunds']['Insert']>;
      };
      announcements: {
        Row: {
          id:         string;
          title:      string;
          body:       string;
          audience:   string;
          status:     string;
          created_by: string | null;
          publish_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      audit_logs: {
        Row: {
          id:         string;
          actor_id:   string | null;
          action:     string;
          target:     string | null;
          metadata:   Record<string, unknown> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: {
      event_stats: {
        Row: {
          id:             string;
          title:          string;
          status:         EventStatus;
          organizer_id:   string;
          organizer_name: string;
          total_capacity: number;
          total_sold:     number;
          gross_revenue:  number;
        };
      };
      order_details: {
        Row: Database['public']['Tables']['orders']['Row'] & {
          customer_name:   string;
          customer_email:  string;
          event_title:     string;
          tier_name:       string;
          mpesa_code:      string | null;
          payment_status:  PaymentStatus | null;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}
