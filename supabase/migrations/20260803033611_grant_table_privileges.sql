-- SQL Editor로 직접 테이블을 만들면 Supabase가 평소 자동으로 걸어주는 role 권한(GRANT)이
-- 안 붙는 경우가 있어서 명시적으로 부여한다. service_role은 RLS를 우회하지만, 그 전에
-- 테이블 자체에 대한 GRANT가 있어야 접근할 수 있다.

grant usage on schema public to service_role, authenticated, anon;

grant all on public.beta_testers to service_role;
grant all on public.admin_audit_logs to service_role;

grant all on public.profiles to service_role;
grant select on public.profiles to authenticated;

grant usage, select on all sequences in schema public to service_role, authenticated;
