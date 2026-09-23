alter table public.profiles
  add column if not exists display_name text not null default '';

-- Backfill names from Google / auth metadata for existing users
update public.profiles p
set
  display_name = coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    nullif(
      trim(
        concat_ws(
          ' ',
          nullif(trim(u.raw_user_meta_data->>'given_name'), ''),
          nullif(trim(u.raw_user_meta_data->>'family_name'), '')
        )
      ),
      ''
    ),
    p.display_name
  ),
  updated_at = now()
from auth.users u
where u.id = p.user_id
  and (
    p.display_name is null
    or p.display_name = ''
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_name text;
begin
  next_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(
      trim(
        concat_ws(
          ' ',
          nullif(trim(new.raw_user_meta_data->>'given_name'), ''),
          nullif(trim(new.raw_user_meta_data->>'family_name'), '')
        )
      ),
      ''
    ),
    ''
  );

  insert into public.profiles (user_id, email, display_name, updated_at)
  values (
    new.id,
    coalesce(new.email, ''),
    next_name,
    now()
  )
  on conflict (user_id) do update
    set email = excluded.email,
        display_name = case
          when excluded.display_name <> '' then excluded.display_name
          else public.profiles.display_name
        end,
        updated_at = now();
  return new;
end;
$$;
