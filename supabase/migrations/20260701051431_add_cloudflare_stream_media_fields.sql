-- Cloudflare Stream 전환용 메타데이터.
-- 기존 Supabase Storage 영상/이미지는 provider null + ready 로 유지되어 하위호환된다.

alter table public.post_media
  add column if not exists provider text,
  add column if not exists provider_asset_id text,
  add column if not exists processing_status text not null default 'ready';

alter table public.stories
  add column if not exists provider text,
  add column if not exists provider_asset_id text,
  add column if not exists processing_status text not null default 'ready';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'post_media_provider_check'
      and conrelid = 'public.post_media'::regclass
  ) then
    alter table public.post_media
      add constraint post_media_provider_check
      check (provider is null or provider in ('cloudflare_stream'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'stories_provider_check'
      and conrelid = 'public.stories'::regclass
  ) then
    alter table public.stories
      add constraint stories_provider_check
      check (provider is null or provider in ('cloudflare_stream'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'post_media_processing_status_check'
      and conrelid = 'public.post_media'::regclass
  ) then
    alter table public.post_media
      add constraint post_media_processing_status_check
      check (processing_status in ('processing', 'ready', 'failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'stories_processing_status_check'
      and conrelid = 'public.stories'::regclass
  ) then
    alter table public.stories
      add constraint stories_processing_status_check
      check (processing_status in ('processing', 'ready', 'failed'));
  end if;
end $$;

create index if not exists idx_post_media_provider_asset_id
  on public.post_media(provider_asset_id)
  where provider_asset_id is not null;

create index if not exists idx_stories_provider_asset_id
  on public.stories(provider_asset_id)
  where provider_asset_id is not null;
