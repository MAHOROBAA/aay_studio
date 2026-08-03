-- spec-addendum-backend.md 6~11장: 폐쇄형 베타 인증 기반 스키마

-- ============================================================
-- beta_testers
-- ============================================================
create table if not exists public.beta_testers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  role text not null default 'tester' check (role in ('admin', 'tester')),
  status text not null default 'invited' check (status in ('invited', 'active', 'disabled')),
  default_credit integer not null default 0,
  daily_credit_limit integer,
  total_credit_limit integer,
  invited_by text,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  last_login_at timestamptz,
  disabled_at timestamptz,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.beta_testers is '폐쇄형 베타 허용 목록. Before User Created Hook과 로그인 후 Guard 양쪽에서 참조한다.';

-- ============================================================
-- profiles (auth.users 1:1)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- admin_audit_logs
-- ============================================================
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid,
  action text not null,
  target_type text not null,
  target_id text,
  before_value jsonb,
  after_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- updated_at 자동 갱신
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_beta_testers_updated_at on public.beta_testers;
create trigger set_beta_testers_updated_at
  before update on public.beta_testers
  for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- auth.users 생성 후: profiles 생성 + beta_testers 상태 갱신
-- (허용 여부 자체는 Before User Created Hook에서 막으므로, 여기까지 왔다면 허용된 사용자다)
-- ============================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(new.email));
begin
  insert into public.profiles (id, email, name)
  values (new.id, normalized_email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  update public.beta_testers
  set
    status = 'active',
    joined_at = coalesce(joined_at, now()),
    last_login_at = now()
  where email = normalized_email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- 로그인할 때마다 last_login_at을 갱신하고 싶으면 auth.users의 UPDATE(last_sign_in_at 변경)에도
-- 트리거를 걸어야 하는데, 이건 NestJS Guard 쪽에서 요청마다 처리하는 게 더 단순해서 DB 트리거로는 만들지 않았다.

-- ============================================================
-- Before User Created Hook: 허용 목록에 없는 이메일은 가입 자체를 막는다
-- ⚠️ Supabase Auth Hook 함수 시그니처(event 구조/에러 반환 방식)는 대시보드에서 "Before User Created"로
--    등록한 뒤 실제 가입 시도로 검증해야 한다 — 문서 버전에 따라 event 필드명이 다를 수 있다.
-- ============================================================
create or replace function public.check_beta_tester_allowlist(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text := lower(trim(event -> 'user' ->> 'email'));
  allowed boolean;
begin
  select exists (
    select 1 from public.beta_testers
    where email = user_email and status in ('invited', 'active')
  ) into allowed;

  if not allowed then
    raise exception 'user_not_allowed' using
      detail = '테스트 참여가 허용되지 않은 계정이에요.',
      hint = 'not_allowed';
  end if;

  return jsonb_build_object();
end;
$$;

comment on function public.check_beta_tester_allowlist(jsonb) is
  'Supabase Dashboard > Authentication > Hooks > Before User Created 에 이 함수를 연결한다.';

-- ============================================================
-- RLS: 전부 기본 잠금, 백엔드(service_role)만 접근한다.
-- 프론트에서 anon/사용자 키로 직접 읽어야 하는 경우가 생기면 그때 정책을 추가한다.
-- ============================================================
alter table public.beta_testers enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_audit_logs enable row level security;

-- 사용자 본인 프로필만 조회할 수 있게 열어둔다(마이페이지 등 프론트 직접 조회 대비).
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
