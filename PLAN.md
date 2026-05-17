# Adrex Media OS — Feature & UI Upgrade Plan

> Created: 2026-05-17 | Status: **Awaiting Review** | Do NOT code new features until approved

---

## 1. AI FIXES (DONE — Ready to Deploy)

| # | Fix | Status |
|---|-----|--------|
| 1.1 | Campaign brief now returns **formatted text** instead of JSON | ✅ Done |
| 1.2 | Token limits increased: Campaign 800→**1500**, Caption 600→**1000**, Outreach 700→**1200**, Strategy 1200→**2000**, Chat 800→**1500** | ✅ Done |
| 1.3 | Removed JSON parser from frontend — all AI outputs now display as plain text | ✅ Done |
| 1.4 | Multi-model fallback chain (70B → 8B → Mixtral) already in place | ✅ Done |

---

## 2. BUG FIXES & MISSING FEATURES (Priority: HIGH)

### 2.1 Fix Broken UI Elements
| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 2.1.1 | File delete button does nothing | Add `DELETE /api/files/:id` endpoint + wire up frontend | Low |
| 2.1.2 | Campaign "more" button has no edit action | Add `PUT /api/campaigns/:id` + edit modal | Medium |
| 2.1.3 | Client page has no delete button | Add delete button + confirm dialog | Low |
| 2.1.4 | WhatsApp uses hardcoded `+1234567890` | Add phone field to influencer form, use real number | Low |
| 2.1.5 | File search & filter buttons non-functional | Add search by name, filter by category | Medium |
| 2.1.6 | Calendar events can't be edited | Add `PUT /api/calendar/:id` + edit modal | Medium |
| 2.1.7 | Expense can't be updated | Add `PUT /api/finance/expenses/:id` | Low |
| 2.1.8 | Notification toggles not saved to backend | Add user preferences endpoint, persist settings | Medium |

### 2.2 Complete Missing Database Features
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 2.2.1 | **Campaign Assignments UI** | Assign influencers/users to campaigns with role & status tracking | High |
| 2.2.2 | **Activity Log Page** | View audit trail of all actions (created, updated, deleted) | Medium |
| 2.2.3 | **Notification Center** | Persist notifications to DB, show in TopNav bell icon, mark as read | High |
| 2.2.4 | **Avatar Upload** | Upload profile picture (uses existing multer + File model) | Medium |
| 2.2.5 | **Agency Logo Upload** | Upload agency logo in settings | Low |

### 2.3 Infrastructure & Security
| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 2.3.1 | No input validation on most endpoints | Add Zod validation to all POST/PUT routes | Medium |
| 2.3.2 | No pagination on list endpoints | Add `?page=&limit=` query params to all list routes | Medium |
| 2.3.3 | Hardcoded JWT secret fallback | Remove fallback, require env var | Low |
| 2.3.4 | Email verification never actually sends email | Wire up Nodemailer in signup flow | Medium |
| 2.3.5 | No React error boundaries | Add error boundary wrapper to both frontends | Low |
| 2.3.6 | Loading states show plain text | Replace with skeleton loaders | Medium |

---

## 3. NEW FEATURES (Priority: MEDIUM)

### 3.1 Agency Operations
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 3.1.1 | **Campaign Performance Tracking** | Track impressions, clicks, conversions, ROAS per campaign with charts | High |
| 3.1.2 | **Contract Management** | Create, sign, and store contracts with clients (PDF templates + e-sign) | High |
| 3.1.3 | **Approval Workflow** | Multi-step approval for campaigns, content, and budgets before going live | High |
| 3.1.4 | **Content Calendar** | Visual content scheduling calendar with drag-and-drop posts across platforms | High |
| 3.1.5 | **Budget Tracker** | Real-time budget vs actual spend tracking per campaign with alerts | Medium |
| 3.1.6 | **Client Portal** | Read-only dashboard for clients to view campaign progress and reports | High |

### 3.2 Team Collaboration
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 3.2.1 | **Team Channel Chat** | Group chat channels (not just 1:1) with @mentions | Medium |
| 3.2.2 | **Task Comments** | Add comments/notes to tasks for team discussion | Medium |
| 3.2.3 | **Task Assignments** | Assign tasks to specific team members with due date notifications | Medium |
| 3.2.4 | **Team Activity Feed** | Real-time feed of team actions (campaigns created, tasks completed) | Medium |
| 3.2.5 | **Leave/Time Off Tracker** | Team members can request time off, managers approve | Medium |

### 3.3 AI Enhancements
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 3.3.1 | **AI Content Review** | AI reviews captions/creatives before posting, suggests improvements | Medium |
| 3.3.2 | **AI Influencer Matching** | AI suggests best influencers for a campaign based on niche, audience, budget | High |
| 3.3.3 | **AI Budget Optimizer** | AI analyzes past campaigns and recommends budget allocation | High |
| 3.3.4 | **AI Report Summarizer** | Auto-generate executive summaries from campaign data | Medium |
| 3.3.5 | **Streaming AI Responses** | Stream AI responses token-by-token for faster perceived response | Medium |
| 3.3.6 | **AI Chat History** | Persist AI conversations, allow returning to past chats | Medium |

### 3.4 Finance & Billing
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 3.4.1 | **Stripe Integration** | Real subscription billing with plans (Free, Pro, Enterprise) | High |
| 3.4.2 | **Payment Tracking** | Track which invoices are paid, send payment reminders | Medium |
| 3.4.3 | **Revenue Dashboard** | MRR, ARR, churn rate, LTV charts with forecasting | High |
| 3.4.4 | **Expense Categories** | Custom expense categories with budget limits | Low |
| 3.4.5 | **Tax Calculations** | Auto-calculate GST/tax on invoices (India-specific) | Medium |

### 3.5 Integrations
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 3.5.1 | **Social Media API** | Connect Instagram, YouTube, TikTok accounts for real metrics | High |
| 3.5.2 | **Google Analytics** | Pull GA4 data into campaign reports | Medium |
| 3.5.3 | **Slack Integration** | Send notifications to Slack channels | Medium |
| 3.5.4 | **Email Campaigns** | Send bulk emails to clients/influencers via SendGrid | Medium |
| 3.5.5 | **Calendar Sync** | Sync events with Google Calendar / Outlook | High |

---

## 4. UI/UX DESIGN UPGRADES (Priority: MEDIUM)

### 4.1 Visual Redesign
| # | Upgrade | Description | Effort |
|---|---------|-------------|--------|
| 4.1.1 | **Light/Dark Mode Toggle** | Add theme switcher with system preference detection | Medium |
| 4.1.2 | **Custom Brand Colors** | Allow agencies to set their own accent color in settings | Medium |
| 4.1.3 | **Improved Typography** | Better font hierarchy, line heights, and spacing system | Low |
| 4.1.4 | **Card Redesign** | Modern card layouts with better shadows, borders, and hover effects | Medium |
| 4.1.5 | **Animated Transitions** | Page transitions, route change animations, smoother modals | Medium |
| 4.1.6 | **Empty State Illustrations** | Beautiful empty states with illustrations and CTAs instead of plain text | Medium |

### 4.2 Dashboard Redesign
| # | Upgrade | Description | Effort |
|---|---------|-------------|--------|
| 4.2.1 | **Widget-Based Dashboard** | Drag-and-drop customizable dashboard widgets | High |
| 4.2.2 | **Real-Time Metrics** | Live updating KPIs via WebSocket (no page refresh needed) | Medium |
| 4.2.3 | **Quick Stats Bar** | Top bar showing today's key metrics at a glance | Low |
| 4.2.4 | **Recent Activity Timeline** | Visual timeline of recent actions across the agency | Medium |
| 4.2.5 | **Upcoming Deadlines Widget** | Show tasks/campaigns due in next 7 days | Low |

### 4.3 Navigation & Layout
| # | Upgrade | Description | Effort |
|---|---------|-------------|--------|
| 4.3.1 | **Collapsible Sidebar** | Collapse sidebar to icons-only for more workspace | Low |
| 4.3.2 | **Command Palette (Cmd+K)** | Quick search/navigation across all pages and actions | High |
| 4.3.3 | **Breadcrumb Navigation** | Show current location path in header | Low |
| 4.3.4 | **Global Search** | Search across campaigns, clients, influencers, tasks | High |
| 4.3.5 | **Notification Bell with Dropdown** | Real-time notification center in TopNav | Medium |
| 4.3.6 | **User Menu Dropdown** | Quick access to profile, settings, logout from avatar | Low |

### 4.4 Mobile Responsiveness
| # | Upgrade | Description | Effort |
|---|---------|-------------|--------|
| 4.4.1 | **Mobile Sidebar** | Hamburger menu with slide-out drawer on mobile | Medium |
| 4.4.2 | **Responsive Tables** | Card-based table views on mobile instead of horizontal scroll | Medium |
| 4.4.3 | **Touch-Friendly Kanban** | Swipe gestures for moving cards on mobile | High |
| 4.4.4 | **Mobile-Optimized Forms** | Better input sizing, keyboard types, and layout on mobile | Low |
| 4.4.5 | **PWA Support** | Install as app on mobile, offline caching | High |

### 4.5 Data Visualization
| # | Upgrade | Description | Effort |
|---|---------|-------------|--------|
| 4.5.1 | **Interactive Charts** | Click chart elements to drill down into data | Medium |
| 4.5.2 | **Comparison Views** | Side-by-side campaign/influencer comparison | Medium |
| 4.5.3 | **Heatmap Calendar** | GitHub-style contribution heatmap for activity | Medium |
| 4.5.4 | **Funnel Visualization** | Sales funnel from lead → won with conversion rates | Medium |
| 4.5.5 | **Geographic Map** | Map showing influencer/client locations | High |

---

## 5. TEAM PORTAL UPGRADES

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 5.1 | **Task Creation** | Team members can create tasks (not just view) | Low |
| 5.2 | **File Access** | View/download agency files from team portal | Low |
| 5.3 | **Campaign View** | See assigned campaigns with details | Medium |
| 5.4 | **Time Tracking** | Log hours on tasks for productivity tracking | Medium |
| 5.5 | **Announcements** | Admin can post announcements visible to all team members | Medium |
| 5.6 | **Performance Dashboard** | Show individual task completion rate, on-time delivery | Medium |

---

## 6. RECOMMENDED IMPLEMENTATION ORDER

### Phase 1 — Quick Wins (1-2 weeks)
- 2.1.1 File delete
- 2.1.3 Client delete
- 2.1.4 WhatsApp phone fix
- 2.1.7 Expense update
- 2.3.3 Remove JWT fallback
- 2.3.6 Skeleton loaders
- 4.3.1 Collapsible sidebar
- 4.3.6 User menu dropdown

### Phase 2 — Core Fixes (2-3 weeks)
- 2.1.2 Campaign edit
- 2.1.5 File search/filter
- 2.1.6 Calendar edit
- 2.1.8 Notification preferences
- 2.2.3 Notification center
- 2.2.4 Avatar upload
- 2.2.5 Agency logo upload
- 2.3.1 Zod validation
- 2.3.4 Email verification

### Phase 3 — Feature Additions (3-4 weeks)
- 2.2.1 Campaign assignments
- 2.2.2 Activity log
- 3.2.3 Task assignments
- 3.2.4 Team activity feed
- 3.3.1 AI content review
- 3.3.6 AI chat history
- 4.1.1 Light/dark mode
- 4.2.3 Quick stats bar
- 4.3.5 Notification bell

### Phase 4 — Major Features (4-6 weeks)
- 3.1.1 Campaign performance tracking
- 3.1.4 Content calendar
- 3.1.6 Client portal
- 3.3.2 AI influencer matching
- 3.4.1 Stripe integration
- 4.2.1 Widget dashboard
- 4.3.2 Command palette
- 4.3.4 Global search

### Phase 5 — Advanced (6+ weeks)
- 3.1.2 Contract management
- 3.1.3 Approval workflow
- 3.4.3 Revenue dashboard
- 3.5.1 Social media API
- 4.4.5 PWA support
- 4.5.5 Geographic map

---

## 7. TECHNICAL DEBT TO ADDRESS

| # | Item | Impact |
|---|------|--------|
| 7.1 | Add unit tests for controllers (auth, AI, messages) | High |
| 7.2 | Add E2E tests for critical flows (login, campaign create) | High |
| 7.3 | Replace `shared/` package — actually use shared Zod schemas | Medium |
| 7.4 | Add API documentation (Swagger/OpenAPI) | Medium |
| 7.5 | Set up proper CI/CD (not placeholder echo statements) | High |
| 7.6 | Add database seeding script for development | Low |
| 7.7 | Implement soft deletes for all models | Medium |
| 7.8 | Add request logging and error tracking (Sentry) | Medium |
| 7.9 | Optimize Docker images (multi-stage, smaller base) | Low |
| 7.10 | Add Redis caching for frequently accessed data | Medium |

---

## 8. ENVIRONMENT VARIABLES NEEDED

| Variable | Purpose | Required |
|----------|---------|----------|
| `GROQ_API_KEY` | AI generation | Yes |
| `JWT_SECRET` | Auth token signing | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `FRONTEND_URL` | CORS origin (admin) | Yes |
| `TEAM_PORTAL_URL` | CORS origin (team) | Yes |
| `TWILIO_ACCOUNT_SID` | WhatsApp messaging | No |
| `TWILIO_AUTH_TOKEN` | WhatsApp messaging | No |
| `TWILIO_PHONE_NUMBER` | WhatsApp sender | No |
| `SMTP_HOST` | Email sending | No |
| `SMTP_PORT` | Email sending | No |
| `SMTP_USER` | Email sending | No |
| `SMTP_PASS` | Email sending | No |
| `STRIPE_SECRET_KEY` | Payment processing | No |
| `STRIPE_WEBHOOK_SECRET` | Payment webhooks | No |
| `SENTRY_DSN` | Error tracking | No |

---

## REVIEW CHECKLIST

- [ ] Review all proposed features
- [ ] Prioritize which phases to implement first
- [ ] Confirm AI text output fix is working after deploy
- [ ] Approve or modify any feature descriptions
- [ ] Set timeline expectations for each phase
- [ ] Confirm budget/resource allocation

**Reply with your review, modifications, or approval to begin coding.**
