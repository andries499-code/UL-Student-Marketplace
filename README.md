# UL Student Marketplace

A peer-to-peer marketplace for University of Limpopo students to buy, sell, and
message each other about campus items (textbooks, electronics, appliances,
clothing, room decor). Built with Vite + React + TypeScript + Tailwind, backed
by Supabase (Postgres, Auth, Storage, Realtime).

## What was fixed/completed

- Added the missing `src/pages/ListingDetailPage.tsx` — it was imported by
  `App.tsx` but never included, so the app would not compile without it.
- Fixed a bug in `CategoryIcon.tsx` where Textbooks/Appliances/Other always
  fell back to the generic package icon instead of their intended icon.
- Fixed a type mismatch between the `Conversation` type (`Listing | undefined`)
  and what Supabase actually returns for joined rows (`Listing | null`), which
  broke `tsc --noEmit`.
- Verified `npm install`, `npm run typecheck`, and `npm run build` all pass
  cleanly.

## 1. Install dependencies

```bash
npm install
```

## 2. Supabase setup

Your `.env` already points at a Supabase project:

```
VITE_SUPABASE_URL=https://lulauopguucsjiqionaf.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

This is the public anon key — safe to ship client-side, since access is
enforced by Row Level Security policies, not by keeping the key secret.

**Run the migrations** in that project (SQL Editor in the Supabase dashboard,
or via the Supabase CLI) in order:

1. `supabase/migrations/0001_core_schema.sql` — creates `profiles`,
   `listings`, `favorites`, `conversations`, `messages`, all RLS policies,
   indexes, and triggers.
2. `supabase/migrations/0002_storage_bucket.sql` — creates the public
   `listing-images` storage bucket used for photo uploads.

If you're not sure whether these already ran on this project, they're
idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.) —
safe to run again.

**Enable Email auth** in Supabase Dashboard → Authentication → Providers
(Email should be on by default). Since sign-up is restricted client-side to
`.ac.za` addresses, no server-side email domain restriction is required, but
you can add one in Auth settings if you want to enforce it server-side too.

## 3. Run locally

```bash
npm run dev
```

Visit the printed local URL (typically http://localhost:5173).

## 4. Build for production

```bash
npm run build
npm run preview   # to sanity-check the production build locally
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare
Pages, GitHub Pages, etc.) — just set the two `VITE_SUPABASE_*` environment
variables in your host's dashboard as well, since Vite bakes them in at build
time.

## App structure

- `src/pages/AuthPage.tsx` — sign up (campus email only) / sign in
- `src/pages/BrowsePage.tsx` — search, category tabs, filters, listing grid
- `src/pages/ListingDetailPage.tsx` — full listing view, favorite, message
  seller, owner edit/delete
- `src/pages/SellPage.tsx` — create/edit listing with category-specific fields
- `src/pages/DashboardPage.tsx` — seller's active/sold listings + favorites
- `src/pages/ChatsPage.tsx` / `ChatPage.tsx` — conversations list + realtime chat
- `src/pages/ProfilePage.tsx` — own/other user profile + their active listings
- `src/context/AuthContext.tsx` — Supabase auth session + profile state
- `src/context/RouterContext.tsx` — tiny hash-based router (no react-router
  dependency)

## Known limitations to be aware of

- Routing is a minimal hash-based router — fine for this app's scope, but
  there's no code-splitting or nested routes.
- No email verification gate is enforced beyond Supabase's default settings —
  check your Auth settings if you want to require confirmed emails before
  sign-in.
- Image uploads have no client-side size/type validation beyond the file
  picker's `accept="image/*"` — consider adding a max file size check if
  students upload large photos.
