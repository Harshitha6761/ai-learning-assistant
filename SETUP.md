# ExamPrep – Setup Steps

## 1. Supabase (Database & Auth)

1. Open your project: **Supabase Dashboard** → your project.
2. Go to **SQL Editor** → **New query**.

### If you need a full reset (remove all ExamPrep tables)

3. Paste the contents of **`supabase/migrations/000_teardown.sql`** and run it.
4. (Optional) In **Authentication → Users**, delete all users so you can create a fresh admin.

### Create the schema

5. New query again. Paste the contents of **`supabase/migrations/001_initial.sql`** and run it.
6. In **Storage**, create a bucket named **`uploads`** (public if you want direct URLs).

### Auth settings

7. **Authentication → URL Configuration**  
   - **Site URL:** `http://localhost:3000` (or your production URL).  
   - **Redirect URLs:** add `http://localhost:3000/auth/callback` (and your production callback if you deploy).

8. **Authentication → Providers → Email**  
   - Turn **on** “Enable email” / “Enable email signup” so email logins work.  
   - (The app has no sign-up page; only the seeded admin and users the admin adds can log in.)

---

## 2. App (Env & Run)

1. In the project root, copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_AI_API_KEY`

2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
3. Open **http://localhost:3000**.

---

## 3. First login

1. Go to **http://localhost:3000/login**.
2. The app will create the default admin on first load (if it doesn’t exist).
3. Click **Login as Admin**.
4. Use:
   - **Email:** `admin123@gmail.com`  
   - **Password:** `admin123`
5. You should land on the dashboard. If you see “Loading…”, wait a moment; the dashboard will load.

---

## 4. Add teachers and students (admin only)

1. Log in as admin.
2. Open **Dashboard → Admin**.
3. In **“Add teacher or student”**, enter:
   - Email  
   - Password (min 6 characters)  
   - Role: Teacher or Student  
   - Name (optional)
4. Click **Add user**. They can then log in via **Login as Teacher** or **Login as Student** with that email and password.

---

## Auth summary

| Role    | How they get an account | Login page option   |
|---------|-------------------------|---------------------|
| Admin   | Created by app (seed)   | Login as Admin      |
| Teacher | Added by admin in app   | Login as Teacher    |
| Student | Added by admin in app   | Login as Student    |

Admin: **admin123@gmail.com** / **admin123**.  
Everyone else: email and password set by the admin when adding the user.
