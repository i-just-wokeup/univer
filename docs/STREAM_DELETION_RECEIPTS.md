# 영상 삭제 접수 관찰

DB에서 확인 가능한 후보만 기록한다. **Cloudflare 삭제·재생 차단·업로드 대장·크론은 없다.**

2026-09-16 원격 `qmslcvnuzjraphvnaqxx`에 `20260916074702_stream_deletion_receipts` 적용 완료. 백필 접수 17건 / 고유 영상 17개(게시물 15, 스토리 2), 모두 pending. 관리자 실제 역할 조회 17행, 일반 사용자 0행·쓰기 권한 없음, anon 읽기 불가 확인.

## 상태와 식별

- 영상: provider + provider_account_id + provider_asset_id. 기존 원본에 계정 ID가 없으므로 추측하지 않고 NULL. 미래 실행 전 실제 계정 매핑 필수.
- 사건: source_table + source_id + generation. 같은 UID를 여러 원본이 쓰면 접수는 여러 건이다.
- soft → hard: 같은 활성 사건에 hard_deleted_at 보강. 복구: 현재 UID 사건만 cancelled. 재삭제: 새 generation. 교체된 과거 UID는 복구로 취소하지 않는다.
- pending / held / cancelled. held는 운영자 조사용이며 자동 판정하지 않는다. 같은 UID에 살아 있는 다른 참조가 있는지는 미래 삭제 실행 직전 반드시 전수 재검증해야 한다.
- recorded_at은 관찰 시각, source_deleted_at은 원본 삭제 시각. hard delete만 관측하면 후자는 NULL일 수 있다.
- eligible_after는 NULL만 허용하는 CHECK. 정책 승인 전 날짜를 넣을 수도 없다. policy_version=observation-v1. 실행기를 붙일 때 이 제약도 별도 승인 후 바꾼다.
- 원본/사용자 FK 없음. owner_id는 nullable이며 CASCADE 중에는 부모를 조회하지 않는다. 제목·이메일·URL은 기록하지 않는다.

## 포착 범위와 한계

posts.deleted_at 변경과 post_media/stories의 INSERT·관련 UPDATE·BEFORE DELETE를 관찰한다. 앱/웹 직접 삭제, 관리자 신고 삭제·복구, 계정 탈퇴·복구 RPC, CASCADE, UID/provider 변경·NULL화, 삭제된 게시물에 늦게 붙은 미디어를 포함한다.

expires_at은 삭제가 아니므로 무시한다. 사용자의 deleted_at만 직접 변경하고 콘텐츠는 그대로 두는 비표준 SQL은 관찰하지 않는다. 업로드 후 DB 저장 실패, TRUNCATE, 트리거 비활성화, 과거 이미 사라진 원본은 포착하지 못한다.

접수 DML은 예외 하위 트랜잭션으로 격리한다. 실패 시 `stream_receipt_failed source=... id=... action=... sqlstate=...` WARNING, 원본 삭제는 계속한다. 오류 원문/URL/비밀값은 로그에 싣지 않는다. BEFORE DELETE의 정상/예외 경로 모두 OLD 반환. 동일 원본 generation은 try-advisory lock으로 직렬화하며 경합이면 기다리지 않고 경고한다.

**fail-open은 완전한 기록 보장이 아니다.** 취소 기록도 실패할 수 있다. DB 취소/연결 종료 같은 예외, 다른 트랜잭션의 행 잠금 대기는 일반적인 PostgreSQL 제한을 받는다. 누락을 찾을 업로드 대장·Cloudflare 읽기 전용 대조는 다음 단계다. 외부 HTTP는 트리거에 없다.

## 관리자 읽기

authenticated에 SELECT만 부여하고, users의 role=admin, is_active, deleted_at IS NULL을 RLS에서 확인한다. 일반 사용자는 0행, anon은 SELECT 권한 없음. 접수용 내부 함수는 PUBLIC/anon/authenticated/service_role EXECUTE를 모두 회수했다. 서버 운영자 SQL 외에 쓰기 API는 없다. 앱/웹 UI는 이번 범위에서 수정하지 않았다.

Supabase SQL Editor(운영자)에서 목록과 서로 다른 두 건수를 함께 확인한다. 일반 앱 관리자 세션도 같은 SELECT를 RLS 범위 안에서 사용할 수 있다.

```sql
select status, count(*) as receipts,
       count(distinct (provider, provider_account_id, provider_asset_id)) as unique_videos
from public.stream_deletion_receipts group by status order by status;

select source_table, source_id, provider_asset_id, generation, reason, status,
       recorded_at, source_deleted_at, hard_deleted_at, cancelled_at
from public.stream_deletion_receipts order by recorded_at desc, id desc;
```

## 접수증 보존

의도: 취소된 사건은 취소 후 90일간 보존하고 이후 수동 정리 대상으로 한다. 미해결 pending/held는 유일한 삭제 근거를 잃지 않도록 해결까지 보존하되 **90일마다 필요성·owner_id 최소화·처리 정책을 재검토**한다. 자동 정리 작업은 만들지 않았다. 따라서 90일 자동 삭제 보장이 아니며 운영자의 수동 검토가 필요하다. 실제 영상 삭제 정책이나 탈퇴 30일 유예와는 별개다.

## 재현 테스트

`supabase/tests/stream_deletion_receipts.test.mjs`는 임시 PGlite PostgreSQL에 축소 스키마와 실제 마이그레이션/RPC 본문을 로드한다. 프로덕션 사용자·게시물은 변경하지 않는다. PGlite는 앱/웹 의존성에 추가하지 않는다.

```sh
npm install --prefix /tmp/univer-receipts-test --no-audit --no-fund @electric-sql/pglite
PGLITE_MODULE=/tmp/univer-receipts-test/node_modules/@electric-sql/pglite/dist/index.js node supabase/tests/stream_deletion_receipts.test.mjs
```

검증: 백필 시각, soft/restore/redelete 세대, 실제 delete_account/restore_account/handle_admin_report, UID 교체/NULL/재부착, 늦은 삽입, 공유 UID, 만료 제외, 부모 삭제 CASCADE, 실패 주입 시 삭제 진행과 WARNING, 관리자/일반/anon 권한 및 내부 함수 호출 차단. 다중 연결 경합 및 Cloudflare 상태 대조는 이 단일 연결 fixture로 검증하지 않는다.
