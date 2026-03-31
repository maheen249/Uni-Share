-- =============================================
-- RUN THIS in Supabase SQL Editor
-- Adds roll_number and personal_email to profiles
-- =============================================

-- Add new columns
alter table public.profiles add column if not exists roll_number text;
alter table public.profiles add column if not exists personal_email text;

-- Update the trigger to save roll_number and personal_email on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, department, batch_year, roll_number, personal_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'department',
    (new.raw_user_meta_data->>'batch_year')::integer,
    new.raw_user_meta_data->>'roll_number',
    new.raw_user_meta_data->>'personal_email'
  );
  return new;
end;
$$ language plpgsql security definer;
