-- spec-addendum-backend.md 18.2/19.2: 장면별로 생성한 영상을 순서대로 이어붙여 하나의 콘텐츠로 만든다.
-- projects 테이블은 아직 없으므로 project_id는 FK 없이 nullable uuid로 둔다.

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,

  title text,
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')),
  result_object_key text,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists contents_user_id_idx on public.contents (user_id);

drop trigger if exists set_contents_updated_at on public.contents;
create trigger set_contents_updated_at
  before update on public.contents
  for each row execute function public.set_updated_at();

create table if not exists public.content_scenes (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete cascade,
  scene_order integer not null,
  generation_job_id uuid references public.generation_jobs (id),
  video_object_key text not null,
  duration_seconds numeric,
  created_at timestamptz not null default now(),

  unique (content_id, scene_order)
);

create index if not exists content_scenes_content_id_idx on public.content_scenes (content_id);

-- generation_jobs가 SCENE_VIDEO 전용이었는데, FFmpeg 최종 조합(FINAL_RENDER) 작업도 같은 테이블/폴링
-- 구조를 재사용한다. ai_usage_logs.feature_type에는 이미 FINAL_RENDER가 포함돼 있다.
alter table public.generation_jobs drop constraint if exists generation_jobs_feature_type_check;
alter table public.generation_jobs add constraint generation_jobs_feature_type_check
  check (feature_type in ('SCENE_VIDEO', 'FINAL_RENDER'));

alter table public.contents enable row level security;
alter table public.content_scenes enable row level security;

grant all on public.contents to service_role;
grant all on public.content_scenes to service_role;
grant select on public.contents to authenticated;
grant select on public.content_scenes to authenticated;

create policy "contents_select_own" on public.contents
  for select using (auth.uid() = user_id);

create policy "content_scenes_select_own" on public.content_scenes
  for select using (
    exists (
      select 1 from public.contents
      where contents.id = content_scenes.content_id
      and contents.user_id = auth.uid()
    )
  );
