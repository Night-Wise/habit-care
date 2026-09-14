# Google sign-in and cloud sync

## 1. Create the Supabase project

1. Create or open a project at https://supabase.com/dashboard.
2. Open **Your Project > Connect** and copy the **Project URL**.
3. Open **Project > Settings > API Keys** and copy the **Publishable key**. It starts with `sb_publishable_`.
4. Copy `.env.example` to `.env` and fill in:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_************************
```

`EXPO_PUBLIC_SUPABASE_ANON_KEY` is the existing environment-variable name used by this app. Put the newer Supabase **Publishable key** in that variable. These values are intended for the client. Never put a Supabase secret or service-role key in `.env` or the app.

## 2. Create the habit table

The app cannot create this table automatically. It runs with a client-safe publishable key, while creating tables requires a privileged server-side key. Run the SQL below once in the Supabase dashboard under **SQL Editor**, or run the idempotent migration at `supabase/migrations/20260914000000_create_habit_data.sql` with the Supabase CLI.

If sync currently reports `PGRST205` or says that `public.habit_data` is missing, this step has not been completed for the Supabase project referenced by your `.env` file.

Open Supabase **SQL Editor** and run:

```sql
create table public.habit_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  todos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.habit_data enable row level security;

create policy "Users can read their own habits"
  on public.habit_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on public.habit_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habit_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## 3. Enable Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project.
2. Open **APIs & Services > OAuth consent screen**, configure the consent screen, and add your Google account as a test user if the app is still in testing.
3. Open **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
4. Create a **Web application** OAuth client. In **Authorized redirect URIs**, add the callback URL shown in Supabase under **Authentication > Providers > Google**. It normally looks like:

  `https://your-project-ref.supabase.co/auth/v1/callback`

5. In Supabase, open **Authentication > Providers > Google**, turn the provider **ON**, paste the Google **Client ID** and **Client Secret**, and save. If this provider is OFF or either credential is missing, the app will show `Unsupported provider: provider is not enabled`. Do not add `GOOGLE_CLIENT_ID` to the Expo `.env`; the app starts OAuth through Supabase, which owns these Google provider credentials.
6. In Supabase, open **Authentication > URL Configuration** and add the app callback URL to **Redirect URLs**:
  - Native development/release build: `habitapp://auth/callback`
  - Expo Go: the `exp://.../--/auth/callback` URL printed by `AuthSession.makeRedirectUri` for your running Expo session. Because the Expo Go host can change, use a matching Supabase wildcard such as `exp://**/--/auth/callback` if supported by your project, or add the exact generated URL.
  - Web development: the exact URL shown in the browser address bar with `/auth/callback` appended, for example `http://localhost:8081/auth/callback` or `http://localhost:3000/auth/callback`

Do not use only the Supabase project URL as an app redirect URL. The project URL is used for the Google Cloud callback; the app redirect URLs above are used by Supabase after authentication. Set the Supabase **Site URL** to a valid web URL, but the app callback must also be listed under **Redirect URLs**.

The Google Client ID and Supabase URL/key are client-safe where used by this app. Never put the Google Client Secret or Supabase secret/service-role key in `.env` or the app.

## 4. Run backend and frontend

This repository has no separate local backend server. Supabase provides the hosted backend, including Google authentication, PostgreSQL, and row-level security. The SQL setup above is the backend setup.

### Backend

1. Create the Supabase project and configure the environment variables.
2. Run the `habit_data` SQL in the Supabase SQL Editor.
3. Enable Google and configure the redirect URLs.
4. Leave the Supabase project running in the dashboard; no backend command is required locally.

### Frontend

Restart Expo after changing `.env`:

```bash
npm install
npx expo start --clear
```

Use the Expo terminal shortcuts to open Android, iOS, or web. For native OAuth callbacks, use a development build or release APK; Expo Go may not support the final custom-scheme flow in the same way.

OAuth callbacks use the existing `habitapp` scheme. Because native deep links are part of the app binary, rebuild the development or release APK after changing native configuration.

After sign-in, Settings offers three choices:

- **Merge** local habits with cloud habits.
- **Replace cloud** data with this device's habits.
- **Use cloud only** and replace this device's list with cloud data.
