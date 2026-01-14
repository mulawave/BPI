# Copilot Instructions for BPI Monorepo

## Project Architecture
- **Stack:** Next.js (App Router), tRPC, Prisma, Auth.js (NextAuth), ShadCN UI, Tailwind CSS, PostgreSQL
- **App Structure:**
  - `app/` — Next.js App Router pages (auth flows, main UI)
  - `components/` — UI and form components (heavily styled with Tailwind & ShadCN)
  - `server/` — tRPC routers, authentication logic, Prisma client
  - `prisma/` — Prisma schema and migrations
  - `public/` — Static assets (hero images, logos, design references)

## Key Patterns & Conventions
- **Auth:**
  - Auth.js (NextAuth) with credentials and OAuth providers
  - Sessions are database-backed by default (see `server/auth.ts`)
  - Custom login/register/forgot-password pages in `app/(auth)/`
- **UI & Design Philosophy:**
  - **CRITICAL: MAINTAIN HIGHEST LEVEL OF SOPHISTICATION**
  - All modals and complex components MUST match the quality standard set by `NotificationsModal.tsx`
  - Features required for sophisticated components:
    - Fullscreen or near-fullscreen modals with backdrop blur
    - Multi-column layouts (sidebar, main content, analytics/details pane)
    - Smooth Framer Motion animations (entrance, exit, list items)
    - Rich data visualization (charts, graphs, progress bars)
    - Advanced filtering, sorting, and search capabilities
    - Bulk actions with checkboxes and action bars
    - Analytics dashboards with trends and breakdowns
    - Responsive hover effects and transitions
    - Proper loading states and error handling
    - Toast notifications for all user actions
    - Category-based organization with icons
    - Reading/detail panes for expanded views
  - ShadCN UI primitives, extended with custom Tailwind classes
  - Use `react-icons` for all icons (outline, no fill, inside bordered circles)
  - Form fields: sharp value text (#232323), lighter placeholder (#b0b0b0), focus border dark green (#0d3b29)
  - Glassmorphism and gradient accents for modern aesthetic
  - Dark mode support for all components
- **Notifications:**
  - **NEVER** use `alert()`, `confirm()`, or `prompt()` - these are outdated and provide poor UX
  - **ALWAYS** use `toast` from `react-hot-toast` for user feedback
  - Import: `import toast from "react-hot-toast";`
  - Success: `toast.success('Message');`
  - Error: `toast.error('Error message');`
  - Info: `toast('Info message');`
  - Loading: `toast.loading('Processing...');`
  - Toast provider is configured in `components/providers.tsx`
- **Forms:**
  - Client-side validation for all forms
  - Registration supports referral codes via URL (?ref=)
  - Math captcha for registration (see `RegisterForm.tsx`)
- **tRPC:**
  - Routers in `server/trpc/router/*`, merged in `_app.ts`
  - Use for all server-client API calls
- **Prisma:**
  - Schema in `prisma/schema.prisma`, migrations via `npx prisma migrate dev`
- **Styling:**
  - Tailwind CSS for all layout and utility classes
  - Custom gradients and backgrounds for hero sections

## Developer Workflows
- **Setup:**
  - Copy `.env.example` → `.env.local`, set `DATABASE_URL`, `AUTH_SECRET`, provider creds
  - Install deps: `pnpm i` (or `npm i`/`yarn`)
  - Run migrations: `npx prisma migrate dev --name init`
- **Dev:**
  - Start: `pnpm dev` (or `npm run dev`)
  - Visit: http://localhost:3000
- **Deploy:**
  - Push to GitHub, import to Vercel
  - Set env vars in Vercel dashboard

## Integration Points
- **Database:** PostgreSQL (Neon, Supabase, Railway, etc.)
- **Auth Providers:** GitHub, Google (add creds in env)
- **ShadCN UI:** Add new components via `npx shadcn-ui@latest add <component>`

## Examples
- See `app/(auth)/register/page.tsx` for registration flow, referral, and captcha
- See `components/auth/RegisterForm.tsx` for form field conventions and icon usage
- See `components/wallet/WalletTimelineModal.tsx` for toast notification examples
- See `README.md` for setup and workflow details

## Guardrails
- Only implement or change code when the user prompt explicitly includes one of the trigger words: "implement", "fix", "patch", "update", "go", or "yes". Otherwise, prioritize discussion, investigation, or debugging.

---

> For new AI agents: Follow the above conventions for all new features, especially form field styling, auth flows, and API integration. When in doubt, check the referenced files for examples.
