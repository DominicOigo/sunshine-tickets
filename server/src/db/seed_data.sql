-- Seed Customers
insert into users (id, username, email, password, full_name, role) values
  ('a1e6b911-37f2-4ef8-82ea-2a9f4c3a590b', 'john_customer', 'john.customer@gmail.com', '$2a$10$wxmWLTSxihFCx23BMt/AVuzGnQeMDTjT0r/33XPGvT1ByHrS6QpEu', 'John Customer', 'customer'),
  ('b2f7c022-4803-5fa9-93fb-3b0a5d4b601c', 'jane_customer', 'jane.customer@gmail.com', '$2a$10$wxmWLTSxihFCx23BMt/AVuzGnQeMDTjT0r/33XPGvT1ByHrS6QpEu', 'Jane Customer', 'customer')
on conflict (username) do nothing;

insert into buyer_profiles (user_id, phone, avatar_url) values
  ('a1e6b911-37f2-4ef8-82ea-2a9f4c3a590b', '254711111111', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'),
  ('b2f7c022-4803-5fa9-93fb-3b0a5d4b601c', '254722222222', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120')
on conflict (user_id) do nothing;

-- Get the organizer ID
-- We will use the seeded organizer 'dominicoigo8'
-- Get categories
-- 'Concerts', 'Festivals', 'Comedy', 'Conferences'

-- Seed Events
insert into events (id, title, description, organizer_id, category_id, status, image_url, location, coordinates, start_date, end_date, is_trending) values
  -- Event 1: Nairobi Tech Summit 2026
  ('e1a11111-1111-1111-1111-111111111111', 
   'Nairobi Tech Summit 2026', 
   'The largest gathering of tech innovators, startups, and developers in East Africa. Join us for keynote talks, panel discussions, and unmatched networking.', 
   (select id from users where username = 'dominicoigo8' limit 1),
   (select id from categories where slug = 'conferences' limit 1),
   'published', 
   'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800', 
   'KICC, Nairobi', 
   '{"lat": -1.2884, "lng": 36.8233}', 
   now() + interval '30 days', 
   now() + interval '32 days', 
   true),

  -- Event 2: Sol Fest Farewell Concert
  ('e2b22222-2222-2222-2222-222222222222', 
   'Sauti Sol Farewell Concert', 
   'An unforgettable night with Kenyas legendary band Sauti Sol. Experience all their hit songs live in concert for one final memorable show.', 
   (select id from users where username = 'dominicoigo8' limit 1),
   (select id from categories where slug = 'concerts' limit 1),
   'published', 
   'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800', 
   'Uhuru Gardens, Nairobi', 
   '{"lat": -1.3211, "lng": 36.7936}', 
   now() + interval '15 days', 
   now() + interval '15 days' + interval '6 hours', 
   true),

  -- Event 3: Blankets & Wine Festival
  ('e3c33333-3333-3333-3333-333333333333', 
   'Blankets & Wine Festival', 
   'A quarterly outdoor music festival showcasing the best live afro-fusion music, art exhibitions, and gourmet food. Bring your picnic blanket and enjoy the vibe.', 
   (select id from users where username = 'dominicoigo8' limit 1),
   (select id from categories where slug = 'festivals' limit 1),
   'published', 
   'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800', 
   'Laureat Gardens, Nairobi', 
   '{"lat": -1.2294, "lng": 36.8842}', 
   now() + interval '45 days', 
   now() + interval '45 days' + interval '8 hours', 
   false),

  -- Event 4: Standup Comedy Night
  ('e4d44444-4444-4444-4444-444444444444', 
   'Night of a Thousand Laughs', 
   'Prepare for tears of joy as top comedians from across Africa grace the stage for a hilarious evening of standup comedy.', 
   (select id from users where username = 'dominicoigo8' limit 1),
   (select id from categories where slug = 'comedy' limit 1),
   'published', 
   'https://images.unsplash.com/photo-1585699324551-f6c309eed262?auto=format&fit=crop&q=80&w=800', 
   'Carnivore Grounds, Nairobi', 
   '{"lat": -1.3255, "lng": 36.8083}', 
   now() + interval '5 days', 
   now() + interval '5 days' + interval '4 hours', 
   false),

  -- Event 5: East Africa Marathon 2026 (Pending Approval)
  ('e5e55555-5555-5555-5555-555555555555', 
   'East Africa Marathon 2026', 
   'The ultimate athletic challenge in the region. Run alongside world-class athletes and push your limits for a good cause.', 
   (select id from users where username = 'dominicoigo8' limit 1),
   (select id from categories where slug = 'sports' limit 1),
   'pending_approval', 
   'https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&q=80&w=800', 
   'Nairobi City Circuit', 
   '{"lat": -1.2833, "lng": 36.8167}', 
   now() + interval '60 days', 
   now() + interval '60 days' + interval '5 hours', 
   false)
on conflict (id) do nothing;

-- Seed Ticket Tiers
insert into ticket_tiers (id, event_id, name, description, price, capacity, sold, sort_order, is_active) values
  -- Tiers for Nairobi Tech Summit
  ('t1a11111-1111-1111-1111-111111111111', 'e1a11111-1111-1111-1111-111111111111', 'Regular Pass', 'Access to all keynotes and expo hall', 3000, 500, 320, 0, true),
  ('t1b22222-2222-2222-2222-222222222222', 'e1a11111-1111-1111-1111-111111111111', 'VIP Pass', 'Front row seating, VIP lounge access & lunch', 10000, 100, 65, 1, true),

  -- Tiers for Sol Fest
  ('t2a11111-1111-1111-1111-111111111111', 'e2b22222-2222-2222-2222-222222222222', 'Regular Arena', 'General admission to the main arena', 2500, 2000, 1850, 0, true),
  ('t2b22222-2222-2222-2222-222222222222', 'e2b22222-2222-2222-2222-222222222222', 'VIP Golden Circle', 'Closest access to the stage and private bar', 8000, 500, 420, 1, true),

  -- Tiers for Blankets & Wine
  ('t3a11111-1111-1111-1111-111111111111', 'e3c33333-3333-3333-3333-333333333333', 'Early Bird', 'Discounted general ticket (limited quantity)', 2000, 300, 300, 0, true),
  ('t3b22222-2222-2222-2222-222222222222', 'e3c33333-3333-3333-3333-333333333333', 'Advance Ticket', 'General gate admission pass', 3500, 800, 410, 1, true),

  -- Tiers for Comedy Night
  ('t4a11111-1111-1111-1111-111111111111', 'e4d44444-4444-4444-4444-444444444444', 'General Admission', 'Guaranteed seat in the main gallery', 1500, 600, 350, 0, true),
  ('t4b22222-2222-2222-2222-222222222222', 'e4d44444-4444-4444-4444-444444444444', 'VVIP Table', 'Table of 4 with a complementary bottle of wine', 12000, 50, 30, 1, true),

  -- Tiers for Marathon
  ('t5a11111-1111-1111-1111-111111111111', 'e5e55555-5555-5555-5555-555555555555', 'Athlete Registration', 'Official marathon bib and runner kit', 1000, 1000, 120, 0, true)
on conflict (id) do nothing;

-- Seed Orders (Simulate some historical orders)
insert into orders (id, reference, customer_id, event_id, tier_id, quantity, unit_price, total_amount, status, phone, checked_in, checked_in_at, created_at) values
  ('o1a11111-1111-1111-1111-111111111111', 'ORD-SUMMIT01', 'a1e6b911-37f2-4ef8-82ea-2a9f4c3a590b', 'e1a11111-1111-1111-1111-111111111111', 't1a11111-1111-1111-1111-111111111111', 2, 3000, 6000, 'confirmed', '0711111111', true, now() - interval '2 days', now() - interval '2 days'),
  ('o1b22222-2222-2222-2222-222222222222', 'ORD-SUMMIT02', 'b2f7c022-4803-5fa9-93fb-3b0a5d4b601c', 'e1a11111-1111-1111-1111-111111111111', 't1b22222-2222-2222-2222-222222222222', 1, 10000, 10000, 'confirmed', '0722222222', false, null, now() - interval '1 day'),
  ('o2a11111-1111-1111-1111-111111111111', 'ORD-SOLFEST1', 'a1e6b911-37f2-4ef8-82ea-2a9f4c3a590b', 'e2b22222-2222-2222-2222-222222222222', 't2a11111-1111-1111-1111-111111111111', 4, 2500, 10000, 'confirmed', '0711111111', true, now() - interval '3 hours', now() - interval '4 hours'),
  ('o3a11111-1111-1111-1111-111111111111', 'ORD-BLANKET1', 'b2f7c022-4803-5fa9-93fb-3b0a5d4b601c', 'e3c33333-3333-3333-3333-333333333333', 't3b22222-2222-2222-2222-222222222222', 1, 3500, 3500, 'pending', '0722222222', false, null, now() - interval '1 hour')
on conflict (id) do nothing;

-- Seed Payments
insert into payments (id, reference, order_id, customer_id, amount, mpesa_code, mpesa_phone, status) values
  ('p1a11111-1111-1111-1111-111111111111', 'TXN-KICC1111', 'o1a11111-1111-1111-1111-111111111111', 'a1e6b911-37f2-4ef8-82ea-2a9f4c3a590b', 6000, 'QWE123RTY4', '0711111111', 'success'),
  ('p1b22222-2222-2222-2222-222222222222', 'TXN-KICC2222', 'o1b22222-2222-2222-2222-222222222222', 'b2f7c022-4803-5fa9-93fb-3b0a5d4b601c', 10000, 'ASD456ZXC7', '0722222222', 'success'),
  ('p2a11111-1111-1111-1111-111111111111', 'TXN-SOLFEST1', 'o2a11111-1111-1111-1111-111111111111', 'a1e6b911-37f2-4ef8-82ea-2a9f4c3a590b', 10000, 'MPESA88888', '0711111111', 'success')
on conflict (id) do nothing;

-- Seed Payouts
insert into payouts (id, reference, organizer_id, event_id, gross_amount, fee_amount, net_amount, status, mpesa_phone, processed_at) values
  ('pay11111-1111-1111-1111-111111111111', 'PAY-OUT00001', (select id from users where username = 'dominicoigo8' limit 1), 'e1a11111-1111-1111-1111-111111111111', 16000, 800, 15200, 'completed', '254716411222', now() - interval '12 hours')
on conflict (id) do nothing;
