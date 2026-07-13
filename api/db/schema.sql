-- Sunshine Tickets Local Schema

create extension if not exists "uuid-ossp";

create type user_role     as enum ('customer','organizer','admin');
create type event_status  as enum ('draft','pending_approval','published','rejected','cancelled');
create type order_status  as enum ('pending','confirmed','refunded','failed','cancelled');
create type payment_status as enum ('pending','success','failed','refunded');
create type payout_status  as enum ('pending','processing','completed','failed');
create type refund_status  as enum ('pending','approved','rejected');

-- Users
create table users (
  id           uuid primary key default uuid_generate_v4(),
  username     text not null unique,
  email        text not null unique,
  password     text not null,
  full_name    text not null default '',
  role         user_role not null default 'customer',
  admin_code   text default null,
  is_suspended boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Organizer Profiles (Option 3)
create table organizer_profiles (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null unique references users(id) on delete cascade,
  business_name text not null default '',
  payout_phone  text,
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Buyer Profiles (Option 3)
create table buyer_profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null unique references users(id) on delete cascade,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Categories
create table categories (
  id   uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  icon text
);

insert into categories (name, slug, icon) values
  ('Concerts','concerts','music'),('Festivals','festivals','map'),
  ('Sports','sports','trophy'),('Theatre','theatre','film'),
  ('Comedy','comedy','smile'),('Conferences','conferences','users'),
  ('Workshops','workshops','book'),('Other','other','more-horizontal');

-- Events
create table events (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null,
  description    text not null default '',
  organizer_id   uuid not null references users(id) on delete cascade,
  category_id    uuid references categories(id) on delete set null,
  status         event_status not null default 'draft',
  image_url      text,
  location       text not null default '',
  coordinates    jsonb,
  start_date     timestamptz not null,
  end_date       timestamptz,
  is_trending    boolean not null default false,
  admin_feedback text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Ticket tiers
create table ticket_tiers (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  description text,
  price       integer not null default 0,
  capacity    integer not null default 100,
  sold        integer not null default 0,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Merchandise
create table event_merch (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references events(id) on delete cascade,
  name       text not null,
  price      integer not null default 0,
  stock      integer not null default 0,
  image_url  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Orders
create table orders (
  id            uuid primary key default uuid_generate_v4(),
  reference     text not null unique default 'ORD-' || upper(substr(md5(random()::text),1,8)),
  customer_id   uuid not null references users(id),
  event_id      uuid not null references events(id),
  tier_id       uuid not null references ticket_tiers(id),
  quantity      integer not null default 1,
  unit_price    integer not null,
  total_amount  integer not null,
  status        order_status not null default 'pending',
  phone         text,
  checked_in    boolean not null default false,
  checked_in_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Payments
create table payments (
  id             uuid primary key default uuid_generate_v4(),
  reference      text not null unique default 'TXN-' || upper(substr(md5(random()::text),1,8)),
  order_id       uuid not null references orders(id),
  customer_id    uuid not null references users(id),
  amount         integer not null,
  method         text not null default 'mpesa',
  mpesa_code     text,
  mpesa_phone    text,
  status         payment_status not null default 'pending',
  failure_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Payouts
create table payouts (
  id           uuid primary key default uuid_generate_v4(),
  reference    text not null unique default 'PAY-' || upper(substr(md5(random()::text),1,8)),
  organizer_id uuid not null references users(id),
  event_id     uuid references events(id),
  gross_amount integer not null,
  fee_amount   integer not null,
  net_amount   integer not null,
  status       payout_status not null default 'pending',
  method       text not null default 'mpesa',
  mpesa_phone  text,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Refunds
create table refunds (
  id          uuid primary key default uuid_generate_v4(),
  reference   text not null unique default 'REF-' || upper(substr(md5(random()::text),1,8)),
  order_id    uuid not null references orders(id),
  payment_id  uuid references payments(id),
  customer_id uuid not null references users(id),
  amount      integer not null,
  reason      text not null,
  status      refund_status not null default 'pending',
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Announcements
create table announcements (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  body       text not null,
  audience   text not null default 'all',
  status     text not null default 'published',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit logs
create table audit_logs (
  id         uuid primary key default uuid_generate_v4(),
  actor_id   uuid references users(id) on delete set null,
  action     text not null,
  target     text,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

-- Refresh tokens
create table refresh_tokens (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references users(id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Trigger: auto-increment tier sold on confirmed order
create or replace function handle_order_confirmed() returns trigger language plpgsql as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status != 'confirmed') then
    update ticket_tiers set sold = sold + new.quantity where id = new.tier_id;
  end if;
  if new.status = 'refunded' and old.status = 'confirmed' then
    update ticket_tiers set sold = greatest(0, sold - new.quantity) where id = new.tier_id;
  end if;
  return new;
end;
$$;

create trigger on_order_status_change after insert or update of status on orders
  for each row execute procedure handle_order_confirmed();

-- Seed admin user (password: Admin@2026)
-- bcrypt hash generated for 'Admin@2026'
insert into users (username, email, password, full_name, role, admin_code) values
  ('admin', 'admin@sunshinetickets.co.ke', '$2a$10$wxmWLTSxihFCx23BMt/AVuzGnQeMDTjT0r/33XPGvT1ByHrS6QpEu', 'Admin User', 'admin', '111111')
on conflict (username) do nothing;

-- Seed default organizer user (password: Dom@16411)
-- bcrypt hash generated for 'Dom@16411'
insert into users (username, email, password, full_name, role) values
  ('dominicoigo8', 'dominicoigo8@gmail.com', '$2a$10$YVD1m./Ojam6OucBnRW0K.Ojmmpu4FgMgOKZer0sVJe4P6QxFAtpe', 'Dominic Oigo', 'organizer')
on conflict (username) do nothing;

-- Ensure profile is created for seeded organizer
insert into organizer_profiles (user_id, business_name, is_verified)
select id, 'D.Inc', true from users where username = 'dominicoigo8'
on conflict (user_id) do nothing;

-- Notifications
create table notifications (
  id           uuid primary key default uuid_generate_v4(),
  recipient_id uuid references users(id) on delete cascade,
  type         text not null,
  title        text not null,
  message      text not null,
  link         text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Team Members
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  organizer_id uuid not null references users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'Editor',
  created_at timestamptz not null default now()
);

-- Hero Slides (Marketplace Carousel)
create table hero_slides (
  id          uuid primary key default uuid_generate_v4(),
  image_url   text not null,
  title       text not null default '',
  subtitle    text not null default '',
  link_url    text,
  link_text   text not null default 'Explore Events',
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Discounts & Promo Codes
create table discounts (
  id uuid primary key default uuid_generate_v4(),
  organizer_id uuid not null references users(id) on delete cascade,
  code text not null unique,
  discount_percent integer not null,
  max_uses integer,
  uses integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Live Chat
create table conversations (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references users(id) on delete set null,
  user_name  text not null default 'Guest',
  user_email text,
  status     text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id               uuid primary key default uuid_generate_v4(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_type      text not null,
  sender_name      text not null,
  content          text not null,
  created_at       timestamptz not null default now()
);

-- Platform Settings (key-value)
create table if not exists settings (
  key   text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values ('registration_open', 'true') on conflict (key) do nothing;

-- Payment methods
create table if not exists payment_methods (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  icon        text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

insert into payment_methods (name, slug, description, icon, sort_order) values
  ('M-Pesa', 'mpesa', 'Pay with M-Pesa STK Push', 'smartphone', 1),
  ('Card', 'card', 'Visa / Mastercard payments', 'credit-card', 2),
  ('Bank Transfer', 'bank_transfer', 'Direct bank transfer', 'landmark', 3),
  ('Cash', 'cash', 'Pay at the venue', 'dollar-sign', 4)
on conflict (slug) do nothing;

create table if not exists organizer_payment_methods (
  id                uuid primary key default uuid_generate_v4(),
  organizer_id      uuid not null references users(id) on delete cascade,
  payment_method_id uuid not null references payment_methods(id) on delete cascade,
  is_active         boolean not null default true,
  unique(organizer_id, payment_method_id)
);

create table if not exists email_logs (
  id          uuid primary key default uuid_generate_v4(),
  recipient   text not null,
  subject     text not null,
  body        text,
  status      text not null default 'sent',
  sent_at     timestamptz not null default now()
);

-- After creating tables, enable M-Pesa for existing organizers:
-- insert into organizer_payment_methods (organizer_id, payment_method_id, is_active)
-- select u.id, pm.id, true from users u cross join payment_methods pm where u.role = 'organizer' and pm.slug = 'mpesa';

create table if not exists admin_roles (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  permissions jsonb not null default '[]',
  color       text not null default '#888',
  users       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

insert into admin_roles (name, description, permissions, color, users) values
  ('Super Admin', 'Full system access', '["All access"]', '#EF4444', 1),
  ('Admin', 'General administrative access', '["Events","Users","Finance"]', '#FF9500', 3),
  ('Support', 'Customer support access', '["View events","View orders"]', '#2E5BFF', 5),
  ('Finance', 'Financial operations', '["Payments","Payouts","Refunds"]', '#22C55E', 2),
  ('Moderator', 'Content moderation', '["Event approvals","Announcements"]', '#00F2FE', 4)
on conflict (name) do nothing;

-- Migrate existing DB: alter table users add column if not exists admin_code text default null;
-- update users set admin_code = '111111' where role = 'admin' and admin_code is null;
