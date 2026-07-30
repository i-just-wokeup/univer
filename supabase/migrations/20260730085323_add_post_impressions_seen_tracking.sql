-- 피드 "본 글" 기록: 유저가 피드에서 실제로 본 게시물 (중복 노출 방지 / "모두 열람" 판정용).
-- 판정 기준(예: 80% 이상·2초 이상 노출)은 앱 클라이언트에서 계산 후 insert. 지표(metric_events 조회수)와는 별개 신호.
-- 피드 순서: 크루 안 본 최신 → 전교생 안 본 최신 → "모두 열람" → 랜덤 꼬리. 상세: 노션 📺 피드/릴스 설계 9-2.
CREATE TABLE IF NOT EXISTS public.post_impressions (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.post_impressions ENABLE ROW LEVEL SECURITY;

-- 본인 기록만 조회/생성 (피드 조회 시 "안 본 것 먼저" 필터 + 클라 노출 기록)
CREATE POLICY post_impressions_select_own ON public.post_impressions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY post_impressions_insert_own ON public.post_impressions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT ON public.post_impressions TO authenticated;
