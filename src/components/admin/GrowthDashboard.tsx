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
  const { acquisition, activation, retention, powerUsers } = stats;
  const maxUsers = Math.max(1, ...powerUsers.map(row => row.users));
  return (
    <div className="space-y-8">
      <section className="border-b border-zinc-200 pb-6">
        <h2 className="text-sm font-medium text-zinc-600">주간 활동 사용자 · WAU</h2>
        <p className="mt-2 text-5xl font-bold text-zinc-950">{number(retention.wau)}<span className="ml-2 text-lg font-medium text-zinc-500">명</span></p>
        <p className="mt-2 text-xs text-zinc-500">오늘 포함 최근 7일 · {new Date(stats.asOf).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} KST</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">유입</h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Metric label="오늘 가입" value={`${number(acquisition.today)}명`} />
          <Metric label="이번 주 가입" value={`${number(acquisition.week)}명`} detail="KST 월요일부터" />
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
          <Metric label="DAU 7일 평균" value={`${number(retention.dau7Average)}명`} detail="오늘 포함 · 활동 0일도 포함" />
          <Metric label="MAU" value={`${number(retention.mau)}명`} detail="오늘 포함 최근 30일" />
          <Metric label="끈끈함" value={percent(retention.averageStickiness)} detail="DAU 7일 평균 ÷ MAU · 얼마나 자주 오나" />
          <Metric label="돌아온 사용자" value={`${number(retention.resurrected)}명`} detail="14일 이상 무활동 후 최근 7일 복귀" />
          {retention.cohorts.map(row => <Metric key={row.day} label={`D${row.day} 잔존율`} value={percent(row.rate)} detail={`${number(row.retained)} / ${number(row.eligible)}명 · 해당 KST 날짜가 지난 가입자`} />)}
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
