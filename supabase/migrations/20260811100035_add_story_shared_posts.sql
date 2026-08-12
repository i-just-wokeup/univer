alter table public.stories
  add column if not exists shared_post_id uuid
    references public.posts(id) on delete set null;

alter table public.stories
  alter column image_url drop not null;

alter table public.stories
  drop constraint if exists stories_media_or_shared_post_check;

alter table public.stories
  add constraint stories_media_or_shared_post_check
  check (image_url is not null or shared_post_id is not null);

create index if not exists stories_shared_post_id_idx
  on public.stories(shared_post_id)
  where shared_post_id is not null;

create or replace function public.validate_story_shared_post()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.shared_post_id is null then
    return new;
  end if;

  if (select auth.uid()) is null or not exists (
    select 1
    from public.posts p
    where p.id = new.shared_post_id
      and p.user_id = (select auth.uid())
      and p.university_id = new.university_id
      and p.deleted_at is null
  ) then
    raise exception '본인의 게시물만 스토리에 추가할 수 있습니다.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_story_shared_post_trigger on public.stories;
create trigger validate_story_shared_post_trigger
before insert or update of shared_post_id, user_id, university_id
on public.stories
for each row
execute function public.validate_story_shared_post();

revoke execute on function public.validate_story_shared_post()
  from public, anon, authenticated;
