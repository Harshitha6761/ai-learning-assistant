# ExamPrep

Full-stack exam preparation app: AI summaries, keywords, question papers, and evaluation. Built with Next.js 14, Supabase, and Google AI (Gemini).

## Stack

- **Frontend + API:** Next.js 14 (App Router), TypeScript, Tailwind
- **Backend/DB/Auth/Storage:** Supabase (Postgres, Auth, Storage, Realtime)
- **Hosting:** Vercel
- **AI:** Google AI (Gemini) for document understanding, summarization, keywords, question generation, evaluation

## Roles

- **admin:** Add teachers/students, set exam dates and announcements (Realtime). All changes reflected live.
- **teacher:** Explore (topic → YT/websites), generate question papers from PDFs, evaluate answer booklets (AI marks + reference links).
- **student:** Get summary, keywords, question paper (MCQs/blanks), and evaluation (marks + learning references).

## Setup

1. **Clone and install**
   ```bash
   cd ExamPrep
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In SQL Editor, run the contents of `supabase/migrations/001_initial.sql`.
   - In Storage, create a **public** bucket named `uploads` (or update `app/api/upload/route.ts` and RLS if you use a private bucket).
   - In Authentication → URL Configuration, add your app URL and `http://localhost:3000/auth/callback` as redirect URL.

3. **Environment**
   - Copy `.env.example` to `.env.local`.
   - Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Supabase project settings.
   - Set `GOOGLE_AI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).

4. **Login and access**
   - **First-time:** Visit the login page once; the default admin is created automatically.
   - **Admin:** Choose “Login as Admin” → email `admin@gmail.com`, password `admin123`.
   - **Teachers and students:** Only accounts that the admin has added (Dashboard → Admin → Add user) can log in. Choose “Login as Teacher” or “Login as Student” and use the email/password the admin set.
   - In Supabase Dashboard → Authentication → Providers, **disable “Enable email signup”** so only the admin and admin-added users can log in.

5. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Conventions

- **Auth:** Role stored in `profiles.role`; API routes and RLS use `auth.uid()` and `profiles.role`.
- **Content:** Accept PDF, text, photos; normalize to text + optional images; single AI module (`lib/ai/gemini.ts`) for summary, keywords, questions, evaluation. Prompts versioned (`PROMPT_VERSION`).
- **Realtime:** Exam dates and announcements use Supabase Realtime so admin changes appear everywhere without refresh.
- **Storage:** All uploads go to Supabase Storage; referenced by user and exam/assignment in `uploads` table.
- **API:** Validate role and ownership; never expose other users’ data.

## Deploy (Vercel)

- Connect repo to Vercel, add env vars from `.env.local`.
- In Supabase Auth redirect URLs, add `https://your-app.vercel.app/auth/callback`.
