# TuitionDesk

**Attendance, fees and WhatsApp parent reminders for small tuition and coaching centres, built for the phone.**

Most small coaching centres in India still run on notebooks: one for attendance, one for fees, and a lot of memory for "who hasn't paid yet?". TuitionDesk replaces those notebooks with a simple, friendly web app that a centre owner can use comfortably on a phone.

- **Mark a whole batch in seconds.** Everyone starts as Present; tap only the absent ones and press Save.
- **Know who has paid.** Monthly fees are created automatically. Record cash, UPI or bank payments, including part payments.
- **Record test marks.** Type a whole class's marks on one screen and share each result with parents.
- **Report cards as PDF.** One tap builds a printable progress report (attendance + marks) to share on WhatsApp.
- **Remind parents on WhatsApp for free.** Pre-filled messages open in WhatsApp with one tap. No paid API needed.
- **See everything at a glance.** Today's batches, collections vs pending, overdue fees and low attendance on one home screen.

Parents don't need an account. They simply receive WhatsApp messages from the owner.

---

## Screenshots

> Add your own screenshots to `docs/screenshots/` and they will show up here.
> Tip: in Chrome DevTools switch to a phone size (e.g. iPhone 12 Pro), then use **⋮ → Capture screenshot**.

| Home | Attendance | Fees | Student |
|---|---|---|---|
| ![Home](docs/screenshots/home.png) | ![Attendance](docs/screenshots/attendance.png) | ![Fees](docs/screenshots/fees.png) | ![Student profile](docs/screenshots/student.png) |

---

## Features

| Area | What you can do |
|---|---|
| **Sign up & centre** | Sign up with email + password, centre name, phone and address. Each owner only ever sees their own centre (enforced by Postgres row-level security). |
| **Batches** | Create batches like "Class 10 Maths – Evening" with days, timings and a monthly fee. Archive old batches without losing history. |
| **Students** | Add students with class, batch, parent name and WhatsApp number. The fee is filled in from the batch and can be lowered for discounts. Search by student or parent name, filter by batch. |
| **Student profile** | Parent contact (call / WhatsApp), attendance %, a monthly attendance calendar, and full fee + payment history. |
| **Attendance** | Pick a date and batch → everyone is Present → tap to mark Absent → one Save. Today's batches are shown first. Saving again updates the same day. |
| **Fees** | A "due" entry is created every month for every active student. Due / Overdue / Paid tabs, collected vs pending totals, part payments, Undo, and a fee due day you can set. |
| **Tests & marks** | Create a test for a batch (name, subject, date, out of). Type every student's marks on one screen (Next jumps to the next student), mark absentees, see the class average live, then share each result with parents on WhatsApp. Marks history and average % on the student profile. |
| **Report card PDF** | From a student's profile: pick this month, last 3 months, the academic year (Apr–Mar) or any dates, then Share (attaches the PDF to WhatsApp on phones), Download or View. Includes attendance by month, every test with % and a performance word, subject-wise averages and signature lines. |
| **Reminders** | Fee, absence and custom WhatsApp messages from editable templates. "Remind all overdue" goes through parents one by one. Every reminder is logged. |
| **Dashboard** | Today's batches (marked or not), this month's collections with a 6-month chart, overdue students with quick Remind, and students below 75% attendance. |
| **Design** | Mobile-first with a bottom tab bar, big tap targets and 17px base text. Light & dark mode, ₹ with Indian digit grouping (₹1,00,000), dates as `25 Sep 2026`, loading skeletons, toasts after every save, friendly empty states. Status is always colour **and** icon **and** label. |

---

## Tech stack

- **[Next.js 16](https://nextjs.org/)** (App Router, Server Components, Server Actions, `proxy.ts`) with **TypeScript**
- **[Supabase](https://supabase.com/)**: Postgres database, email/password auth, row-level security (via `@supabase/ssr`)
- **[Tailwind CSS v4](https://tailwindcss.com/)** + **[shadcn/ui](https://ui.shadcn.com/)** (Radix) components
- **[lucide-react](https://lucide.dev/)** icons, **[Recharts](https://recharts.org/)** for the fee chart
- **[@react-pdf/renderer](https://react-pdf.org/)** to build report card PDFs on the server
- **zod** for validation, **date-fns** for dates, **sonner** for toasts, **next-themes** for dark mode
- **Vitest** for unit tests
- Ready to deploy on **[Vercel](https://vercel.com/)**

---

## How it works (architecture in one minute)

```
Phone browser
   │  taps a button / submits a form
   ▼
Next.js on Vercel
   ├─ proxy.ts ............ refreshes the login cookie, sends signed-out users to /login
   ├─ Server Components ... read data (e.g. the fees page queries the fee_overview view)
   └─ Server Actions ...... validate input with zod, then write to the database
   │  every query runs *as the logged-in owner*
   ▼
Supabase Postgres
   ├─ Row-level security .. only rows whose centre_id belongs to this owner
   ├─ generate_monthly_fees()  creates missing monthly fee entries (safe to run many times)
   └─ fee_overview view ...... works out paid / balance / status (due, overdue, paid) live
```

**Key design decisions**

- **Security lives in the database.** Every table has a `centre_id`, and RLS policies check it. Even a buggy query can't read another centre's data. Composite foreign keys `(id, centre_id)` also stop a row from pointing at another centre's student or batch.
- **Fee status is computed, not stored.** The `fee_overview` view adds up payments and compares the due date with today (in IST). A fee turns "overdue" by itself: no cron job, and no status column that can go stale.
- **Monthly fees without a cron job.** `generate_monthly_fees()` is *idempotent*: a unique `(student_id, month)` key means calling it on every page load only ever creates the missing rows.
- **Attendance is one request.** Toggling happens in the browser for instant feedback. Save sends the whole batch as a single **upsert** on the unique `(student_id, batch_id, date)` key, so re-saving a day updates it instead of duplicating it.
- **WhatsApp via `wa.me` links.** Free, no approval needed. The message is pre-filled and the owner just taps Send. Because the app can't see inside WhatsApp, the log records "reminder opened".

---

## Database

Migrations live in [`supabase/migrations`](supabase/migrations):

| File | Contents |
|---|---|
| `…_tables.sql` | `centres`, `batches`, `students`, `attendance`, `fee_records`, `payments`, `reminder_logs`: foreign keys, checks and indexes |
| `…_rls.sql` | Row-level security on every table + the `my_centre_id()` helper |
| `…_functions.sql` | Signup trigger (creates the centre), `generate_monthly_fees()`, `today_ist()`, and the `fee_overview` and `student_attendance_stats` views |
| `…_tests_and_marks.sql` | `tests` and `test_marks` with RLS, plus triggers that stop marks going above a test's maximum |

```
centres ─┬─< batches ─┬─< students ─┬─< attendance
         │            │             ├─< fee_records ─< payments
         │            │             ├─< reminder_logs
         │            └─< tests ──────┴─< test_marks
```

---

## Getting started

### 1. Prerequisites

- Node.js **20.9+** (22 recommended) and npm
- A free [Supabase](https://supabase.com/) account

### 2. Clone and install

```bash
git clone https://github.com/<your-username>/tuitiondesk.git
cd tuitiondesk
npm install
```

### 3. Create the Supabase project and database

1. Create a new project at [supabase.com](https://supabase.com/dashboard).
2. Open **SQL Editor** and run every file in `supabase/migrations/` **in order** (tables → rls → functions → tests_and_marks).
   *(Or with the Supabase CLI: `npx supabase link` then `npx supabase db push`.)*
3. For local testing you can turn off **Authentication → Sign In / Providers → Email → Confirm email**, so new sign-ups are logged in immediately. Turn it back on for production.

### 4. Environment variables

```bash
cp .env.example .env.local
```

Fill in the values from **Project Settings → API Keys / Data API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://abcd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable key (`sb_publishable_…`) or the legacy `anon` key |

> Only the **publishable/anon** key goes in this app. It is safe in the browser because RLS protects the data.
> **Never** put the `service_role` / secret key in a `NEXT_PUBLIC_` variable or commit it. `.env.local` is git-ignored.

### 5. Run it

```bash
npm run dev
```

Open http://localhost:3000, create your centre, then follow the three-step checklist on the home screen.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (Vitest): formatting, phone numbers, dates, fee maths, WhatsApp templates |
| `npm run db:types` | Regenerate `src/types/database.ts` from a linked Supabase project |

---

## Deploying to Vercel

1. Push the repo to GitHub and **Import** it in Vercel.
2. Add the two environment variables from step 4.
3. Deploy.
4. In Supabase → **Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add `https://<your-app>.vercel.app/auth/callback` to **Redirect URLs** (used by the email confirmation link).

---

## Project structure

```
src/
├─ app/
│  ├─ (auth)/            login, signup and their Server Actions
│  ├─ (app)/             signed-in screens (share the bottom-nav layout)
│  │  ├─ page.tsx        dashboard (Home)
│  │  ├─ attendance/     batch + date picker, tap-to-toggle sheet
│  │  ├─ students/       list, add/edit, profile with calendar & fee history
│  │  ├─ fees/           tabs, payment sheet, "remind all overdue" stepper
│  │  ├─ tests/          tests list, marks entry sheet, share results
│  │  ├─ batches/        list, add/edit, archive
│  │  ├─ reminders/      reminder log + logReminder action
│  │  ├─ more/, settings/
│  │  └─ loading.tsx     skeleton shown while any page loads
│  └─ auth/callback/     email-confirmation handler
├─ components/           ui/ (shadcn), layout/, shared/, reminders/, dashboard/, attendance/
├─ lib/                  supabase clients, formatting, dates, fees, WhatsApp templates (+ tests)
├─ types/database.ts     typed Supabase schema
└─ proxy.ts              session refresh + route protection
supabase/migrations/     SQL schema, RLS and functions
```

---

## Roadmap ideas

- Printable / shareable fee receipts
- Holidays so they don't count against attendance
- Multiple staff logins per centre
- Hindi and other regional languages
- Installable PWA with offline attendance
