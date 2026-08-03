-- spec-addendum-backend.md 12~13장: 테스트 크레딧 원장

-- ============================================================
-- credit_accounts
-- ============================================================
create table if not exists public.credit_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  available_balance integer not null default 0,
  reserved_balance integer not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_credit_accounts_updated_at on public.credit_accounts;
create trigger set_credit_accounts_updated_at
  before update on public.credit_accounts
  for each row execute function public.set_updated_at();

-- ============================================================
-- credit_transactions: 모든 적립/예약/사용/환불/회수를 기록한다.
-- ============================================================
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (
    type in ('BETA_INITIAL_GRANT', 'BETA_MANUAL_GRANT', 'BETA_MANUAL_DEDUCT', 'RESERVE', 'CONSUME', 'REFUND')
  ),
  amount integer not null,
  balance_after integer not null,
  feature_type text,
  generation_job_id uuid,
  reason text,
  idempotency_key text unique,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_id_idx on public.credit_transactions (user_id);

-- ============================================================
-- 신규 가입 트리거 확장: profiles/beta_testers 처리에 이어 최초 테스트 크레딧을 1회 지급한다.
-- (Step 2에서 만든 handle_new_auth_user를 대체한다 — auth.users INSERT 시 딱 한 번만 실행되므로
-- "최초 로그인 시 1회 지급" 요건과 자연스럽게 맞아떨어진다. idempotency_key로 한 번 더 방어한다.)
-- ============================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(new.email));
  tester_default_credit integer;
begin
  insert into public.profiles (id, email, name)
  values (new.id, normalized_email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  select default_credit into tester_default_credit
  from public.beta_testers
  where email = normalized_email;

  update public.beta_testers
  set
    status = 'active',
    joined_at = coalesce(joined_at, now()),
    last_login_at = now()
  where email = normalized_email;

  tester_default_credit := coalesce(tester_default_credit, 0);

  insert into public.credit_accounts (user_id, available_balance, reserved_balance)
  values (new.id, tester_default_credit, 0)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (
    user_id, type, amount, balance_after, reason, idempotency_key, created_by
  )
  values (
    new.id,
    'BETA_INITIAL_GRANT',
    tester_default_credit,
    tester_default_credit,
    '최초 가입 테스트 크레딧',
    'beta-initial-grant:' || new.id,
    'system'
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

-- ============================================================
-- 권한
-- ============================================================
alter table public.credit_accounts enable row level security;
alter table public.credit_transactions enable row level security;

grant all on public.credit_accounts to service_role;
grant all on public.credit_transactions to service_role;
grant select on public.credit_accounts to authenticated;
grant select on public.credit_transactions to authenticated;

create policy "credit_accounts_select_own" on public.credit_accounts
  for select using (auth.uid() = user_id);

create policy "credit_transactions_select_own" on public.credit_transactions
  for select using (auth.uid() = user_id);
