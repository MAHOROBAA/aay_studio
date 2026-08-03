-- spec-addendum-backend.md 12.3/12.4: 관리자 CLI를 통한 테스트 크레딧 추가 지급/회수.
-- reserve/consume/refund와 동일하게 잔액 확인/갱신/원장 기록을 하나의 함수(트랜잭션)로 처리한다.

create or replace function public.grant_manual_credit(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_idempotency_key text,
  p_created_by text
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

  update credit_accounts
  set available_balance = available_balance + p_amount
  where user_id = p_user_id;

  insert into credit_transactions (
    user_id, type, amount, balance_after, reason, idempotency_key, created_by
  ) values (
    p_user_id, 'BETA_MANUAL_GRANT', p_amount, account.available_balance + p_amount, p_reason, p_idempotency_key, p_created_by
  ) returning * into result;

  return result;
end;
$$;

create or replace function public.deduct_manual_credit(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_idempotency_key text,
  p_created_by text
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
  set available_balance = available_balance - p_amount
  where user_id = p_user_id;

  insert into credit_transactions (
    user_id, type, amount, balance_after, reason, idempotency_key, created_by
  ) values (
    p_user_id, 'BETA_MANUAL_DEDUCT', -p_amount, account.available_balance - p_amount, p_reason, p_idempotency_key, p_created_by
  ) returning * into result;

  return result;
end;
$$;

grant execute on function public.grant_manual_credit(uuid, integer, text, text, text) to service_role;
grant execute on function public.deduct_manual_credit(uuid, integer, text, text, text) to service_role;
