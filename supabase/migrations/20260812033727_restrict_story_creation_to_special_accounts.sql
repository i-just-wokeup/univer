drop policy if exists stories_insert_own on public.stories;

create policy stories_insert_own
on public.stories
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.official_accounts oa
      where oa.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.is_promoted = true
    )
  )
);
