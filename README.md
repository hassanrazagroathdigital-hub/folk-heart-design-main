# Matka & Me Threads — website + CMS

React 18 + Vite + TypeScript + Tailwind/shadcn site with a built-in admin dashboard
(`/admin`) backed by **Supabase** (Postgres, Auth, Storage).

```sh
npm install
npm run dev        # http://localhost:8080
npm test           # unit + component tests
npm run build
```

The public site works **without** Supabase: it shows its original built-in content and
forms still email via Formspree. Connect Supabase to manage everything from `/admin`.

---

## What the CMS manages

| Admin section | Where it shows on the website |
| --- | --- |
| **Products** | `/shop` — name, description, gallery images (first = cover), collection, badge (`N Available`, `Sample Pattern`, `Coming Soon`, `Sold`, none), optional price / sale price / SKU, featured, order, draft/published |
| **Collections** | Homepage "Product Offerings" cards and the `/shop` filter buttons |
| **FAQs** | `/custom-order` FAQ accordion |
| **Inquiries** | Messages from the Contact form, Custom Order form and homepage inquiry form. Read/unread, status, search, filters, reply by email |
| **Media Library** | Every uploaded image, with "in use" tracking. Only unused files can be deleted |
| **Website Settings** | Logo, favicon, contact email/phone/location, Instagram & Linktree, hero text and image, marquee, section titles, Shop / Custom Order / Contact page text, Our Story page (intro + people), footer, SEO title/description |

---

## CMS setup (one time)

### 1. Create a Supabase project
<https://supabase.com/dashboard> → **New project**.

### 2. Run the database schema
Dashboard → **SQL Editor** → **New query** → paste all of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.

It creates the tables, Row Level Security policies, the `is_admin()` check, the
inquiry submission function (with validation, a honeypot, and rate limiting), and
the public `cms-media` storage bucket (JPEG/PNG/WebP, 8 MB max).
It's safe to run again later. It never drops tables or deletes rows.

### 3. Create the first administrator
1. Dashboard → **Authentication → Users → Add user → Create new user**. Enter the
   owner's email and a strong password and tick **Auto Confirm User**.
2. Back in **SQL Editor**, run (with that email):

   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'owner@example.com'
   on conflict (user_id) do nothing;
   ```

Only users listed in `admin_users` can manage content. Being signed in is not enough.
To remove an admin: `delete from public.admin_users where email = 'owner@example.com';`

> Recommended: Authentication → Providers → Email → turn **off** "Allow new users to sign up",
> so nobody can self-register. (They'd have no admin rights anyway, but there's no reason to allow it.)

### 4. Configure environment variables
Dashboard → **Project Settings → API**. Copy the **Project URL** and the **anon / publishable** key.

```sh
cp .env.example .env
# then fill in:
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

On your host (Vercel, Netlify, Lovable, etc.) add the same two variables in its
environment settings. **Vite embeds them at build time, so rebuild and redeploy after
changing them.**

Never use the `service_role` / secret key in this app. Nothing here needs it.

### 5. Import the existing content
Open `/admin`, sign in, and on the Dashboard click **Import starter content**. This
copies the site's original 5 collections, 36 products and 4 FAQs into the database
and uploads their photos to Storage. It only adds items that don't exist yet
(matched by slug, or by question text for FAQs), so it's safe to re-run. It never
edits or deletes anything. It's also available under **Website Settings → Data**.

Until a collection has records in the database, the public site keeps showing the
built-in version. Once a collection has records, only the database records are shown,
and unpublishing everything really does hide everything.

### 6. Deploy
`/admin` is a client-side route like `/shop`. If opening `/shop` directly already works on
your host, `/admin` will too. Otherwise add an SPA rewrite `/* → /index.html`
(Netlify: `public/_redirects` with `/* /index.html 200`; Vercel: a `rewrites` entry in `vercel.json`).

---

## How security works

- **RLS is the security boundary.** The anon key in the browser grants nothing by itself.
  - Visitors can read only *published* products, collections and FAQs, plus site settings.
  - Visitors **cannot read inquiries**. They submit through `submit_inquiry()`, which
    validates input, drops honeypot spam, and rate-limits to 5 per hour per IP and per
    email, plus a global cap. The IP is stored only as a hash.
  - Signed-in users who aren't in `admin_users` get the same access as visitors.
  - Admins (`is_admin()` checked server-side from the JWT) can manage everything.
  - Direct writes to the storage bucket and listing its files are admin-only. Files are
    public by URL so the website can display them.
- `TRUNCATE` and default broad grants are revoked from `anon`/`authenticated`.
- Settings are saved with `merge_site_settings()`, a server-side deep merge, so saving
  one section never wipes another.
- The admin UI is code-split. Public visitors never download it, and `/admin` is `noindex`.

## Forms & email notifications

All three public forms save to **Inquiries** and are also forwarded to the existing
Formspree endpoint (`src/lib/cms/inquiries.ts`), so email notifications keep working.
If one channel fails the other still records the message. If both fail, the visitor
sees an error instead of a false "sent".

## Images

Uploads are validated (JPEG/PNG/WebP), large photos are resized to 2400 px and converted
to WebP in the browser, then stored at a unique path. Replacing an image uploads the new
one first and never deletes the old one automatically. Deleting a product leaves its images
in the Media Library, where **Clean up unused** removes files nothing references (usage is
re-checked right before deletion).

## Project map

```
supabase/schema.sql              Tables, RLS, functions, storage bucket + policies
src/lib/supabase/client.ts       Supabase client (null when not configured)
src/lib/cms/
  types.ts                       Content + settings types
  defaults.ts                    Built-in content (fallback + starter import source)
  queries.ts / hooks.ts          Public, published-only reads with fallback rules
  admin.ts                       Admin queries/mutations (React Query)
  storage.ts                     Validation, optimisation, upload with progress, media list
  inquiries.ts                   Public form submission (Supabase + Formspree)
  seed.ts                        Non-destructive starter-content import
  errors.ts / utils.ts           Friendly errors, slugs, merge, reorder helpers
src/lib/auth/AuthProvider.tsx    Session + server-verified admin status
src/components/admin/            Layout, tables, editor sheet, uploaders, dialogs
src/pages/admin/                 Dashboard, Products, Collections, FAQs, Inquiries, Media, Settings, Login
```
