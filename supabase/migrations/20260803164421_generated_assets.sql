-- spec-addendum-backend.md 17.3: AI 이미지 생성 결과를 R2에 올린 뒤 object key를 generated_assets에 등록한다.
-- characters/contents 테이블이 아직 없으므로 관련 컬럼은 FK 없이 nullable uuid로 두고,
-- 해당 테이블이 생기는 단계에서 FK를 추가한다.

create table if not exists public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id uuid,
  content_id uuid,
  generation_job_id uuid,

  asset_type text not null check (asset_type in ('CHARACTER_IMAGE', 'SCENE_IMAGE')),
  object_key text not null,
  mime_type text not null,
  width integer,
  height integer,

  created_at timestamptz not null default now()
);

create index if not exists generated_assets_user_id_idx on public.generated_assets (user_id);

alter table public.generated_assets enable row level security;

grant all on public.generated_assets to service_role;
grant select on public.generated_assets to authenticated;

create policy "generated_assets_select_own" on public.generated_assets
  for select using (auth.uid() = user_id);
