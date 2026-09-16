import type { ReactNode } from "react";
import type { AdminGrowthStats } from "@/features/admin/growth";

const number = (value: number) => value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
const percent = (value: number | null) => value === null ? "대상 없음" : `${number(value)}%`;
const STAGES: Record<string, string> = {
  signup: "가입", feed: "피드 열람", post: "글 작성", like: "좋아요", crew: "크루 맺기",
};

function Metric({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-2 break-words text-2xl font-semibold text-zinc-950">{value}</dd>
      {detail ? <p className="mt-1 text-xs text-zinc-500">{detail}</p> : null}
    </div>
  );
}

export function GrowthDashboard({ stats }: { stats: AdminGrowthStats }) {
  const { acquisition, activation, retention, powerUsers, content } = stats;
  const maxUsers = Math.max(1, ...powerUsers.map(row => row.users));
  const maxAuthors = Math.max(1, ...content.northStar.map(row => row.authors));
  const currentWeek = content.northStar[content.northStar.length - 1];
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8">
      <section className="border-b border-zinc-200 pb-6">
        <h2 className="text-sm font-medium text-zinc-600">이번 주 반응받은 작성자</h2>
        <p className="mt-2 text-5xl font-bold text-zinc-950">{number(currentWeek.authors)}<span className="ml-2 text-lg font-medium text-zinc-500">명</span></p>
        <p className="mt-2 text-xs text-zinc-500">KST 월요일부터 작성한 글 · 타인 좋아요·댓글 기준 · {new Date(stats.asOf).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} KST</p>
        <div className="mt-4 space-y-2">
          {/* 의도: 모든 주는 왼쪽 기준선과 동일 최대값을 공유한다. */}
          {content.northStar.map(row => (
            <div key={row.weekStart} className="grid grid-cols-[6rem_minmax(0,1fr)_3rem] items-center gap-2 text-xs">
              <span className="text-zinc-500">{row.weekStart}</span>
              <div className="h-4 overflow-hidden rounded-sm bg-zinc-200" aria-hidden="true">
                <div className="h-full bg-zinc-700" style={{ width: `${row.authors / maxAuthors * 100}%` }} />
              </div>
              <span className="text-right text-zinc-700">{number(row.authors)}명</span>
            </div>
          ))}
          <div className="grid grid-cols-[6rem_minmax(0,1fr)_3rem] gap-2 text-xs text-zinc-500" aria-hidden="true">
            <span />
            <div className="flex justify-between border-t border-zinc-300 pt-1"><span>0</span><span>{number(maxAuthors)}명</span></div>
            <span />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">콘텐츠 반응</h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Metric label="무반응률" value={percent(content.noReaction.rate)} detail={`최근 30일 ${content.noReaction.posts}개 중 ${content.noReaction.silent}개 · 새 글 포함`} />
          <Metric label="첫 반응까지 중앙값" value={content.firstReaction.medianHours === null ? "반응 없음" : `${number(content.firstReaction.medianHours)}시간`} detail={`최근 30일 · 타인 반응받은 ${content.firstReaction.measured}개 글`} />
          <Metric label="7일 이내 재작성률" value={percent(content.rewrite.rate)} detail={`${content.rewrite.repeated} / ${content.rewrite.eligible}명 · 첫 글 후 7일이 지난 작성자`} />
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">유입</h2>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="오늘 가입" value={`${number(acquisition.day1)}명`} detail="KST 오늘" />
          <Metric label="최근 7일 가입" value={`${number(acquisition.day7)}명`} detail="KST 오늘 포함" />
          <Metric label="최근 30일 가입" value={`${number(acquisition.day30)}명`} detail="KST 오늘 포함" />
          <Metric label="누적 가입" value={`${number(acquisition.total)}명`} detail="활성 계정 · 탈퇴 제외" />
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold">활성화</h2>
        <p className="mt-1 text-xs text-zinc-500">가입자 대비 행동별 도달률 · 순차 전환율 아님</p>
        <div className="mt-4 divide-y divide-zinc-200">
          {activation.stages.map(stage => (
            <div key={stage.key} className="py-3">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium">{STAGES[stage.key]}</span>
                <span>{number(stage.count)}명 · {percent(stage.rate)}<span className="ml-2 text-zinc-500">미도달 {number(Math.max(0, acquisition.total - stage.count))}명</span></span>
              </div>
              <div className="mt-2 h-5 w-full overflow-hidden rounded-sm bg-zinc-200" aria-hidden="true">
                <div className="h-full rounded-sm bg-emerald-600" style={{ width: `${Math.min(100, stage.rate ?? 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label="가입 → 첫 글 평균" value={activation.averageFirstPostHours === null ? "작성자 없음" : `${number(activation.averageFirstPostHours)}시간`} detail="삭제되지 않은 글 기준" />
          <Metric label="가입 후 7일 이내 첫 글" value={`${number(activation.firstPostWithin7Days)}명`} />
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">활동과 잔존</h2>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="오늘 DAU" value={`${number(retention.dau)}명`} detail="KST 오늘" />
          <Metric label="WAU" value={`${number(retention.wau)}명`} detail="오늘 포함 최근 7일" />
          <Metric label="DAU 7일 평균" value={`${number(retention.dau7Average)}명`} detail="오늘 포함 · 활동 0일도 포함" />
          <Metric label="MAU" value={`${number(retention.mau)}명`} detail="오늘 포함 최근 30일" />
          <Metric label="끈끈함" value={percent(retention.averageStickiness)} detail="DAU 7일 평균 ÷ MAU · 얼마나 자주 오나" />
          <Metric label="돌아온 사용자" value={`${number(retention.resurrected)}명`} detail="14일 이상 무활동 후 최근 7일 복귀" />
          {retention.cohorts.map(row => <Metric key={row.day}
            label={`D${row.day} · ${row.windowStart === row.windowEnd ? row.windowEnd : `${row.windowStart}~${row.windowEnd}`}일차`}
            value={<><span className="block">잔존 {percent(row.rate)}</span><span className="mt-1 block text-base text-zinc-500">이탈 {percent(row.churnRate)}</span></>}
            detail={`${number(row.retained)} / ${number(row.eligible)}명 · 마지막 판정 날짜가 지난 가입자`} />)}
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold">파워유저 곡선</h2>
        <p className="mt-1 text-xs text-zinc-500">
          최근 30일 중 며칠 활동했는지 · 오른쪽으로 갈수록 자주 오는 사용자
        </p>
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[620px]">
            {/* 막대: 바닥선을 공유하도록 justify-end */}
            <div className="flex items-end gap-[3px]" style={{ height: 150 }}>
              {powerUsers.map(row => (
                <div
                  key={row.days}
                  className="flex flex-1 flex-col justify-end"
                  title={`30일 중 ${row.days}일 활동 · ${row.users}명`}
                >
                  {row.users > 0 ? (
                    <span className="mb-1 text-center text-[10px] font-medium text-zinc-700">
                      {row.users}
                    </span>
                  ) : null}
                  <div
                    className={row.users > 0 ? "w-full bg-sky-600" : "w-full bg-zinc-200"}
                    style={{
                      height: row.users > 0 ? `${(110 * row.users) / maxUsers}px` : "3px",
                    }}
                  />
                </div>
              ))}
            </div>
            {/* 축: 막대와 완전히 분리된 별도 줄 */}
            <div className="mt-1 flex gap-[3px] border-t border-zinc-300 pt-1">
              {powerUsers.map(row => (
                <span key={row.days} className="flex-1 text-center text-[10px] text-zinc-400">
                  {row.days === 1 || row.days % 5 === 0 ? row.days : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          가로축 = 30일 중 활동한 날짜 수, 세로축 = 그만큼 활동한 사용자 수.
          오른쪽 끝에 덩어리가 생기면 매일 오는 핵심 사용자가 있다는 뜻이다.
        </p>
      </section>
    </div>
  );
}
