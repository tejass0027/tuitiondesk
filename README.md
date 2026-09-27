# TuitionDesk

**Attendance, fees and WhatsApp reminders for tuition and coaching centres, made for the phone.**

Most small tuition centres still run on notebooks: one for attendance, one for fees, and a lot of memory for "who hasn't paid yet?". TuitionDesk replaces those notebooks with one simple app that works on any phone or computer, with nothing to install.

Parents don't need an account. They get WhatsApp messages from the centre, and can optionally open a private page to see their child's progress.

---

## What it does

### 📋 Attendance in seconds
- Pick a batch and everyone starts as **Present**. Tap only the students who are absent, then press Save.
- Send the parents of absent students a WhatsApp message with one tap.
- Each student has a monthly attendance calendar.

### ₹ Fees made easy
- Every student's fee is added automatically each month.
- Record cash, UPI or bank payments, including part payments. **Undo** a mistake straight away.
- See **Due**, **Overdue** and **Paid** at a glance, with how much has been collected and how much is pending.
- A **PDF receipt** for every payment, with a receipt number and the amount in words, ready to share on WhatsApp.

### 💬 WhatsApp reminders (free)
- Fee reminders, absence messages and test results open in WhatsApp **with the message already typed**. You just tap Send.
- Choose who gets messages: **father, mother or both**.
- **Remind all overdue** walks you through every parent who owes fees, one by one.
- A **reminder log** shows who was reminded and when, so nobody gets reminded twice by mistake.

### 📝 Tests and report cards
- Create a test and type the whole class's marks on one screen. You can mark students absent, and the class average updates as you type.
- Share each student's result with their parents.
- **Report card PDF** with attendance and marks for this month, the last 3 months, the whole year or any dates you choose.

### 👨‍👩‍👧 Students
- Add students one by one with both parents' names and phone numbers.
- **Import a whole register from Excel** (or paste it straight from Excel). Every row is checked before anything is saved, and students already added are skipped.
- Add a **photo** of each student, so you can recognise them on the attendance sheet.
- Search by student or parent name, and filter by class or batch.

### 🔗 Parent link (optional)
- Give parents a private page with their child's attendance, marks and fees. They don't need to log in or install anything.
- Switch the feature on or off for the whole centre in **Settings**, and turn off any single link at any time.

### 🗓 Holidays, classes and batches
- Add festivals and breaks (a single day or a whole range). Attendance isn't taken on holidays.
- Keep a list of your classes (Class 1–12, JEE, NEET…) and your batches with their days, timings and fees.

### 🏠 Home screen
- Today's batches (marked or not), this month's fee collection with a 6-month chart, students with overdue fees, and students whose attendance is below 75%.

### Also
- Works on phones and computers, in light and dark mode.
- Indian formats everywhere: ₹1,00,000 and dates like 25 Sep 2026.
- Handles large centres with **1,000+ students**.
- Each centre can only ever see its own data.
- Forgot your password? Reset it by email.

---

## How to get it running

You'll need:
- A free **[Supabase](https://supabase.com/)** account. It stores your data and handles logins.
- **[Node.js](https://nodejs.org/)** version 20 or newer, installed on your computer.
- For putting it online: a free **[Vercel](https://vercel.com/)** account and a **GitHub** account.

### Step 1: Download the app

Open a terminal and run:

```bash
git clone https://github.com/tejass0027/tuitiondesk.git
cd tuitiondesk
npm install
```

### Step 2: Set up the database in Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a **new project**. Choose the Mumbai region if you're in India.
2. Open **SQL Editor** from the left menu.
3. Open each file in the `supabase/migrations` folder **in this order**. Copy the whole file, paste it into the SQL Editor, and click **Run**:
   1. `…_tables.sql`
   2. `…_rls.sql`
   3. `…_functions.sql`
   4. `…_tests_and_marks.sql`
   5. `…_classes.sql`
   6. `…_both_parents.sql`
   7. `…_message_both_parents.sql`
   8. `…_photos_holidays_parent_links.sql`
   9. `…_scale_totals.sql`

   Each should say **"Success. No rows returned."**
4. Go to **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** add `http://localhost:3000/**`
5. Optional, for quick testing: in **Authentication → Sign In / Providers → Email**, turn off **Confirm email**, so new sign-ups can log in straight away.

### Step 3: Connect the app to your database

1. In Supabase, go to **Project Settings → API Keys** (and **Data API** for the URL).
2. In the app folder, make a copy of `.env.example` and name it `.env.local`.
3. Open `.env.local` and paste in your two values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Only use the **publishable** key here, never the secret key. `.env.local` stays on your computer and is never uploaded.

### Step 4: Start it

```bash
npm run dev
```

Open **http://localhost:3000**, click **Create your centre**, and follow the 3-step checklist on the Home screen: add a batch, add students, mark attendance.

**To open it on your phone:** connect the phone to the same Wi-Fi as your computer, then open `http://<your-computer's-IP>:3000`. For example `http://192.168.1.5:3000`; on Windows, find the IP with `ipconfig`.

### Step 5: Put it online (so it works anywhere)

1. Put your copy of the code on **GitHub**.
2. In **[Vercel](https://vercel.com/new)**, click **Import** and choose your GitHub repository.
3. Under **Environment Variables**, add the same two values from Step 3.
4. Click **Deploy**. You'll get a link like `https://your-app.vercel.app`.
5. Back in Supabase → **Authentication → URL Configuration**:
   - Change **Site URL** to your Vercel link.
   - Add `https://your-app.vercel.app/**` to **Redirect URLs**.
6. Optional: connect your own domain (for example `mytuition.in`) in Vercel → **Settings → Domains**.

### Before real centres use it

- **Password-reset emails:** Supabase's built-in email only sends a few emails an hour, and only to your own team. Connect a free email service such as [Resend](https://resend.com/) in Supabase → **Authentication → Emails → SMTP Settings**.
- **Backups:** turn on Supabase's paid plan (or take regular backups) before storing real fee records.
- **Confirm email:** turn it back on if you turned it off in Step 2.

---

## Need help?

| Problem | Fix |
|---|---|
| A page shows an error right after setup | Make sure **all 9** SQL files ran in Supabase, in order. |
| "Invalid API key" or you can't log in | Check both values in `.env.local`, then stop and restart `npm run dev`. |
| The password-reset link doesn't open the app | Add your site address with `/**` to **Redirect URLs** in Supabase (Step 2.4 / Step 5.5). |
| The app doesn't open on your phone | The phone and computer must be on the same Wi-Fi, and `npm run dev` must be running. |
| WhatsApp doesn't open | The parent's number must be a valid 10-digit Indian mobile number. On a computer, WhatsApp Web opens instead. |
