-- spec-addendum-backend.md 18/21장: 영상 생성 1차 POC.
-- Cloud Tasks 없이 job 테이블 + provider operation id + 프론트엔드 폴링으로 비동기 구조의
-- 최소 형태만 검증한다. QUEUED/CANCELED 상태와 Cloud Tasks 연동은 이후 배치에서 추가한다.

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  feature_type text not null check (feature_type in ('SCENE_VIDEO')),
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')),

  provider text not null,
  model text not null,
  provider_operation_id text,

  input jsonb not null,
  requested_duration_seconds numeric,
  actual_duration_seconds numeric,
  resolution text,
  result_object_key text,

  error_code text,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists generation_jobs_user_id_idx on public.generation_jobs (user_id);

drop trigger if exists set_generation_jobs_updated_at on public.generation_jobs;
create trigger set_generation_jobs_updated_at
  before update on public.generation_jobs
  for each row execute function public.set_updated_at();

alter table public.generation_jobs enable row level security;

grant all on public.generation_jobs to service_role;
grant select on public.generation_jobs to authenticated;

create policy "generation_jobs_select_own" on public.generation_jobs
  for select using (auth.uid() = user_id);
