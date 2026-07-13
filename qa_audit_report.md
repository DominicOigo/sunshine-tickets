# QA Audit & Testing Report — Sunshine Tickets

This report details the findings of a professional QA and architectural audit of the Sunshine Tickets system, covering frontend routing/redirections, backend API integration, database schema integrity, and security across the three portals (Marketplace, Organizer, and Admin).

---

## 1. Auth & Redirection Flow Issues

### 🔴 Mismatch on Navbar "For Organizers" & Default Role Signup
* **Trigger:** A logged-out user clicks the **"For Organizers"** link in [Navbar.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/apps/marketplace/components/Navbar.tsx#L48).
* **Behavior:** [RequireAuth.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/components/RequireAuth.tsx#L18) immediately redirects them to `/` (hompage) and opens [AuthModal.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/apps/marketplace/components/AuthModal.tsx).
* **Bug:** In the **Register** tab of the modal, the default radio selection is **"Buyer" (Customer)**. If the user registers without explicitly changing this radio option, they are created as a customer and remain on the landing page `/`, feeling like the redirect failed. 
* **Recommendation:** Pre-select the **"Organizer"** role in the modal state if the modal was opened due to a `/manage` path interception.

### 🔴 Silently Blocked Customers (UX Dead End)
* **Behavior:** If a user is already signed in as a **Customer (Buyer)** and clicks **"For Organizers"**, the `RequireAuth` guard detects they do not have the `'organizer'` or `'admin'` roles and immediately redirects them to `/` ([RequireAuth.tsx#L21](file:///home/dominic/Desktop/sunshine_tickets/src/components/RequireAuth.tsx#L21)).
* **Bug:** The redirect happens silently without opening the auth modal or showing a toast error. A buyer is locked out of registering as an organizer unless they manually log out first.
* **Recommendation:** Display a clear toast message informing them that they need an organizer account, or prompt them to create an organizer profile.

### 🔴 State-Based Routing inside Dashboards (Reload Reset Bug)
* **Behavior:** Both the [Organizer Dashboard](file:///home/dominic/Desktop/sunshine_tickets/src/apps/organizer/OrganizerDashboard.tsx#L225) and [Admin Dashboard](file:///home/dominic/Desktop/sunshine_tickets/src/apps/admin/AdminDashboard.tsx#L240) manage sub-pages (e.g., Payouts, Orders, Settings) using a local `page` state variable.
* **Bug:** 
  1. Direct browser links to sub-sections (e.g., `http://localhost:5173/manage/payouts` or `http://localhost:5173/admin/users`) are not mapped to router endpoints and will load the main dashboard page instead.
  2. Refreshing the browser while viewing a sub-page resets the view back to the main dashboard.
* **Recommendation:** Refactor both dashboards to use React Router `<Outlet />` and nested routing (e.g., `/manage/orders`, `/admin/users`).

---

## 2. Organizer Dashboard Bugs & Data Leak

### ⚠️ Critical Data Leak: Unfiltered Events List
* **File:** [OrganizerDashboard.tsx#L235](file:///home/dominic/Desktop/sunshine_tickets/src/apps/organizer/OrganizerDashboard.tsx#L235)
* **Code:** 
  ```typescript
  const myEvents = events; // In real app, filter by organizer ID
  ```
* **Bug:** The local variable `myEvents` is assigned the entire `events` context. Under the `organizer` role, the backend route `/api/events/mine` returns *all published events* plus the organizer's own events. Because the frontend does not filter these by `user.id`, **organizers can view and monitor events created by other organizers**.
* **Impact:** 
  1. The event list shows competitors' events.
  2. All dashboard KPI aggregations (Total Revenue, Tickets Sold, Checked-in attendees) sum up metrics from **all published events on the platform**, resulting in false data and security leaks.
* **Recommendation:** Enforce frontend filtering by matching `organizerId`:
  ```typescript
  const myEvents = useMemo(() => events.filter(e => e.organizerId === user?.id), [events, user]);
  ```

---

## 3. Mock & Hardcoded Components (Dashboard Gaps)

While the core services for users, events, and order/payment records are database-backed, several premium interactive dashboard features are simulated:

| Page / Component | File Path | Status | Mocked Elements |
| :--- | :--- | :--- | :--- |
| **Organizer Reports** | [OrgReportsPage.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/apps/organizer/components/OrgReportsPage.tsx#L13) | **Mocked** | Daily/weekly revenue and ticket sales charts use static client-side arrays (`CHART_DATA`). |
| **Organizer Marketing** | [OrgMarketingPage.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/apps/organizer/components/OrgMarketingPage.tsx#L8) | **Mocked** | Campaigns list and promo codes list are hardcoded arrays. Action buttons show placeholder toasts. |
| **Live Telemetry** | [ProductionIntelligence.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/apps/organizer/components/ProductionIntelligence.tsx#L20) | **Mocked** | Live check-in occupancy heatmap and curves are generated by a random-walk generator in a `setInterval` loop. |
| **Tier Switching** | [TierSwitching.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/apps/organizer/components/TierSwitching.tsx#L19) | **Mocked** | Rules are stored in local React state. Wizard is a frontend-only mockup with no backend validation or scheduler. |
| **Fan Referral Engine** | [FanLinkEngine.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/apps/organizer/components/FanLinkEngine.tsx#L23) | **Mocked** | Promoter lists, rank leaderboards, and sharing previews are static mockup structures. |
| **Payment Gateways** | [AdminSubPages.tsx](file:///home/dominic/Desktop/sunshine_tickets/src/apps/admin/AdminSubPages.tsx#L479) | **Mocked** | Daraja / Stripe health status, latency numbers, and toggle switches are saved in local UI state only. |

---

## 4. Checkout Payment Simulation

* **File:** [EventDetailPage.tsx#L66](file:///home/dominic/Desktop/sunshine_tickets/src/apps/marketplace/EventDetailPage.tsx#L66)
* **Behavior:** When buying a ticket, the user inputs a phone number to trigger an M-Pesa STK Push. 
* **Discrepancy:** The app uses a frontend `setTimeout` of 3.5 seconds to auto-approve the payment by calling `paymentsService.confirm` with a generated code. While this writes successful orders/payments directly to the Postgres database via the API, the confirmation timing is simulated on the client side.
* **Recommendation:** Create a polling mechanism on the frontend to query `/api/orders/payment-direct/:payment_id` status, allowing the backend to asynchronously process Daraja webhooks or callbacks.

---

## 5. Database Seeding Gap

* **Bug:** The local database is completely empty of events, ticket tiers, and orders.
* **Impact:** 
  1. The homepage/marketplace renders zero events (completely blank).
  2. Developers/testers cannot verify checkout, search filters, or dashboard analytics unless they manually register, verify, and approve events step-by-step.
* **Recommendation:** Create a `seed_data.sql` script under [server/src/db](file:///home/dominic/Desktop/sunshine_tickets/server/src/db) to populate a full set of mock events, tiers, historical orders, payments, and payouts.
