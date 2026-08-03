-- spec-addendum-backend.md 14장: 모든 AI 호출은 ai_usage_logs에 기록해서 기능별 실제 원가를 측정한다.
-- projects/contents/generation_jobs 테이블은 아직 없으므로 관련 컬럼은 FK 없이 nullable uuid로 두고,
-- 해당 테이블이 생기는 단계에서 FK를 추가한다.

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,
  content_id uuid,
  generation_job_id uuid,

  feature_type text not null check (
    feature_type in (
      'WORLD_RECOMMEND', 'STORY_RECOMMEND', 'CHARACTER_IMAGE', 'SCENE_IMAGE',
      'SCENE_VIDEO', 'TTS', 'SUBTITLE', 'THUMBNAIL', 'FINAL_RENDER'
    )
  ),
  provider text not null,
  model text not null,

  input_tokens integer,
  output_tokens integer,
  input_image_count integer,
  output_image_count integer,
  video_duration_seconds numeric,
  output_resolution text,

  provider_cost_usd numeric(10, 6),
  exchange_rate numeric(10, 4),
  provider_cost_krw numeric(12, 2),

  credit_reserved integer,
  credit_consumed integer,

  status text not null check (status in ('SUCCEEDED', 'FAILED')),
  error_code text,
  error_message text,

  requested_at timestamptz not null,
  completed_at timestamptz,
  duration_ms integer,

  created_at timestamptz not null default now()
);

create index if not exists ai_usage_logs_user_id_idx on public.ai_usage_logs (user_id);
create index if not exists ai_usage_logs_feature_type_idx on public.ai_usage_logs (feature_type);

alter table public.ai_usage_logs enable row level security;

grant all on public.ai_usage_logs to service_role;
grant select on public.ai_usage_logs to authenticated;

create policy "ai_usage_logs_select_own" on public.ai_usage_logs
  for select using (auth.uid() = user_id);
