create table if not exists public.habit_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  todos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.habit_data enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'habit_data'
      and policyname = 'Users can read their own habits'
  ) then
    create policy "Users can read their own habits"
      on public.habit_data for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'habit_data'
      and policyname = 'Users can insert their own habits'
  ) then
    create policy "Users can insert their own habits"
      on public.habit_data for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'habit_data'
      and policyname = 'Users can update their own habits'
  ) then
    create policy "Users can update their own habits"
      on public.habit_data for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;