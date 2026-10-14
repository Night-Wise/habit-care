-- Habit id -> ISO time it was deleted, so a sync merge doesn't bring deleted habits back.
alter table public.habit_data
  add column if not exists deleted_todos jsonb not null default '{}'::jsonb;
