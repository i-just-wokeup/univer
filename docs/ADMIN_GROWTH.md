# 관리자 성장 지표

## 구현과 적용 상태 (2026-09-15)

- 웹 `/admin`의 운영/성장 탭은 클라이언트 상태로 전환한다. 앱 수정이나 기록 추가 없음.
- `supabase/migrations/20260915082424_admin_growth_stats.sql`에 `public.get_admin_growth_stats()` 정의.
- 원격에서는 동일 집계 SELECT를 읽기 전용으로 검산했다. **마이그레이션 원격 적용과 웹 배포는 아직 하지 않았다.** 적용 전 성장 RPC 조회는 오류로 표시된다.
- `src/features/admin/api.ts`에서 호출하고 `growth.ts`에서 응답을 검증한다. 누락/잘못된 응답은 예외이며 0으로 보정하지 않는다.
- 운영 KPI/운영 RPC/성장 RPC는 Promise.allSettled로 독립 처리한다. 실패한 묶음만 오류를 보여주고 성공한 지표는 유지한다.

## 반환 구조

```text
asOf, timezone
acquisition: today, week, total
activation: stages[{key,count,rate}], averageFirstPostHours, firstPostWithin7Days
retention: dau, dau7Average, wau, mau, stickiness, averageStickiness,
           cohorts[{day,eligible,retained,rate}], resurrected
powerUsers: [{days,users}]  // 1~30일 모두 반환, 해당 인원이 없으면 0
```

- 비율은 0~100 단위, 소수 첫째 자리. 분모가 없으면 null이며 화면에는 대상 없음.
- 첫 글 작성자가 없으면 평균 시간은 null이며 화면에는 작성자 없음.

## 집계 계약

- 모집단은 `is_active=true AND deleted_at IS NULL`인 계정이다. 탈퇴자를 다시 포함하지 않는다.
- 활동은 요청한 네 테이블의 이벤트를 유저/KST 날짜로 중복 제거한다. `last_seen_at` 미사용. 글은 미삭제 글만, 댓글은 현재 행, 좋아요는 post_likes 행 전체를 사용한다.
- 미래 기록과 가입 전 기록은 활동에서 제외한다.
- 오늘은 KST 자정부터 조회 시점까지. 이번 주는 KST 월요일부터. WAU/MAU는 오늘을 포함한 7/30개 달력 날짜다.
- DAU 7일 평균은 최근 7일의 사용자-활동일 수 / 7. 활동 없는 날짜도 분모에 포함한다.
- 끈끈함은 **오늘 DAU/MAU**. 평균 DAU/MAU는 별도 지표다. 평균을 반올림하기 전 원값으로 비율 계산한다.
- 활성화는 순차 퍼널이 아니라 가입자 대비 행동별 도달률이다. 순서/이전 단계 통과를 강제하지 않는다. 크루는 accepted 관계 양쪽 유저를 중복 없이 센다.
- 첫 글은 현재 남아 있는 글 중 가입 후 첫 글이다. 7일 이내는 가입 시각부터 정확히 168시간 이내(경계 포함).
- D1/D7/D30은 가입 KST 날짜+N일의 활동 여부. 대상 날짜가 끝난 가입자만 분모에 포함한다. 아직 그 날짜가 오지 않았거나 오늘인 가입자를 미잔존으로 오인하지 않는다.
- 부활은 활동 이력이 있고 직전 활동과 15일 이상 날짜 차이(사이에 14일 이상의 완전한 무활동 날짜)가 나는 복귀 중 최근 7일의 유저 수다. 여러 번 복귀해도 한 명이다.

## 데이터의 한계

- `post_impressions`는 유저/게시물당 한 행이고 앱이 ignoreDuplicates로 기록한다. 같은 게시물의 반복 열람일은 기록되지 않는다.
- 삭제된 댓글/취소된 좋아요/끊어진 크루/삭제된 글의 과거 행동을 모두 복원할 수 없다. 따라서 '경험'과 잔존은 현재 남아 있는 이벤트 기준이며 불변 분석 로그가 아니다.
- 새 기록을 추가하지 말라는 범위에 따라 이 수집 동작은 바꾸지 않았다.

## 검산 (2026-09-15 17:33 KST)

| 지표 | 제공값 | 구현: 탈퇴 제외 |
|---|---:|---:|
| 가입자 | 22 | 21 |
| 오늘/이번 주 가입 | 미제공 | 0 / 0 |
| DAU / 7일 평균 / WAU | 3 / 5.0 / 13 | 3 / 5.0 / 13 |
| MAU | 21 | 20 |
| 오늘 DAU/MAU | 24% | 15% |
| 7일 평균 DAU/MAU | 미구분 | 25% |
| 피드 / 글 / 좋아요 / 크루 | 21 / 17 / 16 / 12 | 20 / 17 / 16 / 11 |
| 첫 글 평균 | 188시간 | 188.3시간 |
| 7일 이내 첫 글 | 미제공 | 15명 |
| D1 / D7 / D30 | 미제공 | 47.6% (10/21) / 33.3% (7/21) / 20% (1/5) |
| 부활 | 미제공 | 1명 |

차이는 is_active=true이지만 deleted_at이 있는 1명이다. 검산용으로 이 계정까지 포함하면 제공된 가입자/활성화/DAU/WAU/MAU/파워유저 분포가 전부 재현된다. 그 조건의 평균 DAU/MAU는 23.8%(약 24%), 오늘 DAU/MAU는 14.3%다.
파워유저 곡선은 제공값 중 11일 활동자만 3→2명이며 나머지는 동일하다.

## 권한

- 기존 운영 RPC와 동일하게 SECURITY DEFINER + `public.users.id=auth.uid()` / `role='admin'` 검사 후 집계.
- PUBLIC/anon EXECUTE 회수, authenticated에만 EXECUTE 허용. 인증된 일반 사용자도 함수 본문에서 차단한다.
- 새 함수에는 `SET search_path TO ''`, 모든 테이블과 auth 함수는 스키마 한정.
- 원격에서 확인한 기존 get_admin_ops_stats는 현재 search_path='public'이었다. '71개 모두 빈 경로'라는 과거 기록과 다르지만 이번에 기존 함수를 수정하지 않았다.
- 공식 참고: https://supabase.com/docs/guides/database/functions (SECURITY DEFINER와 EXECUTE 권한).

## 검증

- 루트 npm run build, 변경 TS/TSX ESLint 통과. tsconfig의 apps 제외 유지.
- 원격 읽기 전용 집계 검산, 빈 모집단, KST 23:59/00:00, 같은 날 중복, 아직 끝나지 않은 잔존 날짜 제외, 부활 경계, 첫 글 24시간 테스트.
- 성장 응답 파서의 정상/null 분모/누락/배열 불량/NaN 거부 테스트.
- 브라우저는 운영 인증을 우회하거나 수정하지 않고, 빌드된 화면을 로컬 전용 테스트 응답으로 확인한다. 실제 관리자 세션을 통한 신규 RPC 호출은 원격 마이그레이션 적용 후 필요하다.
- 로컬 빌드 화면에서 운영/성장 전환 및 성장 실패 시 운영 유지, KPI 실패 시 오류 표시/성장 유지 검증 통과. 1280px/375px 캡처와 DOM 가로 넘침 검사 통과. 검증용 서버는 종료했고 기존 개발 서버 `http://localhost:3000/admin`은 로그인 리다이렉트 정상 확인.
