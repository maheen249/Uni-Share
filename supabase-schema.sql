-- =============================================
-- UniShare - Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================

-- 1. PROFILES TABLE (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text,
  role text not null check (role in ('student', 'alumni')),
  department text,
  batch_year integer,
  college text default 'Example University',
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. RESOURCES TABLE
create table public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null check (category in ('notes', 'question_papers', 'stationery', 'drafting_tools', 'books', 'other')),
  donor_id uuid references public.profiles(id) on delete cascade not null,
  file_url text,
  tags text[] default '{}',
  semester integer,
  subject text,
  status text default 'available' check (status in ('available', 'claimed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. RESOURCE REQUESTS TABLE
create table public.resource_requests (
  id uuid default gen_random_uuid() primary key,
  resource_id uuid references public.resources(id) on delete cascade not null,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. MENTORSHIP POSTS TABLE
create table public.mentorship_posts (
  id uuid default gen_random_uuid() primary key,
  alumni_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  topic text,
  contact_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INDEXES (for fast queries)
-- =============================================
create index idx_resources_status on public.resources(status);
create index idx_resources_category on public.resources(category);
create index idx_resources_donor on public.resources(donor_id);
create index idx_requests_resource on public.resource_requests(resource_id);
create index idx_requests_requester on public.resource_requests(requester_id);
create index idx_mentorship_alumni on public.mentorship_posts(alumni_id);

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- This automatically creates a profile row when a user signs up
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, department, batch_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'department',
    (new.raw_user_meta_data->>'batch_year')::integer
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.resource_requests enable row level security;
alter table public.mentorship_posts enable row level security;

-- PROFILES: anyone can read, users can update their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- RESOURCES: anyone can read, authenticated users can insert, donors can update their own
create policy "Resources are viewable by everyone"
  on public.resources for select using (true);

create policy "Authenticated users can create resources"
  on public.resources for insert with check (auth.uid() = donor_id);

create policy "Donors can update their own resources"
  on public.resources for update using (auth.uid() = donor_id);

-- RESOURCE REQUESTS: requester and donor can see, authenticated can create
create policy "Users can view their own requests"
  on public.resource_requests for select using (
    auth.uid() = requester_id
    or auth.uid() in (
      select donor_id from public.resources where id = resource_id
    )
  );

create policy "Authenticated users can create requests"
  on public.resource_requests for insert with check (auth.uid() = requester_id);

create policy "Donors can update request status"
  on public.resource_requests for update using (
    auth.uid() in (
      select donor_id from public.resources where id = resource_id
    )
  );

-- MENTORSHIP: anyone can read, alumni can insert their own
create policy "Mentorship posts are viewable by everyone"
  on public.mentorship_posts for select using (true);

create policy "Alumni can create mentorship posts"
  on public.mentorship_posts for insert with check (auth.uid() = alumni_id);

create policy "Alumni can update their own posts"
  on public.mentorship_posts for update using (auth.uid() = alumni_id);

-- =============================================
-- STORAGE BUCKET (for file uploads)
-- Run this separately or create via Supabase Dashboard > Storage
-- =============================================
insert into storage.buckets (id, name, public) values ('resources', 'resources', true);

create policy "Anyone can view resource files"
  on storage.objects for select using (bucket_id = 'resources');

create policy "Authenticated users can upload resource files"
  on storage.objects for insert with check (
    bucket_id = 'resources' and auth.role() = 'authenticated'
  );
