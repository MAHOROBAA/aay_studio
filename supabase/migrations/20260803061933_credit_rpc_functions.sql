-- spec-addendum-backend.md 13.3: available → reserved → consumed, 실패 시 reserved → refunded.
-- 동시 요청에 대한 잔액 정합성을 보장하기 위해 JS 쪽에서 여러 단계로 나눠 처리하지 않고,
-- 하나의 Postgres 함수(트랜잭션) 안에서 잔액 확인/차감/원장 기록을 원자적으로 처리한다.

create or replace function public.reserve_credit(
  p_user_id uuid,
  p_amount integer,
  p_feature_type text,
  p_idempotency_key text
)
returns public.credit_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_tx public.credit_transactions;
  account public.credit_accounts;
  result public.credit_transactions;
begin
  select * into existing_tx from credit_transactions where idempotency_key = p_idempotency_key;
  if found then
    return existing_tx;
  end if;

  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into account from credit_accounts where user_id = p_user_id for update;
  if not found then
    raise exception 'account_not_found';
  end if;

  if account.available_balance < p_amount then
    raise exception 'insufficient_credit';
  end if;

  update credit_accounts
  set available_balance = available_balance - p_amount,
      reserved_balance = reserved_balance + p_amount
  where user_id = p_user_id;

  insert into credit_transactions (
    user_id, type, amount, balance_after, feature_type, idempotency_key, created_by
  ) values (
    p_user_id, 'RESERVE', -p_amount, account.available_balance - p_amount, p_feature_type, p_idempotency_key, 'system'
  ) returning * into result;

  return result;
end;
$$;

create or replace function public.consume_credit(
  p_user_id uuid,
  p_amount integer,
  p_generation_job_id uuid,
  p_idempotency_key text
)
returns public.credit_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_tx public.credit_transactions;
  account public.credit_accounts;
  result public.credit_transactions;
begin
  select * into existing_tx from credit_transactions where idempotency_key = p_idempotency_key;
  if found then
    return existing_tx;
  end if;

  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into account from credit_accounts where user_id = p_user_id for update;
  if not found then
    raise exception 'account_not_found';
  end if;

  if account.reserved_balance < p_amount then
    raise exception 'insufficient_reserved_credit';
  end if;

  update credit_accounts
  set reserved_balance = reserved_balance - p_amount
  where user_id = p_user_id;

  insert into credit_transactions (
    user_id, type, amount, balance_after, generation_job_id, idempotency_key, created_by
  ) values (
    p_user_id, 'CONSUME', -p_amount, account.available_balance, p_generation_job_id, p_idempotency_key, 'system'
  ) returning * into result;

  return result;
end;
$$;

create or replace function public.refund_credit(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_idempotency_key text
)
returns public.credit_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_tx public.credit_transactions;
  account public.credit_accounts;
  result public.credit_transactions;
begin
  select * into existing_tx from credit_transactions where idempotency_key = p_idempotency_key;
  if found then
    return existing_tx;
  end if;

  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into account from credit_accounts where user_id = p_user_id for update;
  if not found then
    raise exception 'account_not_found';
  end if;

  if account.reserved_balance < p_amount then
    raise exception 'insufficient_reserved_credit';
  end if;

  update credit_accounts
  set reserved_balance = reserved_balance - p_amount,
      available_balance = available_balance + p_amount
  where user_id = p_user_id;

  insert into credit_transactions (
    user_id, type, amount, balance_after, reason, idempotency_key, created_by
  ) values (
    p_user_id, 'REFUND', p_amount, account.available_balance + p_amount, p_reason, p_idempotency_key, 'system'
  ) returning * into result;

  return result;
end;
$$;

grant execute on function public.reserve_credit(uuid, integer, text, text) to service_role;
grant execute on function public.consume_credit(uuid, integer, uuid, text) to service_role;
grant execute on function public.refund_credit(uuid, integer, text, text) to service_role;
