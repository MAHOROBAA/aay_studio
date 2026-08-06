-- spec-addendum-backend.md 21.1: Cloud Tasks에 등록됐지만 Worker가 아직 처리하지 않은 상태(QUEUED)를 추가한다.
-- CANCELED는 취소 기능/UI가 아직 없어서 이번 범위에서 제외한다.
-- poll_attempt: 영상 생성 완료 확인 폴링 task를 몇 번째 예약했는지 저장해서 task name 중복을 피하고
-- 폴링 상한(무한 폴링 방지)을 계산하는 데 쓴다.

alter table public.generation_jobs drop constraint if exists generation_jobs_status_check;
alter table public.generation_jobs add constraint generation_jobs_status_check
  check (status in ('PENDING', 'QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED'));

alter table public.generation_jobs add column if not exists poll_attempt integer not null default 0;
