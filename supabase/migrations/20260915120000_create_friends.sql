create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email))
  where email <> '';

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(user_id) on delete cascade,
  addressee_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_not_self check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_idx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;

create or replace function public.find_user_id_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select user_id
  from public.profiles
  where email <> ''
    and lower(email) = lower(trim(lookup_email))
  limit 1;
$$;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.friendships
    where status = 'accepted'
      and least(requester_id, addressee_id) = least(a, b)
      and greatest(requester_id, addressee_id) = greatest(a, b)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, updated_at)
  values (new.id, coalesce(new.email, ''), now())
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

revoke all on function public.find_user_id_by_email(text) from public;
grant execute on function public.find_user_id_by_email(text) to authenticated;
revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read related profiles'
  ) then
    create policy "Users can read related profiles"
      on public.profiles for select
      using (
        auth.uid() = user_id
        or exists (
          select 1
          from public.friendships f
          where (f.requester_id = auth.uid() and f.addressee_id = profiles.user_id)
             or (f.addressee_id = auth.uid() and f.requester_id = profiles.user_id)
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile"
      on public.profiles for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile"
      on public.profiles for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'friendships'
      and policyname = 'Users can read their friendships'
  ) then
    create policy "Users can read their friendships"
      on public.friendships for select
      using (auth.uid() = requester_id or auth.uid() = addressee_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'friendships'
      and policyname = 'Users can send friend requests'
  ) then
    create policy "Users can send friend requests"
      on public.friendships for insert
      with check (auth.uid() = requester_id and status = 'pending');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'friendships'
      and policyname = 'Addressee can accept or reject requests'
  ) then
    create policy "Addressee can accept or reject requests"
      on public.friendships for update
      using (auth.uid() = addressee_id)
      with check (auth.uid() = addressee_id and status in ('accepted', 'rejected'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'friendships'
      and policyname = 'Users can remove friendships'
  ) then
    create policy "Users can remove friendships"
      on public.friendships for delete
      using (auth.uid() = requester_id or auth.uid() = addressee_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'habit_data'
      and policyname = 'Friends can read accepted friend habits'
  ) then
    create policy "Friends can read accepted friend habits"
      on public.habit_data for select
      using (public.are_friends(auth.uid(), user_id));
  end if;
end
$$;
