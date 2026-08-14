drop policy if exists promotion_requests_select_own on public.promotion_requests;

create policy promotion_requests_select_own
on public.promotion_requests
for select
to authenticated
using (user_id = (select auth.uid()));
