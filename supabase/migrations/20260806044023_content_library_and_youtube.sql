-- spec-addendum-backend.md 5.2, aay-studio-spec.md 2장/5.9/8장: 캐릭터·세계관·스토리·프로젝트
-- 라이브러리와 YouTube 채널 연결/게시 테이블.
--
-- credit_policies, analytics_events는 spec-addendum-backend.md 5.2에 이름만 있고 컬럼·용도가
-- 정의되지 않아 이번 마이그레이션에서 제외한다(정책 미정으로 보류, 삭제된 요구사항 아님).
--
-- youtube_connections의 토큰 컬럼은 실제 암호화/복호화 구현을 포함하지 않는다. 값을 저장할 컬럼
-- 자리만 만들고, 암호화 방식과 키 관리는 별도 구현안을 먼저 제시해 확인받은 뒤 채운다.

-- ============================================================
-- worlds — ai.service.ts의 WorldResult와 1:1 대응
-- ============================================================
create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  name text not null,
  short_description text,
  description text,
  time_background text,
  space_background text,
  rules text,
  restrictions text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists worlds_user_id_idx on public.worlds (user_id);

drop trigger if exists set_worlds_updated_at on public.worlds;
create trigger set_worlds_updated_at
  before update on public.worlds
  for each row execute function public.set_updated_at();

-- ============================================================
-- stories — ai.service.ts의 StoryResult와 1:1 대응. world_id/parent_story_id는
-- "세계관·스토리는 독립적으로 저장·재사용 가능"(spec 2.2/2.3) 정책에 따라 둘 다 nullable.
-- ============================================================
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  world_id uuid references public.worlds (id) on delete set null,
  parent_story_id uuid references public.stories (id) on delete set null,

  title text not null,
  summary text,
  scenes jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_user_id_idx on public.stories (user_id);
create index if not exists stories_world_id_idx on public.stories (world_id);

drop trigger if exists set_stories_updated_at on public.stories;
create trigger set_stories_updated_at
  before update on public.stories
  for each row execute function public.set_updated_at();

-- ============================================================
-- characters — spec 2.1의 예시 정보(외형·의상·체형·말투 등)는 자유 구조라
-- profile jsonb 하나로 유연하게 저장한다.
-- ============================================================
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  name text not null,
  role text not null default 'SUPPORTING' check (role in ('LEAD', 'SUPPORTING')),
  profile jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_user_id_idx on public.characters (user_id);

drop trigger if exists set_characters_updated_at on public.characters;
create trigger set_characters_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();

-- ============================================================
-- character_images — 캐릭터별 참조 이미지(사용자 업로드)와 생성 이미지를 함께 관리.
-- user_id가 없으므로 RLS는 상위 characters의 소유권을 확인한다.
-- ============================================================
create table if not exists public.character_images (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,

  object_key text not null,
  is_reference boolean not null default false,
  generation_job_id uuid references public.generation_jobs (id) on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists character_images_character_id_idx on public.character_images (character_id);

-- ============================================================
-- story_characters — 스토리별 등장 캐릭터 M:N (spec 2.4). user_id가 없으므로
-- RLS는 상위 stories의 소유권을 확인한다.
-- ============================================================
create table if not exists public.story_characters (
  story_id uuid not null references public.stories (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (story_id, character_id)
);

create index if not exists story_characters_character_id_idx on public.story_characters (character_id);

-- ============================================================
-- projects — 제작 방식(story/free)·화면비율·길이와 선택한 세계관/스토리를 묶는
-- 영상 제작 세션 단위. contents.project_id가 참조한다.
-- ============================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  flow text not null check (flow in ('story', 'free')),
  ratio text,
  duration_seconds integer,
  world_id uuid references public.worlds (id) on delete set null,
  story_id uuid references public.stories (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ============================================================
-- youtube_connections — spec-addendum-backend.md 6.2: AAY 로그인과 분리된 채널 연결.
-- 한 사용자가 여러 채널을 연결할 수 있다(멀티채널).
--
-- 토큰 컬럼은 프론트엔드에 절대 노출하지 않는다: authenticated 롤에는 select를 grant하지
-- 않고(RLS 정책도 만들지 않음), service_role(백엔드)만 접근한다. 채널명·썸네일 등 공개 가능한
-- 필드는 백엔드가 별도 응답 DTO로 가공해서 내려준다.
-- ============================================================
create table if not exists public.youtube_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  youtube_channel_id text not null,
  channel_title text,
  channel_thumbnail_url text,

  refresh_token_encrypted text not null,
  access_token_encrypted text,
  token_expires_at timestamptz,

  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'REVOKED', 'ERROR')),
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, youtube_channel_id)
);

create index if not exists youtube_connections_user_id_idx on public.youtube_connections (user_id);

drop trigger if exists set_youtube_connections_updated_at on public.youtube_connections;
create trigger set_youtube_connections_updated_at
  before update on public.youtube_connections
  for each row execute function public.set_updated_at();

-- ============================================================
-- publications — spec-addendum-backend.md 22장: YouTube 자체 예약(publishAt) 방식.
-- 라이브러리 상태(게시완료/예약게시/게시실패, spec 5.9)와 대응한다.
-- ============================================================
create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  youtube_connection_id uuid not null references public.youtube_connections (id),

  youtube_video_id text,
  publish_mode text not null check (publish_mode in ('IMMEDIATE', 'SCHEDULED')),
  scheduled_at timestamptz,
  privacy_status text not null default 'private',
  status text not null default 'PENDING' check (
    status in ('PENDING', 'UPLOADING', 'SCHEDULED', 'PUBLISHED', 'FAILED')
  ),
  title text,
  description text,
  error_code text,
  error_message text,
  published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists publications_user_id_idx on public.publications (user_id);
create index if not exists publications_content_id_idx on public.publications (content_id);

drop trigger if exists set_publications_updated_at on public.publications;
create trigger set_publications_updated_at
  before update on public.publications
  for each row execute function public.set_updated_at();

-- ============================================================
-- 기존 테이블에 FK 추가 (지금까지는 대상 테이블이 없어 FK 없는 uuid로 남겨뒀던 컬럼들).
-- 적용 전 확인: 세 컬럼 모두 현재 non-null 행이 0개라 기존 데이터로 인한 제약 위반은 없다.
-- ============================================================
alter table public.contents drop constraint if exists contents_project_id_fkey;
alter table public.contents
  add constraint contents_project_id_fkey foreign key (project_id) references public.projects (id);

alter table public.generated_assets drop constraint if exists generated_assets_character_id_fkey;
alter table public.generated_assets
  add constraint generated_assets_character_id_fkey foreign key (character_id) references public.characters (id);

alter table public.generated_assets drop constraint if exists generated_assets_content_id_fkey;
alter table public.generated_assets
  add constraint generated_assets_content_id_fkey foreign key (content_id) references public.contents (id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.worlds enable row level security;
alter table public.stories enable row level security;
alter table public.characters enable row level security;
alter table public.character_images enable row level security;
alter table public.story_characters enable row level security;
alter table public.projects enable row level security;
alter table public.youtube_connections enable row level security;
alter table public.publications enable row level security;

grant all on public.worlds to service_role;
grant all on public.stories to service_role;
grant all on public.characters to service_role;
grant all on public.character_images to service_role;
grant all on public.story_characters to service_role;
grant all on public.projects to service_role;
grant all on public.youtube_connections to service_role;
grant all on public.publications to service_role;

grant select on public.worlds to authenticated;
grant select on public.stories to authenticated;
grant select on public.characters to authenticated;
grant select on public.character_images to authenticated;
grant select on public.story_characters to authenticated;
grant select on public.projects to authenticated;
grant select on public.publications to authenticated;
-- youtube_connections는 authenticated에 select를 grant하지 않는다 (토큰 보호).

create policy "worlds_select_own" on public.worlds
  for select using (auth.uid() = user_id);

create policy "stories_select_own" on public.stories
  for select using (auth.uid() = user_id);

create policy "characters_select_own" on public.characters
  for select using (auth.uid() = user_id);

create policy "character_images_select_own" on public.character_images
  for select using (
    exists (
      select 1 from public.characters
      where characters.id = character_images.character_id
      and characters.user_id = auth.uid()
    )
  );

create policy "story_characters_select_own" on public.story_characters
  for select using (
    exists (
      select 1 from public.stories
      where stories.id = story_characters.story_id
      and stories.user_id = auth.uid()
    )
  );

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

create policy "publications_select_own" on public.publications
  for select using (auth.uid() = user_id);
